# 🎥 Loom Video Downloader

[![npm version](https://img.shields.io/npm/v/loom-dl.svg)](https://www.npmjs.com/package/loom-dl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2012.0.0-brightgreen.svg)](https://nodejs.org/)

> 📥 A simple and powerful Node.js command-line tool to download videos from loom.com

Loom Video Downloader makes it easy to download videos from Loom by simply providing the video URL. It supports both single video downloads and batch downloads from a list of URLs, with customizable output options and rate limiting to avoid getting blocked.

## ✨ Features

- 🎯 **Single Video Download** - Download any Loom video with just the URL
- 📋 **Batch Download** - Process multiple videos from a text file
- � **Progress Bars** - Real-time download progress with ETA
- ⏯️ **Resume Downloads** - Smart resume functionality for interrupted downloads
- 🎥 **Quality Selection** - Choose video quality with automatic analysis
- �📁 **Custom Output** - Specify output directory and filename
- 🏷️ **Filename Prefix** - Add custom prefixes for batch downloads
- ⏱️ **Rate Limiting** - Built-in timeout to avoid getting blocked
- ⚙️ **Configuration File** - Save default settings for consistent usage
- 🚀 **Easy to Use** - Simple command-line interface

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js 12.0.0** or higher installed on your machine.

- [Download Node.js](https://nodejs.org/) 

### 📦 Installation

#### Option 1: Global Installation (Recommended)
```bash
npm install -g loom-dl
```

#### Option 2: Clone Repository
```bash
# Clone the repository
git clone https://github.com/EcomGraduates/loom-downloader.git

# Navigate to project directory
cd loom-downloader

# Install dependencies
npm install

# Run the tool
node loom-dl.js --url https://www.loom.com/share/[VideoId]
```

### 🔧 Dependencies

| Package | Purpose |
|---------|---------|
| [`axios`](https://www.npmjs.com/package/axios) | 🌐 Promise-based HTTP client for API requests |
| [`cli-progress`](https://www.npmjs.com/package/cli-progress) | 📊 Beautiful progress bars for terminal |
| [`fs`](https://nodejs.org/api/fs.html) | 📁 Node.js file system operations |
| [`https`](https://nodejs.org/api/https.html) | 🔒 HTTPS protocol support |
| [`yargs`](https://www.npmjs.com/package/yargs) | ⚙️ Command-line argument parsing |

## 📖 Usage

### 🎯 Download a Single Video

Download any Loom video using its URL:

```bash
loom-dl --url https://www.loom.com/share/[VideoId]
```

**💡 Example:**
```bash
loom-dl --url https://www.loom.com/share/abc123def456
# Downloads as: abc123def456.mp4
```

#### Custom Output Filename

Specify a custom filename and location:

```bash
# Custom filename
loom-dl --url https://www.loom.com/share/[VideoId] --out my-video.mp4

# Custom path and filename
loom-dl --url https://www.loom.com/share/[VideoId] --out path/to/my-video.mp4
```

### 📋 Download Multiple Videos

Process multiple videos from a text file:

#### 1. Create a URL list file
Create a text file with one Loom URL per line:

```text
# urls.txt
https://www.loom.com/share/video1-id
https://www.loom.com/share/video2-id
https://www.loom.com/share/video3-id
```

#### 2. Run batch download
```bash
loom-dl --list path/to/urls.txt
```

#### 3. With custom prefix and output directory
```bash
loom-dl --list urls.txt --prefix "tutorial" --out ./downloads
```

**📁 Output:** `tutorial-1.mp4`, `tutorial-2.mp4`, `tutorial-3.mp4`

> **📝 Note:** If no output path is specified, files will be saved to your **Downloads** folder

### ⏱️ Rate Limiting

Prevent getting blocked by adding delays between downloads:

```bash
loom-dl --list urls.txt --prefix download --out ./output --timeout 5000
```

This adds a **5-second delay** between each download. Adjust the timeout value as needed.

## 📋 Command Reference

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--url` | `-u` | Single video URL | `--url https://loom.com/share/abc123` |
| `--list` | `-l` | File with multiple URLs | `--list urls.txt` |
| `--out` | `-o` | Output path/filename | `--out ./downloads/video.mp4` |
| `--prefix` | `-p` | Filename prefix for batch | `--prefix "meeting"` |
| `--timeout` | `-t` | Delay between downloads (ms) | `--timeout 3000` |
| `--resume` | `-r` | Resume incomplete downloads | `--resume` or `--no-resume` |
| `--quality` | `-q` | Video quality preference | `--quality 720p` |
| `--save-config` | | Save current options as defaults | `--save-config --quality best` |
| `--show-config` | | Display current configuration | `--show-config` |
| `--reset-config` | | Reset configuration to defaults | `--reset-config` |
| `--transcript` | | Also download transcript as JSON | `--transcript` |
| `--transcript-only` | | Download only the transcript | `--transcript-only` |
| `--image` | | Also download the video thumbnail (JPG) | `--image` |
| `--gif` | | Also download the video thumbnail as GIF | `--gif` |
| `--seek-preview` | | Also download seek preview sprite + VTT (scrubber thumbnails) | `--seek-preview` |
| `--use-title` | | Use video title as filename instead of video ID | `--use-title` |
| `--mcp` | | Start as MCP server (for AI assistants) | `--mcp` |

### Use as MCP server (AI assistants)

You can run the tool as an **MCP (Model Context Protocol) server** so AI assistants (e.g. Cursor, Claude Desktop) can download Loom videos for you via tools.

**1. Add to your MCP config** (e.g. Cursor settings or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "loom-downloader": {
      "command": "npx",
      "args": ["-y", "loom-dl@latest", "--mcp"]
    }
  }
}
```

**2. Tools exposed to the AI**

| Tool | Description |
|------|-------------|
| `download_loom_video` | Download a Loom video from a share URL. Optional: `output_dir`, `with_transcript`, `with_image`, `with_gif`, `with_seek_preview`. |
| `get_loom_video_info` | Get video info (title, duration, transcript availability) without downloading. |

**Example (AI can call):**  
`download_loom_video({ "url": "https://www.loom.com/share/VIDEO_ID", "with_transcript": true })`

## 🚀 Quick Start Examples

```bash
# Download single video
loom-dl --url https://www.loom.com/share/abc123def456

# Download with custom name
loom-dl --url https://www.loom.com/share/abc123def456 --out "my-presentation.mp4"

# Batch download with prefix
loom-dl --list videos.txt --prefix "course" --out ./downloads

# Batch download with rate limiting
loom-dl --list videos.txt --timeout 3000 --prefix "meeting"

# Download with original video title as filename
loom-dl --url https://www.loom.com/share/abc123def456 --use-title

# Batch download using video titles as filenames
loom-dl --list videos.txt --out ./downloads --use-title
```

## 🌐 Web Interface

This project also includes a web-based UI for downloading Loom videos without using the command line!

### 🖥️ Run Locally

#### Prerequisites
- Node.js 12.0.0 or higher
- npm or pnpm

#### Local Setup

1. **Clone and install dependencies:**
```bash
git clone https://github.com/EcomGraduates/loom-downloader.git
cd loom-downloader/server
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open in your browser:**
```
http://localhost:3000
```

4. **How to use:**
   - Paste your Loom video URL in the input field
   - Click "Get Download Link"
   - The video will automatically download to your Downloads folder

### ☁️ Deploy to Render (Free Tier)

Deploy the web interface to Render for free hosting:

#### Step 1: Prepare your repository
Ensure the `server/` folder is at the root level with:
- `server/server.js`
- `server/public/index.html`
- `server/package.json`

#### Step 2: Create Render account
1. Go to [render.com](https://render.com) and sign up for free
2. Connect your GitHub account

#### Step 3: Create a new Web Service
1. Click "New +" → "Web Service"
2. Select your `loom-downloader` repository
3. Fill in the settings:
   - **Name:** `loom-downloader`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Runtime:** Leave as default

#### Step 4: Configure environment
1. Make sure the server listens on the correct port (Render sets `PORT` env variable)
2. The `server.js` file already handles this: `const PORT = process.env.PORT || 3000`

#### Step 5: Deploy
Click "Create Web Service" and wait for deployment. Once live, you'll get a URL like:
```
https://loom-downloader-xxxx.onrender.com
```

#### Step 6: Use your deployed version
- Visit your Render URL in any browser
- Paste a Loom video URL
- Click "Get Download Link"
- Video downloads automatically!

### 📝 Notes on Render Free Tier

✅ **Pros:**
- Completely free
- Auto-deploys on git push
- HTTPS included
- Suitable for personal use

⚠️ **Limitations:**
- Server spins down after 15 minutes of inactivity (first request takes ~30s)
- Limited to 100GB bandwidth/month
- Single instance only

💡 **Tip:** The first request will be slow due to the spin-up time, but subsequent requests are fast. For production use, consider upgrading to a paid plan.

## ⚙️ Configuration Management

### 📁 Save Default Settings

Save your preferred settings to avoid repeating them:

```bash
# Save preferred quality and timeout settings
loom-dl --save-config --quality best --timeout 2000 --prefix "MyVideos_"

# Now all future downloads will use these defaults
loom-dl --url https://www.loom.com/share/abc123def456
```

### 📋 View Current Configuration

Check your current default settings:

```bash
loom-dl --show-config
```

**Example output:**
```json
{
  "quality": "best",
  "resume": true,
  "timeout": 2000,
  "outputDir": "downloads",
  "prefix": "MyVideos_"
}
```

### 🔄 Reset to Defaults

Reset all settings back to the original defaults:

```bash
loom-dl --reset-config
```

### 📝 Configuration File

Settings are stored in `.loomrc.json` in the project directory. You can also edit this file directly:

```json
{
  "quality": "720p",
  "resume": true,
  "timeout": 1000,
  "outputDir": "downloads",
  "prefix": ""
}
```

**Available Settings:**
- `quality`: Video quality preference (`auto`, `480p`, `720p`, `1080p`, `best`)
- `resume`: Enable/disable resume functionality (`true`/`false`)
- `timeout`: Delay between downloads in milliseconds
- `outputDir`: Default output directory
- `prefix`: Default filename prefix

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or any other enhancements, your help is appreciated.

🤝 **Please read our [Contributing Guide](CONTRIBUTING.md) for detailed information on:**
- How to set up the development environment
- Coding standards and best practices
- How to submit pull requests
- Reporting issues and requesting features

Quick start: Fork → Create branch → Make changes → Test → Submit PR

## 👥 Contributors

We appreciate all contributors who have helped improve this project:

| Contributor | Contribution |
|-------------|--------------|
| [@lestercoyoyjr](https://github.com/lestercoyoyjr) | 📁 [Added output folder functionality](https://github.com/EcomGraduates/loom-downloader/pull/4) |
| [@werkamsus](https://github.com/werkamsus) | ⏯️ [Added resume functionality](https://github.com/EcomGraduates/loom-downloader/pull/6) |
| [@juansilvadesign](https://github.com/juansilvadesign) | ⚙️ [Added configuration file support, progress bars & quality selection](https://github.com/EcomGraduates/loom-downloader/pull/10) |

## 🔒 Security

Security is important to us. If you discover a security vulnerability, please report it responsibly.

📋 **Please read our [Security Policy](SECURITY.md) for:**
- How to report security vulnerabilities
- Our response timeline and process
- Supported versions and security updates
- Security best practices for users

🚨 **Do not report security vulnerabilities through public issues!**

## 🐛 Issues & Support

Found a bug or need help? We're here to assist!

- 🐛 [Report a Bug](https://github.com/EcomGraduates/loom-downloader/issues/new?labels=bug)
- 💡 [Request a Feature](https://github.com/EcomGraduates/loom-downloader/issues/new?labels=enhancement)
- 💬 [Ask a Question](https://github.com/EcomGraduates/loom-downloader/discussions)
- 🔒 [Report Security Issue](https://github.com/EcomGraduates/loom-downloader/security/advisories/new)

## 📄 License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).

---

<div align="center">

**⭐ If this tool helped you, please give it a star! ⭐**

Made with ❤️ by the community

</div>
