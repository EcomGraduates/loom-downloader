#!/usr/bin/env node
import axios from 'axios';
import { spawn } from 'child_process';
import cliProgress from 'cli-progress';
import fs, { promises as fsPromises } from 'fs';
import https from 'https';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration file management
const CONFIG_FILE = path.join(__dirname, '.loomrc.json');

const DEFAULT_CONFIG = {
  quality: 'auto',
  resume: true,
  timeout: 1000,
  outputDir: '.',  // current working directory (where command is run)
  prefix: '',
  transcript: false
};

const loadConfig = async () => {
  try {
    const configData = await fsPromises.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
  } catch {
    return DEFAULT_CONFIG;
  }
};

const saveConfig = async (config) => {
  try {
    await fsPromises.writeFile(CONFIG_FILE, JSON.stringify({ ...DEFAULT_CONFIG, ...config }, null, 2), 'utf8');
    console.log(`Configuration saved to ${CONFIG_FILE}`);
    return true;
  } catch (error) {
    console.error(`Failed to save configuration: ${error.message}`);
    return false;
  }
};

const showConfig = async () => {
  const config = await loadConfig();
  console.log('Current Configuration:');
  console.log(JSON.stringify(config, null, 2));
};

const resetConfig = async () => {
  try {
    await fsPromises.unlink(CONFIG_FILE);
    console.log('Configuration reset to defaults');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to reset configuration: ${error.message}`);
    } else {
      console.log('Configuration was already at defaults');
    }
  }
};

const config = await loadConfig();

const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'URL of the video (https://www.loom.com/share/[ID])'
  })
  .option('list', {
    alias: 'l',
    type: 'string',
    description: 'Text file containing list of URLs'
  })
  .option('prefix', {
    alias: 'p',
    type: 'string',
    default: config.prefix,
    description: 'Prefix for output filenames (batch mode)'
  })
  .option('out', {
    alias: 'o',
    type: 'string',
    default: config.outputDir,
    description: 'Output file path or directory (default: current directory)'
  })
  .option('timeout', {
    alias: 't',
    type: 'number',
    default: config.timeout,
    description: 'Timeout (ms) between batch downloads'
  })
  .option('resume', {
    alias: 'r',
    type: 'boolean',
    default: config.resume,
    description: 'Resume incomplete downloads'
  })
  .option('quality', {
    alias: 'q',
    type: 'string',
    choices: ['auto', '480p', '720p', '1080p', 'best'],
    default: config.quality,
    description: 'Video quality preference'
  })
  .option('transcript', {
    type: 'boolean',
    default: config.transcript,
    description: 'Also download transcript as JSON'
  })
  .option('transcript-only', {
    type: 'boolean',
    description: 'Download only the transcript (skip video)'
  })
  .option('image', {
    type: 'boolean',
    description: 'Also download the video thumbnail image (JPG)'
  })
  .option('gif', {
    type: 'boolean',
    description: 'Also download the video thumbnail as GIF'
  })
  .option('seek-preview', {
    type: 'boolean',
    description: 'Also download the seek preview sprite image and VTT (for scrubber thumbnails)'
  })
  .option('save-config', {
    type: 'boolean',
    description: 'Save current options as defaults'
  })
  .option('show-config', {
    type: 'boolean',
    description: 'Display current configuration'
  })
  .option('reset-config', {
    type: 'boolean',
    description: 'Reset configuration to defaults'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Enable verbose output'
  })
  .option('mcp', {
    type: 'boolean',
    description: 'Start as MCP server (for AI assistants)'
  })
  .check((argv) => {
    if (argv.mcp) return true;
    if (!argv.url && !argv.list && !argv['show-config'] && !argv['reset-config'] && !argv['save-config']) {
      throw new Error('Please provide --url or --list');
    }
    if (argv.url && argv.list) {
      throw new Error('Use either --url or --list, not both');
    }
    return true;
  })
  .help()
  .alias('help', 'h')
  .argv;

// Handle config commands
if (argv['show-config']) {
  await showConfig();
  process.exit(0);
}

if (argv['reset-config']) {
  await resetConfig();
  process.exit(0);
}

if (argv['save-config']) {
  await saveConfig({
    quality: argv.quality,
    resume: argv.resume,
    timeout: argv.timeout,
    outputDir: argv.out || config.outputDir,
    prefix: argv.prefix || config.prefix,
    transcript: argv.transcript
  });
  if (!argv.url && !argv.list) process.exit(0);
}

// Fetch video and transcript info from Loom page
const fetchLoomVideoInfo = async (id) => {
  const shareUrl = `https://www.loom.com/share/${id}`;
  const { data: html } = await axios.get(shareUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }
  });

  const apolloMatch = html.match(/window\.__APOLLO_STATE__\s*=\s*(\{.+?\});?\s*<\/script>/s);
  if (!apolloMatch) {
    throw new Error('Could not find video data on page');
  }

  const apolloData = JSON.parse(apolloMatch[1]);
  let videoInfo = { type: null, url: null, credentials: null };
  let transcriptInfo = { url: null, captionsUrl: null };
  let videoTitle = null;

  for (const key of Object.keys(apolloData)) {
    const obj = apolloData[key];
    if (!obj || typeof obj !== 'object') continue;

    // Get video title
    if (obj.name && obj.__typename?.includes('Video')) {
      videoTitle = obj.name;
    }

    // Get HLS stream URL with credentials
    const m3u8Key = Object.keys(obj).find(k => k.includes('M3U8') && obj[k]?.url);
    if (m3u8Key && obj[m3u8Key]?.url) {
      const credentials = obj[m3u8Key]?.credentials;
      videoInfo = {
        type: 'hls',
        url: obj[m3u8Key].url,
        credentials: credentials ? {
          policy: credentials.Policy,
          signature: credentials.Signature,
          keyPairId: credentials.KeyPairId
        } : null
      };
    }

    // Get transcript URL
    if (obj.source_url && obj.__typename === 'VideoTranscriptDetails') {
      transcriptInfo.url = obj.source_url;
      transcriptInfo.captionsUrl = obj.captions_source_url;
    }
  }

  // Seek preview: signed URLs for sprite image and VTT (from Apollo state or HTML)
  const seekPreview = { imageUrl: null, vttUrl: null };
  const findUrlsInObject = (obj, predicate, found = new Set()) => {
    if (!obj) return;
    if (typeof obj === 'string' && predicate(obj)) { found.add(obj); return; }
    if (Array.isArray(obj)) { obj.forEach(item => findUrlsInObject(item, predicate, found)); return; }
    if (typeof obj === 'object') { Object.values(obj).forEach(v => findUrlsInObject(v, predicate, found)); }
  };
  // Apollo: look for mediametadata/seekpreview/ URLs
  const seekSet = new Set();
  findUrlsInObject(apolloData, (s) => typeof s === 'string' && s.includes('mediametadata/seekpreview/'), seekSet);
  for (const u of seekSet) {
    if (u.includes('.jpg') || u.endsWith('.jpg')) seekPreview.imageUrl = u;
    if (u.includes('.vtt') || u.endsWith('.vtt')) seekPreview.vttUrl = u;
  }
  // Apollo fallback: any URL containing seekpreview and .jpg/.vtt (e.g. different path)
  if (!seekPreview.imageUrl || !seekPreview.vttUrl) {
    const seekSet2 = new Set();
    findUrlsInObject(apolloData, (s) => typeof s === 'string' && /seekpreview/i.test(s) && (/\.jpg(\?|$)/.test(s) || /\.vtt(\?|$)/.test(s)), seekSet2);
    for (const u of seekSet2) {
      if ((u.includes('.jpg') || u.endsWith('.jpg')) && !seekPreview.imageUrl) seekPreview.imageUrl = u;
      if ((u.includes('.vtt') || u.endsWith('.vtt')) && !seekPreview.vttUrl) seekPreview.vttUrl = u;
    }
  }
  // HTML fallback: find signed seek preview URLs in raw HTML
  if (!seekPreview.imageUrl || !seekPreview.vttUrl) {
    const seekJpgMatch = html.match(/https:\/\/[^"'\s]*mediametadata\/seekpreview\/[^"'\s]*\.jpg[^"'\s]*/);
    const seekVttMatch = html.match(/https:\/\/[^"'\s]*mediametadata\/seekpreview\/[^"'\s]*\.vtt[^"'\s]*/);
    if (seekJpgMatch) seekPreview.imageUrl = seekPreview.imageUrl || seekJpgMatch[0].replace(/\\u0026/g, '&');
    if (seekVttMatch) seekPreview.vttUrl = seekPreview.vttUrl || seekVttMatch[0].replace(/\\u0026/g, '&');
  }
  // GraphQL fallback: GetVideoSeekPreview returns signed VTT URL; sprite uses same path with .jpg
  if (!seekPreview.vttUrl) {
    try {
      const gqlPayload = {
        operationName: 'GetVideoSeekPreview',
        variables: { videoId: id, trimId: null, password: null },
        query: 'query GetVideoSeekPreview($videoId: ID!, $trimId: String, $password: String) { getVideo(id: $videoId, password: $password) { ... on RegularUserVideo { id seekPreviewCdnUrl(trimId: $trimId) __typename } __typename } }'
      };
      const { data: gql } = await axios.post('https://www.loom.com/graphql', gqlPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': 'https://www.loom.com',
          'Referer': shareUrl,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'apollographql-client-name': 'web',
          'apollographql-client-version': 'ae4e8f8'
        }
      });
      const cdnUrl = gql?.data?.getVideo?.seekPreviewCdnUrl;
      if (cdnUrl && typeof cdnUrl === 'string') {
        seekPreview.vttUrl = cdnUrl;
        if (!seekPreview.imageUrl) {
          seekPreview.imageUrl = cdnUrl.replace(/\.vtt(\?|$)/, '.jpg$1');
        }
      }
    } catch (e) {
      if (argv.verbose) console.warn('GetVideoSeekPreview GraphQL failed:', e.message);
    }
  }

  // Thumbnails: public URLs, no auth
  const thumbnailUrl = `https://cdn.loom.com/sessions/thumbnails/${id}-00001.jpg`;
  const thumbnailGifUrl = `https://cdn.loom.com/sessions/thumbnails/${id}-00001.gif`;

  if (!videoInfo.url && !argv['transcript-only']) {
    // Fallback: try direct MP4 patterns
    const mp4Match = html.match(/https:\/\/cdn\.loom\.com\/sessions\/(?:transcoded|raw)\/[^"'\s\\]+\.mp4/);
    if (mp4Match) {
      videoInfo = { type: 'mp4', url: mp4Match[0], credentials: null };
    }
  }

  if (!videoInfo.url && !argv['transcript-only']) {
    if (argv.verbose) {
      fs.writeFileSync(path.join(__dirname, 'debug-page.html'), html);
      console.log('Debug: Saved page HTML to debug-page.html');
    }
    throw new Error('Could not find video URL');
  }

  return { video: videoInfo, transcript: transcriptInfo, title: videoTitle, thumbnailUrl, thumbnailGifUrl, seekPreview };
};

// Download a URL to a file (for images, VTT, etc.)
const downloadUrlToFile = async (url, outputPath, headers = {}) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const defaultHeaders = { 'Referer': 'https://www.loom.com/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };
  const { data } = await axios.get(url, { responseType: 'arraybuffer', headers: { ...defaultHeaders, ...headers } });
  await fsPromises.writeFile(outputPath, data);
};

// Download transcript JSON
const downloadTranscript = async (transcriptUrl, outputPath) => {
  console.log('Downloading transcript...');
  
  const { data } = await axios.get(transcriptUrl, {
    headers: {
      'Referer': 'https://www.loom.com/',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  // Format transcript for readability
  let formattedTranscript;
  if (data.sentences || data.words) {
    // Extract plain text from transcript
    const sentences = data.sentences || [];
    const plainText = sentences.map(s => s.text || s.value || '').join(' ');
    
    formattedTranscript = {
      plainText,
      sentences,
      words: data.words || [],
      raw: data
    };
  } else {
    formattedTranscript = data;
  }

  await fsPromises.writeFile(outputPath, JSON.stringify(formattedTranscript, null, 2));
  console.log(`Transcript saved to ${outputPath}`);
};

// Check if ffmpeg is available
const checkFfmpeg = () => {
  return new Promise((resolve) => {
    const check = spawn('ffmpeg', ['-version']);
    check.on('error', () => resolve(false));
    check.on('close', (code) => resolve(code === 0));
  });
};

const ffmpegInstallInstructions = `
ffmpeg is required to download Loom videos (HLS streams).

Install ffmpeg:
  macOS:    brew install ffmpeg
  Ubuntu:   sudo apt install ffmpeg
  Windows:  winget install ffmpeg
            -or- choco install ffmpeg
            -or- download from https://ffmpeg.org/download.html

After installing, restart your terminal and try again.`;

// Download HLS stream using ffmpeg
const downloadHlsVideo = async (m3u8Url, outputPath, credentials = null) => {
  // Check ffmpeg availability first
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    throw new Error(ffmpegInstallInstructions);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    console.log('Downloading video with ffmpeg...');
    
    let headers = 'Referer: https://www.loom.com/\r\n';
    if (credentials) {
      headers += `Cookie: CloudFront-Policy=${credentials.policy}; CloudFront-Signature=${credentials.signature}; CloudFront-Key-Pair-Id=${credentials.keyPairId}\r\n`;
    }
    
    const ffmpegArgs = [
      '-headers', headers,
      '-i', m3u8Url,
      '-c', 'copy',
      '-bsf:a', 'aac_adtstoasc',
      '-movflags', '+faststart',
      '-y',
      outputPath
    ];

    if (argv.verbose) {
      console.log('ffmpeg command:', ['ffmpeg', ...ffmpegArgs].join(' '));
    }

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    let duration = 0;
    let lastProgress = '';
    let stderrOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderrOutput += output;
      
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (durationMatch) {
        const [, h, m, s] = durationMatch;
        duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
      }
      
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch && duration > 0) {
        const [, h, m, s] = timeMatch;
        const current = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s);
        const percent = Math.round((current / duration) * 100);
        const progress = `Progress: ${percent}% (${current}s / ${duration}s)`;
        if (progress !== lastProgress) {
          process.stdout.write(`\r${progress}    `);
          lastProgress = progress;
        }
      }
    });

    ffmpeg.on('close', (code) => {
      console.log('');
      if (code === 0) {
        resolve();
      } else {
        if (argv.verbose) {
          console.error('\nffmpeg output:', stderrOutput.split('\n').slice(-15).join('\n'));
        }
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(new Error(ffmpegInstallInstructions));
      } else {
        reject(err);
      }
    });
  });
};

// Download direct MP4 file
const downloadMp4Video = async (url, outputPath, progressBar = null) => {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let resumeFrom = 0;
  let file;
  
  if (argv.resume) {
    try {
      const stats = fs.statSync(outputPath);
      resumeFrom = stats.size;
      if (resumeFrom > 0) {
        console.log(`Resuming from ${(resumeFrom / 1024 / 1024).toFixed(1)} MB...`);
        file = fs.createWriteStream(outputPath, { flags: 'a' });
      }
    } catch { /* file doesn't exist */ }
  }
  
  if (!file) {
    file = fs.createWriteStream(outputPath);
  }
  
  await new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: resumeFrom > 0 ? { 'Range': `bytes=${resumeFrom}-` } : {}
    };
    
    https.get(options, (response) => {
      if (response.statusCode === 403) {
        reject(new Error('403 Forbidden'));
        return;
      }
      if (response.statusCode === 416) {
        console.log('File already complete');
        file.end(resolve);
        return;
      }
      if (response.statusCode !== 200 && response.statusCode !== 206) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);
      const totalSize = response.statusCode === 206 ? resumeFrom + contentLength : contentLength;
      let downloadedSize = resumeFrom;
      const startTime = Date.now();
      
      if (progressBar && totalSize > 0) {
        progressBar.start(totalSize, downloadedSize, { speed: '0.0 MB/s', eta: 'N/A' });
      }
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (progressBar && totalSize > 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? (downloadedSize - resumeFrom) / elapsed : 0;
          const eta = totalSize > downloadedSize ? (totalSize - downloadedSize) / speed : 0;
          progressBar.update(downloadedSize, {
            speed: `${(speed / 1024 / 1024).toFixed(1)} MB/s`,
            eta: eta > 0 ? `${Math.round(eta)}s` : 'N/A'
          });
        }
      });
      
      response.pipe(file);
      file.on('finish', () => {
        if (progressBar) progressBar.stop();
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      if (progressBar) progressBar.stop();
      reject(err);
    });
  });
};

const backoff = (retries, fn, delay = 1000) => 
  fn().catch(err => retries > 1 && delay <= 32000 
    ? new Promise(r => setTimeout(r, delay)).then(() => backoff(retries - 1, fn, delay * 2)) 
    : Promise.reject(err));

// Strip backslashes that shells add when pasting URLs (e.g. \? and \=)
const normalizeLoomUrl = (url) => (typeof url === 'string' ? url.replace(/\\/g, '') : url);

const extractId = (url) => {
  const u = normalizeLoomUrl(url);
  return u.split('?')[0].split('/').pop() || '';
};

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const appendToLogFile = async (id) => {
  await fsPromises.appendFile(path.join(__dirname, 'downloaded.log'), `${id}\n`);
};

const readDownloadedLog = async () => {
  try {
    const data = await fsPromises.readFile(path.join(__dirname, 'downloaded.log'), 'utf8');
    return new Set(data.split(/\r?\n/).map(normalizeLoomUrl).filter(Boolean));
  } catch {
    return new Set();
  }
};

async function asyncPool(limit, array, fn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => fn(item));
    ret.push(p);
    if (limit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

// Resolve output path relative to current working directory (where user runs the command)
const getOutputPath = (id, outputDir, extension = 'mp4') => {
  const dir = path.resolve(outputDir);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${id}.${extension}`);
};

const downloadSingleFile = async () => {
  const id = extractId(argv.url);
  console.log(`Analyzing video ${id}...`);
  
  const info = await fetchLoomVideoInfo(id);
  const outputDir = argv.out ?? config.outputDir ?? '.';
  
  // Determine output path (relative paths are from cwd)
  let videoPath;
  if (argv.out && path.extname(argv.out) !== '') {
    videoPath = path.resolve(argv.out);
  } else {
    videoPath = getOutputPath(id, outputDir, 'mp4');
  }
  
  const transcriptPath = videoPath.replace(/\.mp4$/, '.transcript.json');
  
  // Download transcript if requested
  if ((argv.transcript || argv['transcript-only']) && info.transcript.url) {
    await downloadTranscript(info.transcript.url, transcriptPath);
  } else if ((argv.transcript || argv['transcript-only']) && !info.transcript.url) {
    console.log('No transcript available for this video');
  }

  // Download thumbnail (JPG) if requested
  if (argv.image && info.thumbnailUrl) {
    const thumbPath = videoPath.replace(/\.mp4$/, '-thumbnail.jpg');
    console.log('Downloading thumbnail...');
    await downloadUrlToFile(info.thumbnailUrl, thumbPath);
  }

  // Download thumbnail (GIF) if requested
  if (argv.gif && info.thumbnailGifUrl) {
    const gifPath = videoPath.replace(/\.mp4$/, '-thumbnail.gif');
    console.log('Downloading thumbnail GIF...');
    await downloadUrlToFile(info.thumbnailGifUrl, gifPath);
  }

  // Download seek preview (sprite image + VTT) if requested
  if (argv['seek-preview']) {
    if (info.seekPreview?.imageUrl) {
      const basePath = videoPath.replace(/\.mp4$/, '');
      console.log('Downloading seek preview...');
      await downloadUrlToFile(info.seekPreview.imageUrl, `${basePath}-seek-preview.jpg`);
      if (info.seekPreview.vttUrl) {
        await downloadUrlToFile(info.seekPreview.vttUrl, `${basePath}-seek-preview.vtt`);
      }
    } else {
      console.log('Seek preview URLs not found for this video; skipping.');
    }
  }

  // Skip video if transcript-only
  if (argv['transcript-only']) {
    console.log('Done (transcript only)');
    return;
  }
  
  console.log(`Downloading video to ${videoPath}`);
  
  if (info.video.type === 'hls') {
    await downloadHlsVideo(info.video.url, videoPath, info.video.credentials);
  } else {
    const progressBar = new cliProgress.SingleBar({
      format: 'Progress |{bar}| {percentage}% | {value}/{total} bytes | {speed} | ETA: {eta}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });
    await downloadMp4Video(info.video.url, videoPath, progressBar);
  }
  
  console.log('Download completed!');
};

const downloadFromList = async () => {
  const downloadedSet = await readDownloadedLog();
  const filePath = path.resolve(argv.list);
  const fileContent = await fsPromises.readFile(filePath, 'utf8');
  const urls = fileContent.split(/\r?\n/).map(s => normalizeLoomUrl(s.trim())).filter(u => u && !downloadedSet.has(u));
  const outputDir = argv.out ?? config.outputDir ?? '.';
  const outputDirectory = path.resolve(outputDir);
  fs.mkdirSync(outputDirectory, { recursive: true });

  console.log(`Starting batch download of ${urls.length} videos...\n`);

  const downloadTask = async (url) => {
    const id = extractId(url);
    try {
      const info = await fetchLoomVideoInfo(id);
      const filename = argv.prefix ? `${argv.prefix}-${urls.indexOf(url) + 1}-${id}` : id;
      const videoPath = path.join(outputDirectory, `${filename}.mp4`);
      const transcriptPath = path.join(outputDirectory, `${filename}.transcript.json`);
      
      // Download transcript if requested
      if ((argv.transcript || argv['transcript-only']) && info.transcript.url) {
        await downloadTranscript(info.transcript.url, transcriptPath);
      }

      // Download thumbnail (JPG) if requested
      if (argv.image && info.thumbnailUrl) {
        await downloadUrlToFile(info.thumbnailUrl, path.join(outputDirectory, `${filename}-thumbnail.jpg`));
      }

      // Download thumbnail (GIF) if requested
      if (argv.gif && info.thumbnailGifUrl) {
        await downloadUrlToFile(info.thumbnailGifUrl, path.join(outputDirectory, `${filename}-thumbnail.gif`));
      }

      // Download seek preview if requested
      if (argv['seek-preview']) {
        if (info.seekPreview?.imageUrl) {
          await downloadUrlToFile(info.seekPreview.imageUrl, path.join(outputDirectory, `${filename}-seek-preview.jpg`));
          if (info.seekPreview.vttUrl) {
            await downloadUrlToFile(info.seekPreview.vttUrl, path.join(outputDirectory, `${filename}-seek-preview.vtt`));
          }
        } else if (argv.verbose) {
          console.log(`Seek preview not found for ${filename}; skipping.`);
        }
      }
      
      // Skip video if transcript-only
      if (argv['transcript-only']) {
        console.log(`Done: ${filename} (transcript only)`);
        await appendToLogFile(normalizeLoomUrl(url));
        return;
      }
      
      console.log(`Downloading ${filename}.mp4...`);
      
      if (info.video.type === 'hls') {
        await backoff(5, () => downloadHlsVideo(info.video.url, videoPath, info.video.credentials));
      } else {
        await backoff(5, () => downloadMp4Video(info.video.url, videoPath));
      }
      
      await appendToLogFile(normalizeLoomUrl(url));
      console.log(`Done: ${filename}.mp4`);
      await delay(argv.timeout || 5000);
    } catch (error) {
      console.error(`Failed ${id}: ${error.message}`);
    }
  };

  await asyncPool(5, urls, downloadTask);
  console.log('\nAll downloads completed!');
};

const main = async () => {
  if (argv.list) {
    await downloadFromList();
  } else if (argv.url) {
    await downloadSingleFile();
  }
};

// MCP server: expose download as a tool for AI assistants
async function runMcpServer() {
  const { Server } = await import('@modelcontextprotocol/sdk/server');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
  const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');

  const server = new Server(
    { name: 'loom-downloader', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'download_loom_video',
        description: 'Download a Loom video (and optionally its transcript) from a share URL. Saves to the given output directory or current directory.',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Loom share URL (e.g. https://www.loom.com/share/VIDEO_ID)'
            },
            output_dir: {
              type: 'string',
              description: 'Directory to save the video and transcript (default: current directory)',
              default: '.'
            },
            with_transcript: {
              type: 'boolean',
              description: 'Also download the transcript as JSON',
              default: false
            },
            with_image: {
              type: 'boolean',
              description: 'Also download the video thumbnail image (JPG)',
              default: false
            },
            with_gif: {
              type: 'boolean',
              description: 'Also download the video thumbnail as GIF',
              default: false
            },
            with_seek_preview: {
              type: 'boolean',
              description: 'Also download the seek preview sprite image and VTT (for scrubber thumbnails)',
              default: false
            }
          },
          required: ['url']
        }
      },
      {
        name: 'get_loom_video_info',
        description: 'Get info about a Loom video (title, duration, whether transcript is available) without downloading.',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Loom share URL' }
          },
          required: ['url']
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const safeArgs = args || {};

    try {
      if (name === 'download_loom_video') {
        const url = safeArgs.url;
        const outputDir = path.resolve(safeArgs.output_dir ?? '.');
        const withTranscript = !!safeArgs.with_transcript;
        const withImage = !!safeArgs.with_image;
        const withGif = !!safeArgs.with_gif;
        const withSeekPreview = !!safeArgs.with_seek_preview;
        if (!url) throw new Error('url is required');

        const id = extractId(url);
        const info = await fetchLoomVideoInfo(id);
        const videoPath = getOutputPath(id, outputDir, 'mp4');
        const transcriptPath = videoPath.replace(/\.mp4$/, '.transcript.json');
        const basePath = videoPath.replace(/\.mp4$/, '');

        if (withTranscript && info.transcript?.url) {
          await downloadTranscript(info.transcript.url, transcriptPath);
        }
        if (withImage && info.thumbnailUrl) {
          await downloadUrlToFile(info.thumbnailUrl, `${basePath}-thumbnail.jpg`);
        }
        if (withGif && info.thumbnailGifUrl) {
          await downloadUrlToFile(info.thumbnailGifUrl, `${basePath}-thumbnail.gif`);
        }
        if (withSeekPreview && info.seekPreview?.imageUrl) {
          await downloadUrlToFile(info.seekPreview.imageUrl, `${basePath}-seek-preview.jpg`);
          if (info.seekPreview.vttUrl) {
            await downloadUrlToFile(info.seekPreview.vttUrl, `${basePath}-seek-preview.vtt`);
          }
        }

        if (info.video.type === 'hls') {
          await downloadHlsVideo(info.video.url, videoPath, info.video.credentials);
        } else {
          await downloadMp4Video(info.video.url, videoPath);
        }

        const result = { success: true, videoPath };
        if (withTranscript) result.transcriptPath = transcriptPath;
        if (withImage) result.thumbnailPath = `${basePath}-thumbnail.jpg`;
        if (withGif) result.thumbnailGifPath = `${basePath}-thumbnail.gif`;
        if (withSeekPreview) result.seekPreviewPath = `${basePath}-seek-preview.jpg`;
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }

      if (name === 'get_loom_video_info') {
        const url = safeArgs.url;
        if (!url) throw new Error('url is required');
        const id = extractId(url);
        const info = await fetchLoomVideoInfo(id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              id,
              title: info.title,
              hasTranscript: !!info.transcript?.url,
              videoType: info.video?.type
            }, null, 2)
          }]
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Loom downloader MCP server running on stdio\n');
}

if (argv.mcp) {
  runMcpServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  main();
}
