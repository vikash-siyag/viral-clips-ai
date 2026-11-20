const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const local = path.join(__dirname, '..', 'server', 'yt-dlp.exe');
console.log('yt-dlp binary exists:', fs.existsSync(local));

if (fs.existsSync(local)) {
  exec(`"${local}" --version`, (err, stdout) => {
    if (err) {
      console.error('Error running yt-dlp:', err);
    } else {
      console.log('yt-dlp version verified:', stdout.trim());
    }
  });
}
