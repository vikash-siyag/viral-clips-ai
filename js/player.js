/**
 * 9:16 Canvas Composition Player & Audio Coordinator
 * Layout:
 * - Top Half: Speaker cropped and centered (full audio)
 * - Bottom Half: Gameplay footage (muted)
 * - Captions: Word-by-word karaoke, active word yellow
 * - Hook: 2-second top headline banner
 */

class ShortPlayer {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d');
    
    // Internal resolution is standard 1080x1920 vertical video
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    this.speakerVideo = options.speakerVideo;
    this.gameplayVideo = options.gameplayVideo;
    this.captionsEngine = options.captionsEngine;
    this.proceduralGameplay = new ProceduralGameplayRenderer();

    // Composition Settings
    this.topCropX = 0.5; // 0 (left) to 1 (right)
    this.topCropY = 0.20; // 0 (top) to 1 (bottom)
    this.topZoom = 1.0;
    this.splitRatio = 0.50; // 50% top / 50% bottom
    this.gameplayPreset = 'runner'; // 'runner', 'parkour', 'stunt', 'original'

    // Playback state
    this.isPlaying = false;
    this.currentTime = 0;
    this.duration = 15.0;
    this.trimStart = 0.0;
    this.trimEnd = 15.0;

    // Callbacks
    this.onTimeUpdate = options.onTimeUpdate || (() => {});

    // Animation frame loop
    this.renderLoop = this.renderLoop.bind(this);
    requestAnimationFrame(this.renderLoop);
  }

  setSettings(settings = {}) {
    if (settings.topCropX !== undefined) this.topCropX = settings.topCropX;
    if (settings.topCropY !== undefined) this.topCropY = settings.topCropY;
    if (settings.topZoom !== undefined) this.topZoom = settings.topZoom;
    if (settings.splitRatio !== undefined) this.splitRatio = settings.splitRatio;
    if (settings.gameplayPreset !== undefined) this.gameplayPreset = settings.gameplayPreset;
  }

  loadPreset(preset) {
    this.duration = preset.duration || 15.0;
    this.trimStart = preset.trimStart || 0.0;
    this.trimEnd = preset.trimEnd || this.duration;
    this.topCropX = preset.topCropX !== undefined ? preset.topCropX : 0.5;
    this.topCropY = preset.topCropY !== undefined ? preset.topCropY : 0.20;
    this.topZoom = preset.topZoom !== undefined ? preset.topZoom : 1.0;
    this.splitRatio = preset.splitRatio !== undefined ? preset.splitRatio : 0.5;

    if (this.captionsEngine) {
      this.captionsEngine.setWords(preset.words || []);
      this.captionsEngine.setHookText(preset.hook || 'WATCH THIS! 😱');
      this.captionsEngine.setOffset(preset.captionOffset || 0.0);
    }

    this.seekTo(this.trimStart);
  }

  loadSpeakerMedia(srcOrFile) {
    if (typeof srcOrFile === 'string') {
      this.speakerVideo.src = srcOrFile;
    } else {
      this.speakerVideo.src = URL.createObjectURL(srcOrFile);
    }

    this.speakerVideo.onloadedmetadata = () => {
      this.duration = this.speakerVideo.duration || 15.0;
      this.trimStart = 0;
      this.trimEnd = Math.min(60.0, this.duration);
      this.seekTo(0);
    };
  }

  play() {
    this.isPlaying = true;
    if (this.speakerVideo && this.speakerVideo.src) {
      this.speakerVideo.play().catch(() => {});
    }
    this.lastTimestamp = performance.now();
  }

  pause() {
    this.isPlaying = false;
    if (this.speakerVideo && this.speakerVideo.src) {
      this.speakerVideo.pause();
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  seekTo(seconds) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    if (this.speakerVideo && this.speakerVideo.src) {
      this.speakerVideo.currentTime = this.currentTime;
    }
    this.onTimeUpdate(this.currentTime, this.duration);
  }

  /**
   * Main 60FPS Composition Render Loop
   */
  renderLoop(timestamp) {
    if (this.isPlaying) {
      const delta = (timestamp - (this.lastTimestamp || timestamp)) / 1000;
      this.lastTimestamp = timestamp;

      if (this.speakerVideo && this.speakerVideo.src && !this.speakerVideo.paused) {
        this.currentTime = this.speakerVideo.currentTime;
      } else {
        this.currentTime += delta;
      }

      // Loop within trim boundaries
      if (this.currentTime >= this.trimEnd) {
        this.seekTo(this.trimStart);
      }

      this.onTimeUpdate(this.currentTime, this.duration);
    }

    this.renderFrame(this.currentTime);
    requestAnimationFrame(this.renderLoop);
  }

  /**
   * Renders a single frame onto the 1080x1920 canvas
   */
  renderFrame(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;  // 1080
    const h = this.canvas.height; // 1920

    ctx.clearRect(0, 0, w, h);

    const splitY = h * this.splitRatio; // E.g. 960px

    // -------------------------------------------------------------
    // 1. TOP HALF: SPEAKER / FACECAM (0 to splitY)
    // -------------------------------------------------------------
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, splitY);
    ctx.clip();

    if (this.speakerVideo && this.speakerVideo.readyState >= 2) {
      // Draw actual video feed cropped to 9:8 ratio
      this.drawCroppedVideo(ctx, this.speakerVideo, 0, 0, w, splitY, this.topCropX, this.topCropY, this.topZoom);
    } else {
      // Draw simulated studio speaker graphic
      this.drawSimulatedSpeaker(ctx, 0, 0, w, splitY, time);
    }
    ctx.restore();

    // -------------------------------------------------------------
    // 2. BOTTOM HALF: GAMEPLAY (MUTED) (splitY to h)
    // -------------------------------------------------------------
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, splitY, w, h - splitY);
    ctx.clip();
    ctx.translate(0, splitY);

    if (this.gameplayPreset === 'original' && this.speakerVideo && this.speakerVideo.readyState >= 2) {
      // Use stream's gameplay region
      this.drawCroppedVideo(ctx, this.speakerVideo, 0, 0, w, h - splitY, 0.5, 0.75, 1.0);
    } else {
      // Render animated gameplay loop (Subway Surfers, Minecraft, GTA)
      this.proceduralGameplay.render(ctx, w, h - splitY, this.gameplayPreset, time);
    }
    ctx.restore();

    // -------------------------------------------------------------
    // 3. DIVIDER SEAM
    // -------------------------------------------------------------
    ctx.save();
    ctx.fillStyle = '#FFE600';
    ctx.shadowColor = 'rgba(255, 230, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillRect(0, splitY - 2, w, 4);
    ctx.restore();

    // -------------------------------------------------------------
    // 4. HOOK & KARAOKE CAPTIONS
    // -------------------------------------------------------------
    if (this.captionsEngine) {
      // Relative moment time for 2-second hook
      const relativeMomentTime = time - this.trimStart;
      this.captionsEngine.render(ctx, relativeMomentTime, w, h);
    }
  }

  /**
   * Helper to draw a video scaled & cropped with X, Y offsets and Zoom
   */
  drawCroppedVideo(ctx, video, destX, destY, destW, destH, cropX, cropY, zoom) {
    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;

    const targetRatio = destW / destH; // e.g. 1080 / 960 = 1.125
    let srcW, srcH;

    if (vw / vh > targetRatio) {
      srcH = vh / zoom;
      srcW = srcH * targetRatio;
    } else {
      srcW = vw / zoom;
      srcH = srcW / targetRatio;
    }

    const maxSrcX = Math.max(0, vw - srcW);
    const maxSrcY = Math.max(0, vh - srcH);

    const sx = maxSrcX * cropX;
    const sy = maxSrcY * cropY;

    ctx.drawImage(video, sx, sy, srcW, srcH, destX, destY, destW, destH);
  }

  /**
   * Dynamic simulated streamer graphic when testing without local video files
   */
  drawSimulatedSpeaker(ctx, x, y, w, h, time) {
    // Studio lighting gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#101420');
    bgGrad.addColorStop(0.5, '#1B2438');
    bgGrad.addColorStop(1, '#0C0E17');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(x, y, w, h);

    // Studio neon wall rim lights
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, w - 80, h - 80);

    // Sound wave visualizer in the background
    const waveCount = 28;
    const waveW = (w - 160) / waveCount;
    for (let i = 0; i < waveCount; i++) {
      const amp = Math.sin(time * 8 + i * 0.4) * 0.5 + 0.5;
      const waveH = 20 + amp * 120;
      ctx.fillStyle = 'rgba(255, 230, 0, 0.25)';
      ctx.fillRect(80 + i * waveW, h * 0.45 - waveH / 2, waveW - 6, waveH);
    }

    // Streamer Facecam avatar / representation
    const avatarY = h * this.topCropY + (h * 0.2);
    const avatarX = w * this.topCropX;
    const avatarR = 140 * this.topZoom;

    // Glowing rim
    ctx.save();
    ctx.shadowColor = '#FFE600';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#21293D';
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFE600';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();

    // Streamer face features
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(28 * this.topZoom)}px Montserrat, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎙️ STREAMER MIC', avatarX, avatarY - 20);

    // Dynamic speaking mouth indicator
    const mouthOpen = Math.abs(Math.sin(time * 12)) * 30 * this.topZoom;
    ctx.fillStyle = '#FFE600';
    ctx.beginPath();
    ctx.ellipse(avatarX, avatarY + 40, 35 * this.topZoom, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();

    // Streamer Tag
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(ctx, 40, h - 70, 240, 44, 10);
    ctx.fill();
    ctx.fillStyle = '#FFE600';
    ctx.font = 'bold 20px Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🔴 LIVE | TOP SPEAKER', 55, h - 42);
  }
}
