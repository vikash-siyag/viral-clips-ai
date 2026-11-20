/**
 * Word-by-Word Karaoke Subtitles Engine & 2-Second Top Hook Renderer
 * Specifically designed for 9:16 vertical shorts (1080x1920)
 */

class ViralCaptionsEngine {
  constructor(options = {}) {
    this.words = options.words || [];
    this.captionOffset = options.captionOffset || 0.0; // In seconds (+/-)
    this.highlightColor = options.highlightColor || '#FFE600'; // Viral Yellow
    this.inactiveColor = options.inactiveColor || '#FFFFFF'; // Crisp White
    this.fontSize = options.fontSize || 54;
    this.captionYPercent = options.captionYPercent || 0.50; // Positioned around split line
    this.hookText = options.hookText || 'HE ACTUALLY SAID THIS?! 😱';
    this.hookDuration = 2.0; // 2 seconds exactly as requested
    
    // Group words into short rhythmic phrases (3-4 words per line)
    this.rebuildPhrases();
  }

  setWords(words) {
    this.words = words || [];
    this.rebuildPhrases();
  }

  setOffset(offset) {
    this.captionOffset = parseFloat(offset) || 0;
  }

  setHighlightColor(color) {
    this.highlightColor = color;
  }

  setFontSize(size) {
    this.fontSize = parseInt(size, 10);
  }

  setCaptionY(percent) {
    this.captionYPercent = percent / 100;
  }

  setHookText(text) {
    this.hookText = text;
  }

  rebuildPhrases() {
    this.phrases = [];
    if (!this.words || this.words.length === 0) return;

    let currentPhrase = [];
    for (let i = 0; i < this.words.length; i++) {
      currentPhrase.push(this.words[i]);
      // Split on 3 words or punctuation or last word
      const w = this.words[i].word;
      const hasPunctuation = /[.!?]/.test(w);
      if (currentPhrase.length >= 3 || hasPunctuation || i === this.words.length - 1) {
        this.phrases.push({
          start: currentPhrase[0].start,
          end: currentPhrase[currentPhrase.length - 1].end + 0.25,
          words: [...currentPhrase]
        });
        currentPhrase = [];
      }
    }
  }

  /**
   * Main Render method called every frame by the composition canvas
   * @param {CanvasRenderingContext2D} ctx - 1080x1920 canvas context
   * @param {number} currentTime - Current video playback timestamp in seconds
   * @param {number} canvasWidth - 1080
   * @param {number} canvasHeight - 1920
   */
  render(ctx, currentTime, canvasWidth = 1080, canvasHeight = 1920) {
    ctx.save();

    // 1. Render Top 2-Second Hook Banner (0.0s to 2.0s)
    this.renderTopHook(ctx, currentTime, canvasWidth, canvasHeight);

    // 2. Render Word-by-Word Karaoke Subtitles
    this.renderKaraokeCaptions(ctx, currentTime, canvasWidth, canvasHeight);

    ctx.restore();
  }

  /**
   * 2-Second Top Hook Banner (t: 0s to 2s)
   */
  renderTopHook(ctx, time, w, h) {
    if (!this.hookText || time < 0 || time > this.hookDuration) return;

    // Smooth animation: slide down & pulse, then fade out near 2.0s
    let opacity = 1.0;
    let scale = 1.0;
    let yOffset = 180;

    if (time < 0.25) {
      // Entrance pop
      const progress = time / 0.25;
      scale = 0.8 + 0.2 * Math.sin(progress * Math.PI / 2);
      opacity = progress;
    } else if (time > (this.hookDuration - 0.35)) {
      // Exit fade
      opacity = (this.hookDuration - time) / 0.35;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(w / 2, yOffset);
    ctx.scale(scale, scale);

    const hookString = this.hookText.toUpperCase();
    ctx.font = '900 46px Montserrat, "Cabinet Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(hookString);
    const boxW = Math.min(w * 0.92, textMetrics.width + 60);
    const boxH = 90;

    // Dark high-contrast glowing badge box
    ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
    ctx.strokeStyle = this.highlightColor;
    ctx.lineWidth = 4;

    // Draw rounded rect
    roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    // "HOOK / WATCH" Pill tag
    ctx.fillStyle = this.highlightColor;
    roundRect(ctx, -60, -boxH / 2 - 16, 120, 26, 8);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 16px Montserrat, sans-serif';
    ctx.fillText('⚡ VIRAL MOMENT', 0, -boxH / 2 - 3);

    // Main Hook Text
    ctx.font = '900 44px Montserrat, "Cabinet Grotesk", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(hookString, 0, 4);

    ctx.restore();
  }

  /**
   * Word-by-Word Karaoke Subtitles with Active Word in Yellow
   */
  renderKaraokeCaptions(ctx, time, w, h) {
    if (!this.phrases || this.phrases.length === 0) return;

    // Apply director's caption offset
    const adjustedTime = time + this.captionOffset;

    // Find the currently active phrase
    const activePhrase = this.phrases.find(p => adjustedTime >= p.start && adjustedTime <= p.end);
    if (!activePhrase) return;

    ctx.save();

    const captionY = h * this.captionYPercent;
    ctx.translate(w / 2, captionY);

    ctx.font = `900 ${this.fontSize}px Montserrat, "Cabinet Grotesk", Impact, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Calculate total phrase width for center alignment
    const spaceWidth = ctx.measureText(' ').width;
    const wordMetrics = activePhrase.words.map(item => {
      return {
        item,
        width: ctx.measureText(item.word).width
      };
    });

    const totalPhraseWidth = wordMetrics.reduce((acc, m) => acc + m.width, 0) + (wordMetrics.length - 1) * spaceWidth;
    let curX = -totalPhraseWidth / 2;

    // Render each word in the phrase
    wordMetrics.forEach(({ item, width }) => {
      const isActive = adjustedTime >= item.start && adjustedTime <= item.end;
      
      ctx.save();

      // Word position & transform
      if (isActive) {
        // Active word bounce effect
        const wordProgress = (adjustedTime - item.start) / Math.max(0.1, (item.end - item.start));
        const bounce = 1.0 + 0.12 * Math.sin(Math.min(1, wordProgress * 2) * Math.PI);
        
        ctx.translate(curX + width / 2, 0);
        ctx.scale(bounce, bounce);
        ctx.translate(-(curX + width / 2), 0);
      }

      // 1. Thick Heavy Black Outline for punchy viral contrast
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = isActive ? 16 : 12;
      ctx.strokeText(item.word, curX, 0);

      // 2. Drop Shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;

      // 3. Word Fill Color: Vibrant Yellow for active word, White for inactive
      if (isActive) {
        ctx.fillStyle = this.highlightColor;
      } else {
        ctx.fillStyle = this.inactiveColor;
      }
      ctx.fillText(item.word, curX, 0);

      ctx.restore();

      curX += width + spaceWidth;
    });

    ctx.restore();
  }
}

// Helper: Rounded Rectangle path
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
