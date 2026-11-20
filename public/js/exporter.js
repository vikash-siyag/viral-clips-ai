/**
 * 9:16 Shorts Video Exporter Module
 * 
 * - Records 1080x1920 composition canvas at 60fps
 * - Preserves speaker audio (gameplay is muted)
 * - Sequentially names clips: clip_01.mp4, clip_02.mp4 into /clips
 * - Automatically sends to server API /api/save-clip to write to disk
 */

class ShortExporter {
  constructor(options = {}) {
    this.player = options.player;
    this.progressBar = options.progressBar;
    this.progressContainer = options.progressContainer;
    this.progressText = options.progressText;
    this.nextClipBadge = options.nextClipBadge;
    this.onExportComplete = options.onExportComplete || (() => {});
    this.clipIndex = 1;
  }

  setClipIndex(idx) {
    this.clipIndex = idx;
    if (this.nextClipBadge) {
      const padded = String(this.clipIndex).padStart(2, '0');
      this.nextClipBadge.textContent = `clip_${padded}.mp4`;
    }
  }

  async exportShort() {
    const player = this.player;
    if (!player) return;

    // Pause current preview
    player.pause();

    const startSec = player.trimStart;
    const endSec = player.trimEnd;
    const totalDuration = endSec - startSec;

    if (totalDuration <= 0) {
      alert('Invalid trim moment selected!');
      return;
    }

    // UI Progress Display
    if (this.progressContainer) this.progressContainer.style.display = 'flex';
    if (this.progressBar) this.progressBar.style.width = '0%';
    if (this.progressText) this.progressText.textContent = 'Initializing 1080×1920 60FPS encoder...';

    // Build media stream from canvas
    const canvasStream = player.canvas.captureStream(60);

    // Audio capture: capture speaker video audio if available
    let audioStream = null;
    try {
      if (player.speakerVideo && player.speakerVideo.captureStream) {
        audioStream = player.speakerVideo.captureStream();
      } else if (player.speakerVideo && player.speakerVideo.mozCaptureStream) {
        audioStream = player.speakerVideo.mozCaptureStream();
      }
    } catch (e) {
      console.warn('Audio capture stream fallback:', e);
    }

    // Combine video tracks and audio tracks
    const combinedTracks = [...canvasStream.getVideoTracks()];
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedTracks.push(audioStream.getAudioTracks()[0]);
    }

    const exportStream = new MediaStream(combinedTracks);

    // Supported MIME types check
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
    }

    const recordedChunks = [];
    const mediaRecorder = new MediaRecorder(exportStream, {
      mimeType,
      videoBitsPerSecond: 8000000 // 8 Mbps high-quality bitrate
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          if (this.progressText) this.progressText.textContent = 'Muxing & saving into /clips...';
          if (this.progressBar) this.progressBar.style.width = '95%';

          const blob = new Blob(recordedChunks, { type: mimeType });
          const padded = String(this.clipIndex).padStart(2, '0');
          const filename = `clip_${padded}.mp4`;

          // Post video directly to server to save in /clips/
          let serverSaved = false;
          try {
            const formData = new FormData();
            formData.append('video', blob, filename);

            const resp = await fetch('/api/save-clip', {
              method: 'POST',
              headers: {
                'x-filename': filename
              },
              body: blob
            });
            if (resp.ok) {
              const resJson = await resp.json();
              console.log('Saved to server /clips:', resJson);
              serverSaved = true;
            }
          } catch (netErr) {
            console.warn('Could not save directly to server disk, offering browser download:', netErr);
          }

          // Generate download URL
          const videoUrl = URL.createObjectURL(blob);

          if (this.progressBar) this.progressBar.style.width = '100%';
          if (this.progressText) this.progressText.textContent = `Completed! Saved as ${filename}`;

          setTimeout(() => {
            if (this.progressContainer) this.progressContainer.style.display = 'none';
          }, 1500);

          // Increment clip index for next export
          this.setClipIndex(this.clipIndex + 1);

          // Notify UI
          this.onExportComplete({
            filename,
            blob,
            videoUrl,
            serverSaved,
            sizeBytes: blob.size,
            sizeFormatted: (blob.size / (1024 * 1024)).toFixed(2) + ' MB'
          });

          resolve({ filename, videoUrl, blob });

        } catch (err) {
          reject(err);
        }
      };

      // Seek to moment start and begin recording
      player.seekTo(startSec);
      player.play();
      mediaRecorder.start(100);

      const checkInterval = setInterval(() => {
        const elapsed = player.currentTime - startSec;
        const percent = Math.min(90, Math.round((elapsed / totalDuration) * 90));

        if (this.progressBar) this.progressBar.style.width = `${percent}%`;
        if (this.progressText) this.progressText.textContent = `Encoding Short: ${elapsed.toFixed(1)}s / ${totalDuration.toFixed(1)}s (${percent}%)`;

        if (player.currentTime >= endSec || !player.isPlaying) {
          clearInterval(checkInterval);
          player.pause();
          mediaRecorder.stop();
        }
      }, 50);
    });
  }
}
