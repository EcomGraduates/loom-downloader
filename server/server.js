const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOADS_DIR = path.join(__dirname, '../downloads');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve frontend files
app.use('/downloads', express.static(DOWNLOADS_DIR)); // Serve downloads

// Extract video ID from Loom URL
function extractVideoId(url) {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Get video download URL from Loom API
async function getVideoDownloadUrl(videoId) {
  try {
    const response = await axios.post(
      `https://www.loom.com/api/campaigns/sessions/${videoId}/transcoded-url`
    );
    return response.data.url;
  } catch (error) {
    throw new Error('Failed to fetch video URL. Please check the video ID.');
  }
}

// Download file from URL using HTTPS
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET'
    };

    const file = fs.createWriteStream(filepath);

    https.get(options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// API Routes
app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid Loom URL' });
    }

    console.log(`Attempting to fetch download URL for video: ${videoId}`);
    const downloadUrl = await getVideoDownloadUrl(videoId);
    console.log(`Successfully retrieved download URL for ${videoId}`);
    
    // Download the video file
    const filename = `${videoId}.mp4`;
    const filepath = path.join(DOWNLOADS_DIR, filename);
    
    // Create downloads directory if it doesn't exist
    if (!fs.existsSync(DOWNLOADS_DIR)) {
      fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
    }

    console.log(`Starting download to: ${filepath}`);
    await downloadFile(downloadUrl, filepath);
    console.log(`Download completed for ${videoId}`);
    
    res.json({ 
      success: true, 
      videoId,
      downloadLink: `/api/download/${filename}`
    });

  } catch (error) {
    console.error('Error in /api/download:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process video' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Download endpoint - triggers browser download
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(DOWNLOADS_DIR, filename);

  // Security: prevent directory traversal
  if (!filepath.startsWith(DOWNLOADS_DIR)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set headers to force download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  
  // Stream the file
  const fileStream = fs.createReadStream(filepath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    console.error('Error streaming file:', err);
    res.status(500).json({ error: 'Error downloading file' });
  });

  // Clean up file after download
  fileStream.on('end', () => {
    setTimeout(() => {
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error deleting file:', err);
        else console.log(`Deleted downloaded file: ${filename}`);
      });
    }, 1000); // Wait 1 second before deleting
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});