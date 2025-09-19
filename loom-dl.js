#!/usr/bin/env node
import axios from 'axios';
import cliProgress from 'cli-progress';
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
  .option('resume', {
    alias: 'r',
    type: 'boolean',
    default: true,
    description: 'Resume incomplete downloads (default: true)'
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

const getPartialFileSize = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

const downloadLoomVideo = async (url, outputPath, progressBar = null) => {
  try {
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Check for resume functionality
    let resumeFrom = 0;
    let file;
    
    if (argv.resume) {
      resumeFrom = getPartialFileSize(outputPath);
      if (resumeFrom > 0) {
        console.log(`Resuming download from ${(resumeFrom / 1024 / 1024).toFixed(1)} MB...`);
        file = fs.createWriteStream(outputPath, { flags: 'a' }); // Append mode
      } else {
        file = fs.createWriteStream(outputPath); // Create new file
      }
    } else {
      file = fs.createWriteStream(outputPath); // Create new file (overwrite)
    }
    
    await new Promise((resolve, reject) => {
      // Set up request options with Range header for resume
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {}
      };
      
      // Add Range header if resuming
      if (resumeFrom > 0) {
        options.headers['Range'] = `bytes=${resumeFrom}-`;
      }
      
      https.get(options, function (response) {
        if (response.statusCode === 403) {
          reject(new Error('Received 403 Forbidden'));
        } else if (response.statusCode === 416) {
          // Range not satisfiable - file might be already complete
          console.log('File appears to be already complete');
          file.close();
          resolve();
          return;
        } else if (response.statusCode !== 200 && response.statusCode !== 206) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        // Handle both partial content (206) and full content (200)
        const contentLength = parseInt(response.headers['content-length'] || '0', 10);
        const totalSize = response.statusCode === 206 ? resumeFrom + contentLength : contentLength;
        let downloadedSize = resumeFrom; // Start from resume point
        const startTime = Date.now();
        
        // Initialize progress bar if provided
        if (progressBar && totalSize > 0) {
          progressBar.start(totalSize, downloadedSize, {
            speed: '0.0 MB/s',
            eta: 'N/A'
          });
        }
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          
          // Update progress bar
          if (progressBar && totalSize > 0) {
            const elapsed = (Date.now() - startTime) / 1000; // seconds
            const currentSessionBytes = downloadedSize - resumeFrom;
            const speed = elapsed > 0 ? currentSessionBytes / elapsed : 0; // bytes per second for current session
            const eta = totalSize > downloadedSize ? (totalSize - downloadedSize) / speed : 0;
            
            progressBar.update(downloadedSize, {
              speed: `${(speed / 1024 / 1024).toFixed(1)} MB/s`,
              eta: eta > 0 ? `${Math.round(eta)}s` : 'N/A'
            });
          }
        });
        
        response.pipe(file);
        file.on('finish', () => {
          if (progressBar) {
            progressBar.stop();
          }
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        if (progressBar) {
          progressBar.stop();
        }
        if (!argv.resume) {
          fs.unlink(outputPath, () => { }); // Delete partial file only if not resuming
        }
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

  // Create multi-progress bar for batch downloads
  const multiBar = new cliProgress.MultiBar({
    format: '{filename} |{bar}| {percentage}% | {value}/{total} bytes | Speed: {speed} | ETA: {eta}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true
  }, cliProgress.Presets.shades_grey);

  console.log(`Starting batch download of ${urls.length} videos...\n`);

  // Define the download task for each URL, including a delay after each download
  const downloadTask = async (url) => {
    const id = extractId(url);
    try {
      const downloadUrl = await fetchLoomDownloadUrl(id);
      // Modify filename to include the video ID at the end
      let filename = argv.prefix ? `${argv.prefix}-${urls.indexOf(url) + 1}-${id}.mp4` : `${id}.mp4`;
      let outputPath = path.join(outputDirectory, filename);
      
      // Create individual progress bar for this download
      const progressBar = multiBar.create(100, 0, {
        filename: filename.length > 30 ? '...' + filename.slice(-27) : filename,
        speed: '0.0 MB/s',
        eta: 'N/A'
      });
      
      await backoff(5, () => downloadLoomVideo(downloadUrl, outputPath, progressBar));
      await appendToLogFile(url);
      console.log(`✓ ${filename} completed`);
      console.log(`Waiting for 5 seconds before the next download...`);
      await delay(5000); // 5-second delay
    } catch (error) {
      console.error(`✗ Failed to download video ${id}: ${error.message}`);
    }
  };

  // Use asyncPool to control the concurrency of download tasks
  const concurrencyLimit = 5; // Adjust the concurrency limit as needed
  await asyncPool(concurrencyLimit, urls, downloadTask);
  
  multiBar.stop();
  console.log('\n🎉 All downloads completed successfully!');
};

const downloadSingleFile = async () => {
  const id = extractId(argv.url);
  const url = await fetchLoomDownloadUrl(id);
  
  let outputPath;
  if (argv.out) {
    outputPath = argv.out;
  } else {
    const downloadsDir = path.join(__dirname, 'downloads');
    outputPath = path.join(downloadsDir, `${id}.mp4`);
  }
  
  console.log(`Downloading video ${id} and saving to ${outputPath}`);
  
  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Download Progress |{bar}| {percentage}% | {value}/{total} bytes | Speed: {speed} | ETA: {eta}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  
  await downloadLoomVideo(url, outputPath, progressBar);
  console.log('\nDownload completed successfully!');
};

const main = async () => {
  if (argv.list) {
    await downloadFromList();
  } else if (argv.url) {
    await downloadSingleFile();
  }
};

main();
