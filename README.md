# YouTube Video Downloader

A simple command-line tool to download YouTube videos in the highest quality. I use this to grab backup copies of videos I feature on my website, in case they don't always live on Youtube.

## Features

- Downloads video and audio streams separately for highest quality
- Automatically merges streams using FFmpeg
- Shows download progress in real-time
- Supports authentication with YouTube cookies (not sure this works, I haven't tested it)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/yt-fetcher.git
   cd yt-fetcher
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

## Requirements

- Node.js (14.x or higher recommended)
- FFmpeg must be installed on your system
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `apt install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Usage

Basic usage:
```
npm start -- --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

Or using the shorthand:
```
npm start -- -u "https://www.youtube.com/watch?v=VIDEO_ID"
```

### Options

- `--url`, `-u`: YouTube video URL (required)
- `--help`, `-h`: Show help text

## Authentication (Optional)

For videos that require authentication:

1. Create a `.env` file in the project root
2. Add your YouTube cookies:
   ```
   YOUTUBE_COOKIE=your_cookies_string_here
   ```

You can obtain the cookie string by:
1. Logging into YouTube in your browser
2. Opening browser DevTools (F12) and going to Network tab
3. Refreshing the page and looking at any request to youtube.com
4. Copying the entire Cookie value from request headers

## Output

Downloaded videos are saved to the `./files` directory with the filename format `{videoId}.mp4`.

## License

ISC