/**
 * Word-by-Word Karaoke Subtitles Engine & 2-Second Top Hook Renderer
 * Supports Multi-Language: English, Hinglish, and Hindi (Devanagari script)
 */

class ViralCaptionsEngine {
  constructor(options = {}) {
    this.words = options.words || [];
    this.captionOffset = options.captionOffset || 0.0;
    this.highlightColor = options.highlightColor || '#FFE600'; // Viral Yellow
    this.inactiveColor = options.inactiveColor || '#FFFFFF'; // Crisp White
    this.fontSize = options.fontSize || 48;
    this.captionYPercent = options.captionYPercent || 0.50; // Positioned around split or lower-third
    this.hookText = options.hookText || 'WAIT FOR IT... 💀';
    this.hookDuration = 2.0;
    this.language = options.language || 'hinglish'; // 'hinglish', 'hindi', 'english'

    // If no words provided, initialize default Hinglish caption track
    if (!this.words || this.words.length === 0) {
      this.generateDefaultCaptions('hinglish');
    } else {
      this.rebuildPhrases();
    }
  }

  setWords(words) {
    this.words = words || [];
    if (this.words.length === 0) {
      this.generateDefaultCaptions(this.language);
    } else {
      this.rebuildPhrases();
    }
  }

  setLanguage(lang) {
    this.language = lang;
  }

  /**
   * Generates rhythmic word-by-word captions from any plain text string
   * Perfect for Hinglish, Hindi, or English sentences!
   */
  generateFromText(text, startTime = 0.5, totalDuration = 15.0) {
    if (!text || !text.trim()) return;
    
    // Split on whitespace
    const rawWords = text.trim().split(/\s+/);
    if (rawWords.length === 0) return;

    const availableDuration = Math.max(2.0, totalDuration - startTime - 0.5);
    const timePerWord = Math.min(0.55, Math.max(0.22, availableDuration / rawWords.length));

    const words = [];
    let curTime = startTime;

    rawWords.forEach((word) => {
      // Clean word
      const w = word.trim().toUpperCase();
      if (!w) return;

      const duration = timePerWord;
      words.push({
        word: w,
        start: Number(curTime.toFixed(2)),
        end: Number((curTime + duration).toFixed(2))
      });
      curTime += duration + 0.04;
    });

    this.words = words;
    this.rebuildPhrases();
    return words;
  }

  generateDefaultCaptions(lang = 'hinglish') {
    if (lang === 'hindi') {
      const sampleText = "भाई ये क्या बोल दिया तूने सच में ऐसा हो सकता है क्या देखो आगे क्या हुआ";
      this.generateFromText(sampleText, 0.5, 14.0);
    } else if (lang === 'hinglish') {
      const sampleText = "Bhai ye kya bol diya tune sach me aisa hoga kya dekho aage kya hua";
      this.generateFromText(sampleText, 0.5, 14.0);
    } else {
      const sampleText = "Wait look at what just happened on the screen right now watch this";
      this.generateFromText(sampleText, 0.5, 14.0);
    }
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
      const w = this.words[i].word;
      const hasPunctuation = /[.!?|।,]/.test(w);
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

  render(ctx, currentTime, canvasWidth = 1080, canvasHeight = 1920) {
    ctx.save();
    // 1. Render Top 2-Second Hook Banner (0.0s to 2.0s)
    this.renderTopHook(ctx, currentTime, canvasWidth, canvasHeight);
    // 2. Render Word-by-Word Karaoke Subtitles (active word yellow)
    this.renderKaraokeCaptions(ctx, currentTime, canvasWidth, canvasHeight);
    ctx.restore();
  }

  renderTopHook(ctx, time, w, h) {
    if (!this.hookText || time < 0 || time > this.hookDuration) return;

    let opacity = 1.0;
    let scale = 1.0;
    let yOffset = 180;

    if (time < 0.25) {
      const progress = time / 0.25;
      scale = 0.8 + 0.2 * Math.sin(progress * Math.PI / 2);
      opacity = progress;
    } else if (time > (this.hookDuration - 0.35)) {
      opacity = (this.hookDuration - time) / 0.35;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
    ctx.translate(w / 2, yOffset);
    ctx.scale(scale, scale);

    const hookString = this.hookText.toUpperCase();
    ctx.font = '900 46px "Noto Sans Devanagari", Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(hookString);
    const boxW = Math.min(w * 0.92, textMetrics.width + 60);
    const boxH = 90;

    // Glowing container box
    ctx.fillStyle = 'rgba(8, 10, 16, 0.92)';
    ctx.strokeStyle = this.highlightColor;
    ctx.lineWidth = 4;
    roundRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 20);
    ctx.fill();
    ctx.stroke();

    // Hook pill badge
    ctx.fillStyle = this.highlightColor;
    roundRect(ctx, -70, -boxH / 2 - 16, 140, 26, 8);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.font = '900 16px Montserrat, sans-serif';
    ctx.fillText('⚡ VIRAL HOOK', 0, -boxH / 2 - 3);

    // Main text
    ctx.font = '900 44px "Noto Sans Devanagari", Montserrat, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(hookString, 0, 4);

    ctx.restore();
  }

  renderKaraokeCaptions(ctx, time, w, h) {
    if (!this.phrases || this.phrases.length === 0) return;

    const adjustedTime = time + this.captionOffset;

    // Find currently active phrase
    const activePhrase = this.phrases.find(p => adjustedTime >= p.start && adjustedTime <= p.end);
    if (!activePhrase) return;

    ctx.save();

    const captionY = h * this.captionYPercent;
    ctx.translate(w / 2, captionY);

    ctx.font = `900 ${this.fontSize}px "Noto Sans Devanagari", Montserrat, "Cabinet Grotesk", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const spaceWidth = ctx.measureText(' ').width;
    const wordMetrics = activePhrase.words.map(item => {
      return {
        item,
        width: ctx.measureText(item.word).width
      };
    });

    const totalPhraseWidth = wordMetrics.reduce((acc, m) => acc + m.width, 0) + (wordMetrics.length - 1) * spaceWidth;
    let curX = -totalPhraseWidth / 2;

    wordMetrics.forEach(({ item, width }) => {
      const isActive = adjustedTime >= item.start && adjustedTime <= item.end;
      
      ctx.save();

      if (isActive) {
        const wordProgress = (adjustedTime - item.start) / Math.max(0.1, (item.end - item.start));
        const bounce = 1.0 + 0.14 * Math.sin(Math.min(1, wordProgress * 2) * Math.PI);
        ctx.translate(curX + width / 2, 0);
        ctx.scale(bounce, bounce);
        ctx.translate(-(curX + width / 2), 0);
      }

      // 1. Heavy Black Outline
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = isActive ? 16 : 12;
      ctx.strokeText(item.word, curX, 0);

      // 2. Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;

      // 3. Yellow Highlight for Active Word, White for inactive
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
