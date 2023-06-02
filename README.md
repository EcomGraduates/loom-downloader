---

# Loom Video Downloader

Loom Video Downloader is a simple Node.js command-line tool to download videos from loom.com. It retrieves the video download link based on the video ID in the URL and saves the video with a specified filename or, by default, the video ID.

## Getting Started

To run this tool, you need to have Node.js and npm installed on your machine.

### Installation

1. Clone the repo: `git clone https://github.com/EcomGraduates/loom-downloader.git`
2. Install NPM packages: `npm install`

### Dependencies

This tool uses the following npm packages:

- `axios` - Promise based HTTP client for the browser and Node.js.
- `fs` - File system module that allows you to work with the file system on your computer.
- `https` - HTTPS is the HTTP protocol over TLS/SSL.
- `yargs` - Yargs helps you build interactive command line tools, by parsing arguments and generating an elegant user interface.

## Usage

To download a video from loom.com, run the following command, replacing the URL with the URL of the video you want to download:

```
node download.js --url https://www.loom.com/share/[VideoId]
```

This will download the video and save it as `[VideoId].mp4`.

You can specify a different output filename with the `--out` or `-o` option:

```
node download.js --url https://www.loom.com/share/[VideoId] --out [FileName].mp4
```

This will download the video and save it as `[FileName].mp4`.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).

---
