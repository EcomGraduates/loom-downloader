#!/usr/bin/env node
import axios from 'axios';
import fs, { promises as fsPromises } from 'fs';
import https from 'https';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'Url of the video in the format https://www.loom.com/share/[ID]'
  })
  .option('list', {
    alias: 'l',
    type: 'string',
    description: 'Filename of the text file containing the list of URLs'
  })
  .option('prefix', {
    alias: 'p',
    type: 'string',
    description: 'Prefix for the output filenames when downloading from a list'
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Path to output the file to or directory to output files when using --list'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    description: 'Timeout in milliseconds to wait between downloads when using --list'
  })
  .check((argv) => {
    if (!argv.url && !argv.list) {
      throw new Error('Please provide either a single video URL with --url or a list of URLs with --list to proceed');
    }
    if (argv.url && argv.list) {
      throw new Error('Please provide either --url or --list, not both');
    }
    if (argv.timeout && argv.timeout < 0) {
      throw new Error('Please provide a non-negative number for --timeout');
    }
    return true;
  })
  .help()
  .alias('help', 'h')
  .argv;

const fetchLoomDownloadUrl = async (id) => {
  const { data } = await axios.post(`https://www.loom.com/api/campaigns/sessions/${id}/transcoded-url`);
  return data.url;
};

const backoff = (retries, fn, delay = 1000) => fn().catch(err => retries > 1 && delay <= 32000 ? new Promise(resolve => setTimeout(resolve, delay)).then(() => backoff(retries - 1, fn, delay * 2)) : Promise.reject(err));

const downloadLoomVideo = async (url, outputPath) => {
  try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const file = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
      https.get(url, function (response) {
        if (response.statusCode === 403) {
          reject(new Error('Received 403 Forbidden'));
        } else {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }
      }).on('error', (err) => {
        fs.unlink(outputPath, () => { }); // Delete partial file
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error during download process: ${error.message}`);
    throw error; // Rethrow to handle in backoff
  }
};

const appendToLogFile = async (id) => {
  await fsPromises.appendFile(path.join(__dirname, 'downloaded.log'), `${id}\n`);
};

const readDownloadedLog = async () => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'downloaded.log'), 'utf8');
    return new Set(data.split(/\r?\n/));
  } catch (error) {
    return new Set(); // If file doesn't exist, return an empty set
  }
};

const extractId = (url) => {
  url = url.split('?')[0];
  return url.split('/').pop();
};

const delay = (duration) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

// Helper function to control concurrency
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

// Modified downloadFromList to use asyncPool for controlled concurrency
const downloadFromList = async () => {
  const downloadedSet = await readDownloadedLog();
  const filePath = path.resolve(argv.list);
  const fileContent = await fsPromises.readFile(filePath, 'utf8');
  const urls = fileContent.split(/\r?\n/).filter(url => url.trim() && !downloadedSet.has(url));
  const outputDirectory = argv.out ? path.resolve(argv.out) : path.join(__dirname, 'Downloads');

  // Define the download task for each URL, including a delay after each download
  const downloadTask = async (url) => {
    const id = extractId(url);
    try {
      const downloadUrl = await fetchLoomDownloadUrl(id);
      // Modify filename to include the video ID at the end
      let filename = argv.prefix ? `${argv.prefix}-${urls.indexOf(url) + 1}-${id}.mp4` : `${id}.mp4`;
      let outputPath = path.join(outputDirectory, filename);
      console.log(`Downloading video ${id} and saving to ${outputPath}`);
      await backoff(5, () => downloadLoomVideo(downloadUrl, outputPath));
      await appendToLogFile(url);
      console.log(`Waiting for 5 seconds before the next download...`);
      await delay(5000); // 5-second delay
    } catch (error) {
      console.error(`Failed to download video ${id}: ${error.message}`);
    }
  };

  // Use asyncPool to control the concurrency of download tasks
  const concurrencyLimit = 5; // Adjust the concurrency limit as needed
  await asyncPool(concurrencyLimit, urls, downloadTask);
};

const downloadSingleFile = async () => {
  const id = extractId(argv.url);
  const url = await fetchLoomDownloadUrl(id);
  const filename = argv.out || `${id}.mp4`;
  console.log(`Downloading video ${id} and saving to ${filename}`);
  downloadLoomVideo(url, filename);
};

const main = async () => {
  if (argv.list) {
    await downloadFromList();
  } else if (argv.url) {
    await downloadSingleFile();
  }
};

main();
