/**
 * FFmpeg Command Generator & Pipeline for 9:16 Viral Shorts
 * 
 * Layout Specs:
 * - Output Resolution: 1080x1920 (9:16 vertical short)
 * - Top Half (1080x960): Speaker / Facecam cropped & centered
 * - Bottom Half (1080x960): Gameplay footage, muted
 * - Top 2s Hook Banner: Rendered for t=0.0s to 2.0s
 * - Word-by-Word Karaoke Subtitles: Yellow active highlight via ASS subtitles
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generate an Advanced SubStation Alpha (.ass) subtitle file for word-by-word karaoke highlights
 * @param {Array} words - Array of { word, start, end }
 * @param {string} highlightColor - Hex/BGR color for active word (default yellow: &H0000FFFF&)
 * @returns {string} ASS formatted file contents
 */
function generateAssSubtitles(words, highlightColor = '&H00E6FF&') {
  const header = `[Script Info]
Title: Viral Shorts Karaoke
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ViralDefault,Montserrat Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,8,4,5,40,40,960,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Group words into short 3-5 word readable chunks
  const chunks = [];
  let currentChunk = [];
  for (let i = 0; i < words.length; i++) {
    currentChunk.push(words[i]);
    if (currentChunk.length >= 4 || i === words.length - 1) {
      chunks.push([...currentChunk]);
      currentChunk = [];
    }
  }

  const events = [];
  chunks.forEach(chunk => {
    const chunkStart = chunk[0].start;
    const chunkEnd = chunk[chunk.length - 1].end;

    // For each active word in the chunk, emit a dialogue line
    chunk.forEach(activeWord => {
      const lineStart = formatAssTime(activeWord.start);
      const lineEnd = formatAssTime(activeWord.end);

      const formattedText = chunk.map(w => {
        if (w === activeWord) {
          // Yellow highlighted active word with slight scale
          return `{\\c${highlightColor}\\fscx112\\fscy112}${w.word}{\\r}`;
        }
        return `{\\c&H00FFFFFF&}${w.word}`;
      }).join(' ');

      events.push(`Dialogue: 0,${lineStart},${lineEnd},ViralDefault,,0,0,0,,${formattedText}`);
    });
  });

  return header + events.join('\n');
}

function formatAssTime(seconds) {
  const s = Math.max(0, seconds);
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${hrs}:${pad(mins)}:${pad(secs)}.${pad(ms)}`;
}

/**
 * Builds the complete FFmpeg filter_complex string
 */
function buildFfmpegFilter({
  topCropX = 0.5,
  topCropY = 0.2,
  topZoom = 1.0,
  hookText = 'WAIT FOR IT... 💀',
  assPath = null,
  duration = null
}) {
  const filters = [];

  // 1. Top half: Crop speaker/facecam to 1080x960
  // Top video is input [0:v]
  filters.push(
    `[0:v]scale=w=iw*${topZoom}:h=-1,crop=w=min(iw\\,ih*9/8):h=min(ih\\,iw*8/9):x=(iw-out_w)*${topCropX}:y=(ih-out_h)*${topCropY},scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[top]`
  );

  // 2. Bottom half: Gameplay is input [1:v], scaled and cropped to 1080x960
  filters.push(
    `[1:v]scale=w=-1:h=960,crop=1080:960:(iw-1080)/2:(ih-960)/2[bottom]`
  );

  // 3. Stack top and bottom vertically: 1080x1920
  filters.push(
    `[top][bottom]vstack=inputs=2[stacked]`
  );

  // 4. Hook caption on top for first 2.0 seconds
  const escapedHook = hookText.replace(/'/g, "\\'").replace(/:/g, '\\:');
  const hookFilter = `drawtext=text='${escapedHook}':enable='between(t,0,2)':font='Arial Black':fontsize=54:fontcolor=white:box=1:boxcolor=black@0.85:boxborderw=20:x=(w-text_w)/2:y=120`;

  let lastStream = '[stacked]';
  if (hookText) {
    filters.push(`${lastStream}${hookFilter}[withhook]`);
    lastStream = '[withhook]';
  }

  // 5. Burn subtitles if provided
  if (assPath && fs.existsSync(assPath)) {
    const escapedAss = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    filters.push(`${lastStream}subtitles='${escapedAss}'[final]`);
    lastStream = '[final]';
  }

  return {
    filterComplex: filters.join('; '),
    outputMap: lastStream
  };
}

module.exports = {
  generateAssSubtitles,
  buildFfmpegFilter,
  formatAssTime
};
