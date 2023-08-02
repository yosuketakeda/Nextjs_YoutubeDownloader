import type { NextApiRequest, NextApiResponse } from 'next';

import ytdl from 'ytdl-core';

const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const cp = require('child_process');
const readline = require('readline');

// Tell fluent-ffmpeg where it can find FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);

type ResponseData = string;

export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {    
    const { youtubeURL, path, type } = JSON.parse(req.body);

    const download = async () => {
        const videoInfo = await ytdl.getBasicInfo(youtubeURL);
        const output = path + '/' + videoInfo.videoDetails.videoId;
        
        if(type == 'video') {  
            const tracker = {
                start: Date.now(),
                audio: { downloaded: 0, total: Infinity },
                video: { downloaded: 0, total: Infinity },
                merged: { frame: 0, speed: '0x', fps: 0 },
            };

            const audio = ytdl(youtubeURL, { quality: 'highestaudio' })
                .on('progress', (_, downloaded, total) => {
                    tracker.audio = { downloaded, total };
                });

            const video = ytdl(youtubeURL, { quality: 'highestvideo' })
                .on('progress', (_, downloaded, total) => {
                    tracker.video = { downloaded, total };
                });

            // Prepare the progress bar
            let progressbarHandle = null;
            const progressbarInterval = 1000;
            const showProgress = () => {
                readline.cursorTo(process.stdout, 0);
                const toMB = i => (i / 1024 / 1024).toFixed(2);

                process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
                process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

                process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
                process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

                process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
                readline.moveCursor(process.stdout, 0, -3);                       
            };

            // Start the ffmpeg child process
            const ffmpegProcess = cp.spawn(ffmpegStatic, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                `${output}.mp4`,
            ], {
                windowsHide: true,
                stdio: [
                    // Standard: stdin, stdout, stderr
                    'inherit', 'inherit', 'inherit',
                    // Custom: pipe:3, pipe:4, pipe:5
                    'pipe', 'pipe', 'pipe',
                ],
            });

            ffmpegProcess.on('close', async () => {
                // Cleanup
                process.stdout.write('\n\n\n\n');
                clearInterval(progressbarHandle);
                res.status(200).json({ message: 'Completed!'});
            });

            // Link streams
            // FFmpeg creates the transformer streams and we just have to insert / read data
            ffmpegProcess.stdio[3].on('data', chunk => {
                // Start the progress bar
                if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                    const [key, value] = l.split('=');
                    args[key.trim()] = value.trim();
                }
                tracker.merged = args;
            });
            audio.pipe(ffmpegProcess.stdio[4]);
            video.pipe(ffmpegProcess.stdio[5]);

        } else {            
            const audio = ytdl(youtubeURL, {
                quality: 'highestaudio'
            });
            
            ffmpeg(audio)
                .audioBitrate(128)
                .save(`${output}.mp3`)
                .on('end', () => {
                    res.status(200).json({ message: 'Completed!'});
                });
        }
    }
    
    download();    
}
