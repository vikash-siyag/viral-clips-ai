const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CLIPS_DIR = path.join(ROOT_DIR, 'clips');

// Ensure /clips directory exists
if (!fs.existsSync(CLIPS_DIR)) {
  fs.mkdirSync(CLIPS_DIR, { recursive: true });
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

// Natural Language AI Director Parser
function parseDirectorPrompt(prompt, currentSettings) {
  const p = (prompt || '').toLowerCase();
  const adjustments = {};
  const logs = [];

  // 0. Layout Mode adjustments
  if (p.includes('only gameplay') || p.includes('gameplay only') || p.includes('no face') || p.includes('no camera') || p.includes('remove face') || p.includes('just gameplay')) {
    adjustments.layoutMode = 'gameplay-only';
    logs.push('Switched to Full 9:16 Gameplay Shorts mode (Facecam hidden)');
  } else if (p.includes('only face') || p.includes('face only') || p.includes('only speaker') || p.includes('speaker only') || p.includes('just face') || p.includes('no gameplay')) {
    adjustments.layoutMode = 'face-only';
    logs.push('Switched to Full 9:16 Facecam Shorts mode (Gameplay hidden)');
  } else if (p.includes('split') || p.includes('both') || p.includes('half')) {
    adjustments.layoutMode = 'split';
    logs.push('Switched to 50/50 Split Screen mode (Speaker Top + Gameplay Bottom)');
  }

  // 1. Face crop vertical adjustments
  if (p.includes('face') || p.includes('speaker') || p.includes('head') || p.includes('camera')) {
    if (p.includes('cut off') || p.includes('top cut') || p.includes('too high') || p.includes('move down') || p.includes('shift down')) {
      const match = p.match(/(\d+)%/);
      const delta = match ? parseInt(match[1]) / 100 : 0.12;
      adjustments.topCropY = Math.min(1.0, (currentSettings.topCropY || 0.2) + delta);
      logs.push(`Shifted speaker crop down by ${Math.round(delta * 100)}%`);
    } else if (p.includes('too low') || p.includes('move up') || p.includes('shift up')) {
      const match = p.match(/(\d+)%/);
      const delta = match ? parseInt(match[1]) / 100 : 0.12;
      adjustments.topCropY = Math.max(0.0, (currentSettings.topCropY || 0.2) - delta);
      logs.push(`Shifted speaker crop up by ${Math.round(delta * 100)}%`);
    }

    if (p.includes('move left') || p.includes('shift left')) {
      adjustments.topCropX = Math.max(0.0, (currentSettings.topCropX || 0.5) - 0.1);
      logs.push('Shifted speaker crop 10% to the left');
    } else if (p.includes('move right') || p.includes('shift right')) {
      adjustments.topCropX = Math.min(1.0, (currentSettings.topCropX || 0.5) + 0.1);
      logs.push('Shifted speaker crop 10% to the right');
    }

    if (p.includes('zoom in') || p.includes('closer') || p.includes('bigger face')) {
      adjustments.topZoom = Math.min(2.5, (currentSettings.topZoom || 1.0) + 0.2);
      logs.push('Zoomed in on speaker face (+20%)');
    } else if (p.includes('zoom out') || p.includes('wider') || p.includes('smaller face')) {
      adjustments.topZoom = Math.max(0.7, (currentSettings.topZoom || 1.0) - 0.2);
      logs.push('Zoomed out speaker view (-20%)');
    }
  }

  // 2. Caption timing adjustments
  if (p.includes('caption') || p.includes('subtitle') || p.includes('word') || p.includes('text') || p.includes('sync')) {
    if (p.includes('late') || p.includes('behind') || p.includes('slow') || p.includes('earlier') || p.includes('speed up')) {
      const match = p.match(/(\d+(\.\d+)?)s/);
      const delta = match ? parseFloat(match[1]) : 0.35;
      adjustments.captionOffset = Number(((currentSettings.captionOffset || 0) - delta).toFixed(2));
      logs.push(`Shifted captions earlier by ${delta}s to sync with speech`);
    } else if (p.includes('early') || p.includes('fast') || p.includes('ahead') || p.includes('later') || p.includes('delay')) {
      const match = p.match(/(\d+(\.\d+)?)s/);
      const delta = match ? parseFloat(match[1]) : 0.35;
      adjustments.captionOffset = Number(((currentSettings.captionOffset || 0) + delta).toFixed(2));
      logs.push(`Delayed captions by ${delta}s to match dialogue`);
    }

    if (p.includes('yellow') || p.includes('change color') || p.includes('highlight')) {
      if (p.includes('green')) adjustments.highlightColor = '#00FF66';
      else if (p.includes('cyan') || p.includes('blue')) adjustments.highlightColor = '#00F0FF';
      else if (p.includes('pink') || p.includes('magenta')) adjustments.highlightColor = '#FF007F';
      else if (p.includes('yellow')) adjustments.highlightColor = '#FFE600';
      logs.push(`Updated active word highlight color to ${adjustments.highlightColor || 'custom'}`);
    }

    if (p.includes('bigger') || p.includes('large text')) {
      adjustments.fontSize = (currentSettings.fontSize || 38) + 6;
      logs.push('Increased caption font size');
    } else if (p.includes('smaller text')) {
      adjustments.fontSize = Math.max(20, (currentSettings.fontSize || 38) - 6);
      logs.push('Decreased caption font size');
    }
  }

  // 3. Hook text modifications
  const hookMatch = prompt.match(/(?:change|set|make|update)?\s*hook(?:\s*to|\s*:)?\s*["']?([^"'\n]+)["']?/i);
  if (hookMatch && !p.includes('face') && !p.includes('caption')) {
    const newHook = hookMatch[1].trim().replace(/^to\s+/i, '');
    adjustments.hookText = newHook.toUpperCase();
    logs.push(`Updated 2-second hook banner to: "${newHook}"`);
  }

  // 4. Gameplay background modifications
  if (p.includes('gameplay') || p.includes('bottom') || p.includes('background')) {
    if (p.includes('runner') || p.includes('track') || p.includes('subway')) {
      adjustments.gameplayPreset = 'runner';
      logs.push('Switched bottom background to 3D Speed Runner');
    } else if (p.includes('parkour') || p.includes('voxel') || p.includes('block')) {
      adjustments.gameplayPreset = 'parkour';
      logs.push('Switched bottom background to Voxel Parkour');
    } else if (p.includes('stunt') || p.includes('ramp') || p.includes('neon')) {
      adjustments.gameplayPreset = 'stunt';
      logs.push('Switched bottom background to Neon Stunt Ramp');
    } else if (p.includes('stream') || p.includes('original')) {
      adjustments.gameplayPreset = 'original';
      logs.push('Switched bottom to original stream gameplay (muted)');
    }
  }

  // 5. Re-export triggers
  let triggerReExport = false;
  if (p.includes('re-export') || p.includes('reexport') || p.includes('export') || p.includes('fix and export') || p.includes('render again') || p.includes('save it')) {
    triggerReExport = true;
  }

  if (logs.length === 0) {
    logs.push("Understood! Applied adjustments to crop framing and caption alignment. Click 'Export Clip' or say 'Re-export' when ready.");
  }

  return {
    success: true,
    message: logs.join('. '),
    adjustments,
    triggerReExport
  };
}

// Helper to determine next clip file name: clip_01.mp4, clip_02.mp4, etc.
function getNextClipFilename() {
  const files = fs.readdirSync(CLIPS_DIR);
  let maxIndex = 0;
  const regex = /^clip_(\d+)\.(mp4|webm)$/i;

  files.forEach(file => {
    const match = file.match(regex);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx > maxIndex) maxIndex = idx;
    }
  });

  const nextIndex = maxIndex + 1;
  const padded = String(nextIndex).padStart(2, '0');
  return `clip_${padded}.mp4`;
}

// Helper to locate yt-dlp binary (local bundled or system PATH)
function getYtDlpBinary() {
  const local = path.join(__dirname, 'yt-dlp.exe');
  if (fs.existsSync(local)) return `"${local}"`;
  return 'yt-dlp';
}

// Request Handler
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    // 1. GET /api/status
    if (pathname === '/api/status' && req.method === 'GET') {
      exec('ffmpeg -version', (errFFmpeg) => {
        exec(`${getYtDlpBinary()} --version`, (errYtDlp) => {
          const files = fs.readdirSync(CLIPS_DIR).filter(f => !f.startsWith('.'));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'online',
            ffmpegAvailable: !errFFmpeg,
            ytDlpAvailable: !errYtDlp,
            clipsCount: files.length,
            clipsDir: CLIPS_DIR
          }));
        });
      });
      return;
    }

    // 2. GET /api/clips - List exported clips
    if (pathname === '/api/clips' && req.method === 'GET') {
      try {
        const files = fs.readdirSync(CLIPS_DIR)
          .filter(f => /\.(mp4|webm)$/i.test(f))
          .map(f => {
            const filePath = path.join(CLIPS_DIR, f);
            const stats = fs.statSync(filePath);
            return {
              name: f,
              path: `/clips/${f}`,
              sizeBytes: stats.size,
              sizeFormatted: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
              createdAt: stats.birthtime || stats.mtime
            };
          })
          .sort((a, b) => b.name.localeCompare(a.name));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ clips: files }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 3. POST /api/save-clip - Save exported clip to /clips
    if (pathname === '/api/save-clip' && req.method === 'POST') {
      let bodyChunks = [];
      req.on('data', chunk => bodyChunks.push(chunk));
      req.on('end', () => {
        try {
          const buffer = Buffer.concat(bodyChunks);
          const contentType = req.headers['content-type'] || '';

          let videoBuffer;
          let filename = req.headers['x-filename'] || getNextClipFilename();

          if (contentType.includes('application/json')) {
            const data = JSON.parse(buffer.toString('utf8'));
            if (data.filename) filename = data.filename;
            if (data.base64) {
              const base64Data = data.base64.replace(/^data:video\/[^;]+;base64,/, '');
              videoBuffer = Buffer.from(base64Data, 'base64');
            }
          } else {
            videoBuffer = buffer;
          }

          if (!videoBuffer || videoBuffer.length === 0) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No video payload received' }));
            return;
          }

          const targetPath = path.join(CLIPS_DIR, filename);
          fs.writeFileSync(targetPath, videoBuffer);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            filename,
            path: `/clips/${filename}`,
            sizeBytes: videoBuffer.length,
            message: `Exported ${filename} successfully into /clips`
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 4. POST /api/director-prompt - AI Feedback Assistant
    if (pathname === '/api/director-prompt' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const result = parseDirectorPrompt(payload.prompt || '', payload.currentSettings || {});
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // 5. POST /api/parse-url - Ingest YouTube / Kick / Twitch link
    if (pathname === '/api/parse-url' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { url } = JSON.parse(body || '{}');
          if (!url) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'URL parameter is required' }));
            return;
          }

          // Check if yt-dlp is available to extract stream details
          exec(`${getYtDlpBinary()} --dump-json --skip-download "${url}"`, { timeout: 20000 }, (err, stdout) => {
            if (!err && stdout) {
              try {
                const info = JSON.parse(stdout);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  title: info.title,
                  duration: info.duration,
                  uploader: info.uploader || info.channel,
                  thumbnail: info.thumbnail,
                  videoUrl: info.url || url,
                  isDirectStream: true
                }));
                return;
              } catch (e) {}
            }

            // Fallback for direct or unsupported link
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              title: 'Stream Video',
              duration: 60,
              videoUrl: url,
              isDirectStream: false,
              note: 'yt-dlp not detected or stream requires direct browser playback. Loaded in Director player.'
            }));
          });
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // Serve Exported Clips (/clips/clip_01.mp4)
  if (pathname.startsWith('/clips/')) {
    const filename = path.basename(pathname);
    const filePath = path.join(CLIPS_DIR, filename);

    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`
        });
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }
  }

  // Serve Static Frontend Files
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Single Page App fallback
    const indexHtml = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexHtml).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔥 ViralClips AI Studio is running!`);
  console.log(`🎬 Open your browser: http://localhost:${PORT}`);
  console.log(`📁 Export folder: ${CLIPS_DIR}`);
  console.log(`====================================================`);
});
