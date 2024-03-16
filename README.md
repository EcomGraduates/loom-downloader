---
# Loom Video Downloader

Loom Video Downloader is a simple Node.js command-line tool to download videos from loom.com. It retrieves the video download link based on the video ID in the URL and saves the video with a specified filename, a prefix for multiple files, or by default, the video ID.

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

### Download a Single Video

To download a single video from loom.com, run the following command, replacing `[VideoId]` with the actual video ID from the URL:

```
node loom-dl.js --url https://www.loom.com/share/[VideoId]
```

This will download the video and save it as `[VideoId].mp4`.

You can specify a different output filename with the `--out` or `-o` option:

```
node loom-dl.js --url https://www.loom.com/share/[VideoId] --out [FileName].mp4 or node loom-dl.js --url https://www.loom.com/share/[VideoId] --out path/to/[FileName].mp4
```

This will download the video and save it as `[FileName].mp4`.

### Download Multiple Videos

To download multiple videos listed in a text file, use the `--list` option. Create a text file with one video URL per line and pass the file path to the script:

```
node loom-dl.js --list path/to/urls.txt
```

By default, each video will be saved with its video ID as the filename.

You can specify a filename prefix with the `--prefix` option. The script will append an auto-incrementing number to each downloaded video:

```
node loom-dl.js --list path/to/urls.txt --prefix download --out path/to/output
```

This will save the videos with the specified prefix "download" and an incremented number in the given output directory. download-1.mp4 download-2.mp4
**If no output path is specified it will default to Downloads folder**

### Avoid rate limiting

To prevent getting firewalled or rate-limited, a timeout can be set between downloads using the `--timeout` option:

```
node loom-dl.js --list path/to/urls.txt --prefix download --out path/to/output --timeout 5000
```

This will add a 5-second wait time between each download. adjust as needed.

### installing via NPM

run npm install loom-dl in terminal

```
npm i loom-dl
```

### use command loom-dl

follow the same commands as above but replace node loom-dl.js with loom-dl

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Contributors

- [lestercoyoyjr](https://github.com/lestercoyoyjr) for [A way to make videos downloaded be downloaded in a specific folder for downloads.](https://github.com/EcomGraduates/loom-downloader/pull/4)

- [werkamsus](https://github.com/werkamsus) for [add resume functionality](https://github.com/EcomGraduates/loom-downloader/pull/6)
## License

This project is open source and available under the [MIT License](https://choosealicense.com/licenses/mit/).

---
