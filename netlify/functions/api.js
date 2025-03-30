const { spawn } = require('child_process');
const ytdl = require('yt-dlp-exec');
const ffmpeg = require('ffmpeg-static');

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { url, format, quality, compress } = body;

    // Validate URL
    if (!url) {
      return { statusCode: 400, body: JSON.stringify({ error: 'URL is required' }) };
    }

    // Configure yt-dlp options
    const options = {
      format: format || 'best',
      quality: quality || 'best',
      output: '/tmp/%(title)s.%(ext)s',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: ['referer:youtube.com', 'user-agent:Mozilla/5.0']
    };

    // Download video
    const info = await ytdl(url, options);
    
    // If compression is requested
    if (compress) {
      const inputFile = info.output;
      const outputFile = inputFile.replace(/\.[^/.]+$/, '_compressed.mp4');
      
      await new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpeg, [
          '-i', inputFile,
          '-c:v', 'libx264',
          '-crf', '23',
          '-preset', 'medium',
          '-c:a', 'aac',
          '-b:a', '128k',
          outputFile
        ]);

        ffmpegProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`FFmpeg process exited with code ${code}`));
          }
        });
      });

      // Return compressed video info
      return {
        statusCode: 200,
        body: JSON.stringify({
          title: info.title,
          url: outputFile,
          size: info.filesize,
          format: 'mp4'
        })
      };
    }

    // Return original video info
    return {
      statusCode: 200,
      body: JSON.stringify({
        title: info.title,
        url: info.output,
        size: info.filesize,
        format: info.ext
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 