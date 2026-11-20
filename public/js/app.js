/**
 * Main Web Application Controller for ViralClips AI
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const canvas = document.getElementById('compositionCanvas');
  const speakerVideo = document.getElementById('speakerVideo');
  const gameplayVideo = document.getElementById('gameplayVideo');
  const timelineScrubber = document.getElementById('timelineScrubber');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const playIcon = document.getElementById('playIcon');
  const currentTimeText = document.getElementById('currentTimeText');
  const totalDurationText = document.getElementById('totalDurationText');
  const trimStartInput = document.getElementById('trimStart');
  const trimEndInput = document.getElementById('trimEnd');
  const momentTrimBar = document.getElementById('momentTrimBar');

  // Sliders & Controls
  const topCropY = document.getElementById('topCropY');
  const topCropX = document.getElementById('topCropX');
  const topZoom = document.getElementById('topZoom');
  const splitRatio = document.getElementById('splitRatio');
  const captionOffset = document.getElementById('captionOffset');
  const fontSize = document.getElementById('fontSize');
  const captionY = document.getElementById('captionY');
  const hookTextInput = document.getElementById('hookTextInput');

  // Labels
  const lblTopCropY = document.getElementById('lblTopCropY');
  const lblTopCropX = document.getElementById('lblTopCropX');
  const lblTopZoom = document.getElementById('lblTopZoom');
  const lblSplitRatio = document.getElementById('lblSplitRatio');
  const lblCaptionOffset = document.getElementById('lblCaptionOffset');
  const lblFontSize = document.getElementById('lblFontSize');
  const lblCaptionY = document.getElementById('lblCaptionY');

  // Director Chat & Form
  const directorChatLogs = document.getElementById('directorChatLogs');
  const directorPromptForm = document.getElementById('directorPromptForm');
  const directorPromptInput = document.getElementById('directorPromptInput');

  // Export & Gallery
  const btnExportClip = document.getElementById('btnExportClip');
  const exportProgressContainer = document.getElementById('exportProgressContainer');
  const exportProgressBar = document.getElementById('exportProgressBar');
  const exportProgressText = document.getElementById('exportProgressText');
  const nextClipNameBadge = document.getElementById('nextClipNameBadge');
  const clipsGrid = document.getElementById('clipsGrid');
  const clipsCountBadge = document.getElementById('clipsCountBadge');
  const galleryCountTag = document.getElementById('galleryCountTag');
  const btnRefreshClips = document.getElementById('btnRefreshClips');

  // Modals
  const exportSuccessModal = document.getElementById('exportSuccessModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');
  const modalClipFilename = document.getElementById('modalClipFilename');
  const btnDownloadClipDirect = document.getElementById('btnDownloadClipDirect');
  const btnDirectorReEdit = document.getElementById('btnDirectorReEdit');

  // Ingestion
  const videoUrlInput = document.getElementById('videoUrlInput');
  const btnFetchUrl = document.getElementById('btnFetchUrl');
  const localVideoUpload = document.getElementById('localVideoUpload');
  const btnDemoStream = document.getElementById('btnDemoStream');

  // 1. Initialize Captions Engine
  const captionsEngine = new ViralCaptionsEngine({
    highlightColor: '#FFE600', // Yellow as requested
    inactiveColor: '#FFFFFF',
    fontSize: 42,
    captionYPercent: 0.50,
    captionOffset: 0.0,
    hookText: 'HE ACTUALLY SAID THIS?! 😱'
  });

  // 2. Initialize 9:16 Short Player
  const player = new ShortPlayer({
    canvas,
    speakerVideo,
    gameplayVideo,
    captionsEngine,
    onTimeUpdate: (time, dur) => {
      timelineScrubber.value = time;
      currentTimeText.textContent = formatTime(time);
      totalDurationText.textContent = formatTime(dur);
    }
  });

  // 3. Initialize Exporter
  const exporter = new ShortExporter({
    player,
    progressBar: exportProgressBar,
    progressContainer: exportProgressContainer,
    progressText: exportProgressText,
    nextClipBadge: nextClipNameBadge,
    onExportComplete: (clipData) => {
      showExportSuccessModal(clipData);
      loadClipsGallery();
    }
  });

  // 4. Initialize Director AI
  const directorAI = new DirectorAI({
    chatContainer: directorChatLogs,
    getCurrentSettings: () => ({
      topCropY: player.topCropY,
      topCropX: player.topCropX,
      topZoom: player.topZoom,
      splitRatio: player.splitRatio,
      captionOffset: captionsEngine.captionOffset,
      fontSize: captionsEngine.fontSize,
      highlightColor: captionsEngine.highlightColor,
      hookText: captionsEngine.hookText,
      gameplayPreset: player.gameplayPreset
    }),
    onApplyAdjustments: (adjustments) => {
      applySettingsToUI(adjustments);
    },
    onTriggerReExport: () => {
      exporter.exportShort();
    }
  });

  // Load Initial Preset
  player.loadPreset(STREAM_PRESETS['tutorial-demo']);
  updateTrimUI();

  // -------------------------------------------------------------
  // PLAYBACK CONTROLS
  // -------------------------------------------------------------
  btnPlayPause.addEventListener('click', () => {
    const isPlaying = player.togglePlay();
    playIcon.textContent = isPlaying ? '⏸' : '▶';
  });

  timelineScrubber.addEventListener('input', (e) => {
    player.seekTo(parseFloat(e.target.value));
  });

  // Trim Moment Range
  trimStartInput.addEventListener('change', () => {
    player.trimStart = parseFloat(trimStartInput.value) || 0;
    updateTrimUI();
    player.seekTo(player.trimStart);
  });

  trimEndInput.addEventListener('change', () => {
    player.trimEnd = parseFloat(trimEndInput.value) || player.duration;
    updateTrimUI();
  });

  function updateTrimUI() {
    timelineScrubber.max = player.duration;
    trimStartInput.value = player.trimStart.toFixed(1);
    trimEndInput.value = player.trimEnd.toFixed(1);

    const leftPct = (player.trimStart / player.duration) * 100;
    const widthPct = ((player.trimEnd - player.trimStart) / player.duration) * 100;
    momentTrimBar.style.left = `${leftPct}%`;
    momentTrimBar.style.width = `${widthPct}%`;
  }

  // -------------------------------------------------------------
  // TABS & SLIDERS SYNCHRONIZATION
  // -------------------------------------------------------------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Framing Sliders
  topCropY.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) / 100;
    player.topCropY = val;
    lblTopCropY.textContent = `${e.target.value}%`;
  });

  topCropX.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) / 100;
    player.topCropX = val;
    lblTopCropX.textContent = `${e.target.value}%`;
  });

  topZoom.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) / 100;
    player.topZoom = val;
    lblTopZoom.textContent = `${val.toFixed(1)}x`;
  });

  splitRatio.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10) / 100;
    player.splitRatio = val;
    lblSplitRatio.textContent = `${e.target.value} / ${100 - parseInt(e.target.value, 10)}`;
  });

  // Caption Sliders
  captionOffset.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    captionsEngine.setOffset(val);
    lblCaptionOffset.textContent = (val >= 0 ? `+${val.toFixed(2)}s` : `${val.toFixed(2)}s`);
  });

  document.getElementById('btnOffsetMinus02').addEventListener('click', () => {
    const cur = parseFloat(captionOffset.value) - 0.2;
    captionOffset.value = cur.toFixed(2);
    captionOffset.dispatchEvent(new Event('input'));
  });

  document.getElementById('btnOffsetPlus02').addEventListener('click', () => {
    const cur = parseFloat(captionOffset.value) + 0.2;
    captionOffset.value = cur.toFixed(2);
    captionOffset.dispatchEvent(new Event('input'));
  });

  fontSize.addEventListener('input', (e) => {
    captionsEngine.setFontSize(e.target.value);
    lblFontSize.textContent = `${e.target.value}px`;
  });

  captionY.addEventListener('input', (e) => {
    captionsEngine.setCaptionY(e.target.value);
    lblCaptionY.textContent = `${e.target.value}%`;
  });

  // Color Swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const color = swatch.dataset.color;
      captionsEngine.setHighlightColor(color);
      document.getElementById('activeColorPreview').style.background = color;
    });
  });

  // Hook Text
  hookTextInput.addEventListener('input', (e) => {
    captionsEngine.setHookText(e.target.value);
  });

  document.querySelectorAll('[data-hook]').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.hook;
      hookTextInput.value = text;
      captionsEngine.setHookText(text);
    });
  });

  // Gameplay Selector
  document.querySelectorAll('.gameplay-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.gameplay-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      player.gameplayPreset = card.dataset.gameplay;
    });
  });

  // Helper to sync programmatic adjustments from AI Director back into UI
  function applySettingsToUI(adj) {
    if (adj.topCropY !== undefined) {
      player.topCropY = adj.topCropY;
      topCropY.value = Math.round(adj.topCropY * 100);
      lblTopCropY.textContent = `${topCropY.value}%`;
    }
    if (adj.topCropX !== undefined) {
      player.topCropX = adj.topCropX;
      topCropX.value = Math.round(adj.topCropX * 100);
      lblTopCropX.textContent = `${topCropX.value}%`;
    }
    if (adj.topZoom !== undefined) {
      player.topZoom = adj.topZoom;
      topZoom.value = Math.round(adj.topZoom * 100);
      lblTopZoom.textContent = `${adj.topZoom.toFixed(1)}x`;
    }
    if (adj.splitRatio !== undefined) {
      player.splitRatio = adj.splitRatio;
      splitRatio.value = Math.round(adj.splitRatio * 100);
      lblSplitRatio.textContent = `${splitRatio.value} / ${100 - splitRatio.value}`;
    }
    if (adj.captionOffset !== undefined) {
      captionsEngine.setOffset(adj.captionOffset);
      captionOffset.value = adj.captionOffset;
      lblCaptionOffset.textContent = (adj.captionOffset >= 0 ? `+${adj.captionOffset.toFixed(2)}s` : `${adj.captionOffset.toFixed(2)}s`);
    }
    if (adj.highlightColor !== undefined) {
      captionsEngine.setHighlightColor(adj.highlightColor);
      document.getElementById('activeColorPreview').style.background = adj.highlightColor;
      document.querySelectorAll('.color-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color.toLowerCase() === adj.highlightColor.toLowerCase());
      });
    }
    if (adj.fontSize !== undefined) {
      captionsEngine.setFontSize(adj.fontSize);
      fontSize.value = adj.fontSize;
      lblFontSize.textContent = `${adj.fontSize}px`;
    }
    if (adj.hookText !== undefined) {
      captionsEngine.setHookText(adj.hookText);
      hookTextInput.value = adj.hookText;
    }
    if (adj.gameplayPreset !== undefined) {
      player.gameplayPreset = adj.gameplayPreset;
      document.querySelectorAll('.gameplay-card').forEach(c => {
        c.classList.toggle('active', c.dataset.gameplay === adj.gameplayPreset);
      });
    }
  }

  // -------------------------------------------------------------
  // DIRECTOR CHAT & PROMPT FORM
  // -------------------------------------------------------------
  directorPromptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = directorPromptInput.value;
    if (prompt) {
      directorAI.processPrompt(prompt);
      directorPromptInput.value = '';
    }
  });

  // Quick Prompt Chips
  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.dataset.cmd;
      directorAI.processPrompt(cmd);
    });
  });

  // -------------------------------------------------------------
  // SOURCE INGESTION & PRESETS
  // -------------------------------------------------------------
  btnFetchUrl.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url) return;

    directorAI.addChatMessage('system', '🌐 Link Ingestion', `Connecting to stream: ${url}...`);

    try {
      const resp = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await resp.json();

      if (data.success && data.videoUrl && data.videoUrl.startsWith('http')) {
        player.loadSpeakerMedia(data.videoUrl);
        directorAI.addChatMessage('system', '✅ Video Loaded', `Imported "${data.title || 'Stream'}". Top half framing active.`);
      } else {
        directorAI.addChatMessage('system', 'ℹ️ Direct Player', 'Streaming URL loaded in player. You can also drag-and-drop or upload video files directly.');
      }
    } catch (e) {
      directorAI.addChatMessage('system', 'ℹ️ Ingestion Notice', 'Link processed. For live YouTube/Kick streams, install yt-dlp on the server or drop the .mp4 file.');
    }
  });

  localVideoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      player.loadSpeakerMedia(file);
      directorAI.addChatMessage('system', '📁 File Loaded', `Loaded local video: ${file.name}. Speaker cropped in top half.`);
    }
  });

  // Preset Chips
  document.querySelectorAll('.preset-pills .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-pills .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const preset = STREAM_PRESETS[chip.dataset.preset];
      if (preset) {
        player.loadPreset(preset);
        updateTrimUI();
        applySettingsToUI({
          topCropY: preset.topCropY,
          topCropX: preset.topCropX,
          topZoom: preset.topZoom,
          splitRatio: preset.splitRatio,
          hookText: preset.hook
        });
        directorAI.addChatMessage('system', '⚡ Preset Switched', `Loaded "${preset.title}".`);
      }
    });
  });

  btnDemoStream.addEventListener('click', () => {
    player.loadPreset(STREAM_PRESETS['tutorial-demo']);
    updateTrimUI();
    directorAI.addChatMessage('system', '⚡ Demo Stream', 'Loaded Creator Demo preset with 1080x1920 9:16 vertical layout.');
  });

  // -------------------------------------------------------------
  // EXPORT ACTION & MODAL
  // -------------------------------------------------------------
  btnExportClip.addEventListener('click', () => {
    exporter.exportShort();
  });

  function showExportSuccessModal(clipData) {
    modalClipFilename.textContent = clipData.filename;
    modalVideoPlayer.src = clipData.videoUrl;
    btnDownloadClipDirect.href = clipData.videoUrl;
    btnDownloadClipDirect.download = clipData.filename;
    exportSuccessModal.style.display = 'flex';
  }

  btnCloseModal.addEventListener('click', () => {
    exportSuccessModal.style.display = 'none';
    modalVideoPlayer.pause();
  });

  btnDirectorReEdit.addEventListener('click', () => {
    exportSuccessModal.style.display = 'none';
    modalVideoPlayer.pause();
    directorPromptInput.focus();
  });

  // -------------------------------------------------------------
  // CLIPS GALLERY LOADER
  // -------------------------------------------------------------
  async function loadClipsGallery() {
    try {
      const resp = await fetch('/api/clips');
      if (resp.ok) {
        const data = await resp.json();
        renderClipsGrid(data.clips || []);
      }
    } catch (e) {
      console.warn('Could not load clips from server:', e);
    }
  }

  function renderClipsGrid(clips) {
    clipsCountBadge.textContent = clips.length;
    galleryCountTag.textContent = `${clips.length} clip${clips.length === 1 ? '' : 's'} saved in /clips`;

    if (clips.length === 0) {
      clipsGrid.innerHTML = `
        <div class="empty-clips-state">
          <span class="empty-icon">🎬</span>
          <p>No clips exported yet. Choose your moment above and click <b>"EXPORT SHORT"</b> to create <code>clip_01.mp4</code>!</p>
        </div>
      `;
      exporter.setClipIndex(1);
      return;
    }

    // Determine next index from existing clips
    let maxIdx = 0;
    clips.forEach(c => {
      const m = c.name.match(/clip_(\d+)\./);
      if (m) {
        const idx = parseInt(m[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    });
    exporter.setClipIndex(maxIdx + 1);

    clipsGrid.innerHTML = clips.map(clip => `
      <div class="clip-card">
        <div class="clip-card-preview">
          <video src="${clip.path}" preload="metadata" muted playsinline></video>
        </div>
        <div class="clip-card-body">
          <div class="clip-card-name">${clip.name}</div>
          <div class="clip-card-meta">
            <span>${clip.sizeFormatted || 'MP4 Video'}</span>
            <span>9:16 Short</span>
          </div>
          <div class="clip-card-actions">
            <a href="${clip.path}" download="${clip.name}" class="btn btn-primary btn-xs" style="flex:1;">⬇️ Download</a>
            <button class="btn btn-secondary btn-xs btn-card-play" data-src="${clip.path}">▶ Play</button>
          </div>
        </div>
      </div>
    `).join('');

    // Wire play buttons on cards
    document.querySelectorAll('.btn-card-play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.clip-card');
        const v = card.querySelector('video');
        if (v.paused) {
          v.play();
          btn.textContent = '⏸ Pause';
        } else {
          v.pause();
          btn.textContent = '▶ Play';
        }
      });
    });
  }

  btnRefreshClips.addEventListener('click', loadClipsGallery);
  document.getElementById('btnViewClips').addEventListener('click', () => {
    document.getElementById('clipsGallerySection').scrollIntoView({ behavior: 'smooth' });
  });

  // Initial load of clips
  loadClipsGallery();

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Space to Play/Pause when not typing
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      btnPlayPause.click();
    }
  });

  function formatTime(seconds) {
    const s = Math.max(0, seconds || 0);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
  }
});
