#!/usr/bin/env node

/**
 * ViralClips AI CLI - Fast command-line 9:16 Shorts Exporter
 * Usage: node scripts/export_cli.js --speaker input.mp4 --gameplay bg.mp4 --hook "INSANE MOMENT"
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateAssSubtitles, buildFfmpegFilter } = require('../server/ffmpeg_pipeline');

console.log('🎬 ViralClips AI - CLI Exporter');
console.log('---------------------------------');

const args = process.argv.slice(2);
const params = {
  speaker: null,
  gameplay: null,
  hook: 'WATCH THIS... 😱',
  output: path.join(__dirname, '..', 'clips', 'clip_01.mp4')
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--speaker' && args[i + 1]) params.speaker = args[++i];
  if (args[i] === '--gameplay' && args[i + 1]) params.gameplay = args[++i];
  if (args[i] === '--hook' && args[i + 1]) params.hook = args[++i];
  if (args[i] === '--out' && args[i + 1]) params.output = args[++i];
}

console.log('Params:', params);
console.log('To run full visual Director studio, start: npm start and open http://localhost:3000');
