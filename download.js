const axios = require('axios');
const fs = require('fs');
const https = require('https');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'Url of the video in the format https://www.loom.com/share/[ID]'
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    description: 'Path to output the file to'
  })
  .demandOption(['url'], 'Please provide the video url to proceed')
  .argv

const fetchLoomDownloadUrl = async (id) => {
  const { data } = await axios.post(`https://www.loom.com/api/campaigns/sessions/${id}/transcoded-url`);
  return data.url;
};

const downloadLoomVideo = (url, filename) => {
  const file = fs.createWriteStream(filename);
  const request = https.get(url, function(response) {
    response.pipe(file);
  });
};

const extractId = (url) => {
  return url.split('/').pop();
};

const main = async () => {
  const id = extractId(argv.url);
  const url = await fetchLoomDownloadUrl(id);
  const filename = argv.out || `${id}.mp4`;
  console.log(`Downloading video ${id} and saving to ${filename}`);
  downloadLoomVideo(url, filename);
};

main();

