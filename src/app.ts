import { parse } from "ts-command-line-args";
import ytdl from "@distube/ytdl-core";
import fs from "fs";
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

dotenv.config(); // Load environment variables

interface IArgs {
  url: string;
  help?: boolean;
}

const args = parse<IArgs>(
  {
    url: { type: String, alias: "u", description: "YouTube video URL" },
    help: { type: Boolean, alias: "h", description: "Shows help text", optional: true },
  },
  {
    helpArg: "help",
    headerContentSections: [{ header: "YouTube Video Downloader", content: "Downloads a video from YouTube" }],
  }
);

if (!args.url) {
  console.error("Error: Please provide a YouTube URL using --url or -u.");
  process.exit(1);
}

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
}

const videoId = extractVideoId(args.url);
if (!videoId) {
  console.error("Error: Invalid YouTube URL.");
  process.exit(1);
}

console.log(`Downloading video with ID: ${videoId}`);

const filesDir = path.resolve("./files");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

const outputPath = path.resolve(`./files/${videoId}.mp4`);
const videoPath = path.resolve(`./files/${videoId}_video.mp4`);
const audioPath = path.resolve(`./files/${videoId}_audio.mp4`);

const youtubeCookies = process.env.YOUTUBE_COOKIE;

// Progress tracking function
function trackProgress(stream: any, type: "Video" | "Audio") {
  let downloaded = 0;
  // Save cursor position at initialization
  const linePosition = type === "Video" ? 0 : 1;
  
  // Initial setup for position
  if (type === "Video") {
    process.stdout.write("Video Download: 0.00% (0.00MB)\n");
    process.stdout.write("Audio Download: 0.00% (0.00MB)\n");
  }
  
  stream.on("progress", (chunkLength: number, downloadedBytes: number, totalBytes: number) => {
    downloaded = downloadedBytes;
    const percent = ((downloaded / totalBytes) * 100).toFixed(2).padStart(6, " ");
    
    // Move cursor up to the relevant line position
    process.stdout.write(`\x1B[${linePosition + 1};0H`);
    // Clear line and write progress
    process.stdout.write(`\x1B[K${type} Download: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)}MB)`);
    // Move cursor back to bottom
    process.stdout.write(`\x1B[${2};0H`);
  });

  stream.on("end", () => {
    // Move cursor to the relevant line
    process.stdout.write(`\x1B[${linePosition + 1};0H`);
    // Clear and update line
    process.stdout.write(`\x1B[K${type} Download Complete!`);
    // Move cursor back to bottom
    process.stdout.write(`\x1B[${2};0H`);
  });

  stream.on("error", (err: Error) => {
    console.error(`\nError downloading ${type.toLowerCase()}:`, err.message);
    process.exit(1);
  });
}

// Download video stream with progress tracking
console.log("Starting video download...");
const videoStream = ytdl(args.url, {
  quality: "highestvideo",
  requestOptions: { headers: youtubeCookies ? { Cookie: youtubeCookies } : {} },
});
trackProgress(videoStream, "Video");
videoStream.pipe(fs.createWriteStream(videoPath));

// Download audio stream with progress tracking
console.log("Starting audio download...");
const audioStream = ytdl(args.url, {
  quality: "highestaudio",
  filter: "audioonly",
  requestOptions: { headers: youtubeCookies ? { Cookie: youtubeCookies } : {} },
});
trackProgress(audioStream, "Audio");
audioStream.pipe(fs.createWriteStream(audioPath));

// Wait for both downloads to finish
Promise.all([
  new Promise<void>((resolve) => videoStream.on("finish", resolve)),
  new Promise<void>((resolve) => audioStream.on("finish", resolve)),
]).then(() => {
  console.log("Merging video and audio...");

  // Add a new line for merge progress
  process.stdout.write("\nMerging: 0.00%\n");
  
  ffmpeg()
    .input(videoPath)
    .input(audioPath)
    .output(outputPath)
    .on("progress", (progress) => {
      const percent = progress.percent ? progress.percent.toFixed(2) : "0.00";
      // Move cursor up to merge line and clear it
      process.stdout.write(`\x1B[1A\x1B[K`);
      process.stdout.write(`Merging: ${percent}%`);
    })
    .on("end", () => {
      console.log(`\nDownload complete: ${outputPath}`);

      fs.unlinkSync(videoPath);
      fs.unlinkSync(audioPath);
    })
    .on("error", (err) => {
      console.error("\nError merging video and audio:", err.message);
    })
    .run();
});
