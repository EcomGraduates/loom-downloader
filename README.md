# 🎥 Loom Video Downloader

[![npm version](https://img.shields.io/npm/v/loom-dl.svg)](https://www.npmjs.com/package/loom-dl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2012.0.0-brightgreen.svg)](https://nodejs.org/)

> 📥 A simple and powerful Node.js command-line tool to download videos from loom.com

Loom Video Downloader makes it easy to download videos from Loom by simply providing the video URL. It supports both single video downloads and batch downloads from a list of URLs, with customizable output options and rate limiting to avoid getting blocked.

## ✨ Features

- 🎯 **Single Video Download** - Download any Loom video with just the URL
- 📋 **Batch Download** - Process multiple videos from a text file
- 📁 **Custom Output** - Specify output directory and filename
- 🏷️ **Filename Prefix** - Add custom prefixes for batch downloads
- ⏱️ **Rate Limiting** - Built-in timeout to avoid getting blocked
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
```

### 🔧 Dependencies

| Package | Purpose |
|---------|---------|
| [`axios`](https://www.npmjs.com/package/axios) | 🌐 Promise-based HTTP client for API requests |
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
```

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
