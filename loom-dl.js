#!/usr/bin/env node
import axios from 'axios';
import fs from 'fs';
import https from 'https';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';

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

const downloadLoomVideo = (url, filename) => {
  const file = fs.createWriteStream(filename);
  https.get(url, function(response) {
    response.pipe(file);
  });
};

const extractId = (url) => {
  url = url.split('?')[0];
  return url.split('/').pop();
};

const delay = (duration) => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

const downloadFromList = async () => {
  const filePath = path.resolve(argv.list);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const urls = fileContent.split(/\r?\n/);
  const outputDirectory = argv.out || '.';

  for (let i = 0; i < urls.length; i++) {
    if (urls[i].trim()) {
      const id = extractId(urls[i]);
      const url = await fetchLoomDownloadUrl(id);
      let filename;
      if (argv.prefix) {
        filename = path.join(outputDirectory, `${argv.prefix}-${i + 1}.mp4`);
      } else {
        filename = path.join(outputDirectory, `${id}.mp4`);
      }
      console.log(`Downloading video ${id} and saving to ${filename}`);
      downloadLoomVideo(url, filename);
      if (argv.timeout) {
        console.log(`Waiting for ${argv.timeout} milliseconds before the next download...`);
        await delay(argv.timeout);
      }
    }
  }
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
