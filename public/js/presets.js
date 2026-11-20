/**
 * Presets, Demo Clips, and Procedural Animated Background Generators
 * Clean, generic, original tutorial sentences with word-level timestamps
 */

const STREAM_PRESETS = {
  'tutorial-demo': {
    title: 'CREATOR DEMO: INTRODUCING VERTICAL FORMAT',
    speakerName: 'Instructor',
    hook: 'CREATING 9:16 SHORTS FAST 🚀',
    duration: 16.0,
    trimStart: 0.0,
    trimEnd: 14.0,
    topCropX: 0.5,
    topCropY: 0.20,
    topZoom: 1.0,
    splitRatio: 0.5,
    captionOffset: 0.0,
    words: [
      { word: "WELCOME", start: 0.3, end: 0.7 },
      { word: "TO", start: 0.7, end: 0.9 },
      { word: "THIS", start: 0.9, end: 1.2 },
      { word: "NEW", start: 1.2, end: 1.5 },
      { word: "VIDEO", start: 1.5, end: 1.9 },
      { word: "CREATOR", start: 1.9, end: 2.5 },

      { word: "WE", start: 2.8, end: 3.1 },
      { word: "SPLIT", start: 3.1, end: 3.5 },
      { word: "THE", start: 3.5, end: 3.7 },
      { word: "SCREEN", start: 3.7, end: 4.2 },
      { word: "INTO", start: 4.2, end: 4.5 },
      { word: "TWO", start: 4.5, end: 4.8 },
      { word: "SECTIONS", start: 4.8, end: 5.5 },

      { word: "THE", start: 5.9, end: 6.1 },
      { word: "SPEAKER", start: 6.1, end: 6.6 },
      { word: "IS", start: 6.6, end: 6.8 },
      { word: "ON", start: 6.8, end: 7.0 },
      { word: "TOP", start: 7.0, end: 7.5 },

      { word: "AND", start: 7.9, end: 8.2 },
      { word: "THE", start: 8.2, end: 8.4 },
      { word: "BACKGROUND", start: 8.4, end: 9.1 },
      { word: "RUNS", start: 9.1, end: 9.4 },
      { word: "BELOW", start: 9.4, end: 10.0 },

      { word: "EVERY", start: 10.4, end: 10.8 },
      { word: "SPOKEN", start: 10.8, end: 11.2 },
      { word: "WORD", start: 11.2, end: 11.6 },
      { word: "TURNS", start: 11.6, end: 12.0 },
      { word: "YELLOW!", start: 12.0, end: 12.8 }
    ]
  },

  'developer-talk': {
    title: 'DEVELOPER LOG: BUILDING VIDEO PIPELINES',
    speakerName: 'Engineer',
    hook: 'HOW VIDEO PIPELINES WORK ⚙️',
    duration: 15.0,
    trimStart: 0.0,
    trimEnd: 13.0,
    topCropX: 0.5,
    topCropY: 0.25,
    topZoom: 1.0,
    splitRatio: 0.5,
    captionOffset: 0.0,
    words: [
      { word: "AUTOMATING", start: 0.3, end: 0.9 },
      { word: "SHORT", start: 0.9, end: 1.3 },
      { word: "FORM", start: 1.3, end: 1.6 },
      { word: "VIDEO", start: 1.6, end: 2.1 },
      { word: "IS", start: 2.1, end: 2.3 },
      { word: "EFFICIENT", start: 2.3, end: 2.9 },

      { word: "YOU", start: 3.3, end: 3.6 },
      { word: "CAN", start: 3.6, end: 3.9 },
      { word: "ADJUST", start: 3.9, end: 4.4 },
      { word: "THE", start: 4.4, end: 4.6 },
      { word: "VERTICAL", start: 4.6, end: 5.2 },
      { word: "CROP", start: 5.2, end: 5.7 },

      { word: "AND", start: 6.1, end: 6.3 },
      { word: "FINE", start: 6.3, end: 6.6 },
      { word: "TUNE", start: 6.6, end: 7.0 },
      { word: "SUBTITLE", start: 7.0, end: 7.6 },
      { word: "TIMINGS", start: 7.6, end: 8.2 },

      { word: "BEFORE", start: 8.6, end: 9.0 },
      { word: "SAVING", start: 9.0, end: 9.5 },
      { word: "THE", start: 9.5, end: 9.8 },
      { word: "MP4", start: 9.8, end: 10.3 },
      { word: "FILE", start: 10.3, end: 11.0 }
    ]
  }
};

/**
 * Procedural Gameplay / B-Roll Background Generator
 */
class ProceduralGameplayRenderer {
  render(ctx, width, height, type = 'runner', time = 0) {
    ctx.save();
    if (type === 'parkour') {
      this.renderParkour(ctx, width, height, time);
    } else if (type === 'stunt') {
      this.renderStunt(ctx, width, height, time);
    } else {
      this.renderRunner(ctx, width, height, time);
    }
    ctx.restore();
  }

  renderRunner(ctx, w, h, time) {
    const speed = (time * 600) % 800;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.4, '#1E293B');
    skyGrad.addColorStop(1, '#0B0F17');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    const horizonY = h * 0.15;
    const centerX = w / 2;

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(centerX - 80, horizonY);
    ctx.lineTo(centerX + 80, horizonY);
    ctx.lineTo(w + 100, h);
    ctx.lineTo(-100, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 4;
    for (let l of [-1.5, -0.5, 0.5, 1.5]) {
      ctx.beginPath();
      ctx.moveTo(centerX + l * 40, horizonY);
      ctx.lineTo(centerX + l * 280, h);
      ctx.stroke();
    }

    ctx.fillStyle = '#1E293B';
    for (let i = 0; i < 20; i++) {
      const p = ((i * 50 + speed) % 800) / 800;
      const y = horizonY + Math.pow(p, 1.8) * (h - horizonY);
      const widthAtY = 120 + p * 540;
      const hAtY = 4 + p * 12;
      ctx.fillRect(centerX - widthAtY / 2, y, widthAtY, hAtY);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 22px Montserrat, sans-serif';
    ctx.fillText('🎮 3D RUNNER B-ROLL (MUTED)', 40, h - 30);
  }

  renderParkour(ctx, w, h, time) {
    const speed = (time * 250) % 600;
    ctx.fillStyle = '#78A7FF';
    ctx.fillRect(0, 0, w, h);

    const horizon = h * 0.25;
    for (let b = 0; b < 10; b++) {
      const bp = ((b * 120 + speed) % 900) / 900;
      const by = horizon + Math.pow(bp, 1.5) * (h - horizon);
      const bx = (w / 2) + Math.sin(b * 1.8) * (bp * 320);
      const bs = 30 + bp * 110;

      ctx.fillStyle = '#5B8C32';
      ctx.fillRect(bx - bs / 2, by - bs / 2, bs, bs * 0.4);

      ctx.fillStyle = '#866043';
      ctx.fillRect(bx - bs / 2, by - bs * 0.1, bs, bs * 0.6);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 22px Montserrat, sans-serif';
    ctx.fillText('🎮 VOXEL PARKOUR (MUTED)', 40, h - 30);
  }

  renderStunt(ctx, w, h, time) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#F43F5E');
    skyGrad.addColorStop(0.5, '#8B5CF6');
    skyGrad.addColorStop(1, '#090D16');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h);
    ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.9, h * 0.1);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 22px Montserrat, sans-serif';
    ctx.fillText('🎮 NEON STUNT RAMP (MUTED)', 40, h - 30);
  }
}
