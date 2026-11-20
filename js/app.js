/**
 * Main Web Application Controller for ViralClips AI
 * Full Mobile-Native App Experience with Hinglish Captions, YouTube Timestamps & Layout Focus
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
  const clipDurationTag = document.getElementById('clipDurationTag');

  // Mobile Elements
  const mobileTabBar = document.getElementById('mobileTabBar');
  const btnMobilePlayToggle = document.getElementById('btnMobilePlayToggle');
  const mobilePlayIcon = document.getElementById('mobilePlayIcon');
  const mobileDurText = document.getElementById('mobileDurText');
  const mobileModeText = document.getElementById('mobileModeText');
  const btnMobileStickyExport = document.getElementById('btnMobileStickyExport');
  const btnQuickExportTop = document.getElementById('btnQuickExportTop');
  const topClipName = document.getElementById('topClipName');

  // Timestamps & Duration Controls
  const timeFormattedStart = document.getElementById('timeFormattedStart');
  const timeFormattedEnd = document.getElementById('timeFormattedEnd');
  const sliderTrimStart = document.getElementById('sliderTrimStart');
  const sliderTrimEnd = document.getElementById('sliderTrimEnd');
  const trimStartHidden = document.getElementById('trimStart');
  const trimEndHidden = document.getElementById('trimEnd');
  const momentTrimBar = document.getElementById('momentTrimBar');

  // Focus & Layout Controls
  const topCropY = document.getElementById('topCropY');
  const topCropX = document.getElementById('topCropX');
  const topZoom = document.getElementById('topZoom');
  const splitRatio = document.getElementById('splitRatio');
  const lblTopCropY = document.getElementById('lblTopCropY');
  const lblTopCropX = document.getElementById('lblTopCropX');
  const lblTopZoom = document.getElementById('lblTopZoom');
  const lblSplitRatio = document.getElementById('lblSplitRatio');
  const safeZoneSplitTag = document.querySelector('.split-tag');
  const guideSplitLine = document.querySelector('.guide-split-line');

  // Captions & Script Editor
  const captionScriptTextarea = document.getElementById('captionScriptTextarea');
  const btnApplyCustomScript = document.getElementById('btnApplyCustomScript');
  const btnAutoGenerateScript = document.getElementById('btnAutoGenerateScript');
  const captionOffset = document.getElementById('captionOffset');
  const lblCaptionOffset = document.getElementById('lblCaptionOffset');
  const hookTextInput = document.getElementById('hookTextInput');
  const activeColorPreview = document.getElementById('activeColorPreview');

  // Ingestion & URL
  const videoUrlInput = document.getElementById('videoUrlInput');
  const btnFetchUrl = document.getElementById('btnFetchUrl');
  const localVideoUpload = document.getElementById('localVideoUpload');
  const btnDemoStream = document.getElementById('btnDemoStream');

  // Export & Gallery
  const btnExportClip = document.getElementById('btnExportClip');
  const exportProgressContainer = document.getElementById('exportProgressContainer');
  const exportProgressBar = document.getElementById('exportProgressBar');
  const exportProgressText = document.getElementById('exportProgressText');
  const nextClipNameBadge = document.getElementById('nextClipNameBadge');
  const exportSubFilename = document.getElementById('exportSubFilename');
  const clipsGrid = document.getElementById('clipsGrid');
  const galleryCountTag = document.getElementById('galleryCountTag');
  const btnRefreshClips = document.getElementById('btnRefreshClips');

  // Modals
  const exportSuccessModal = document.getElementById('exportSuccessModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalVideoPlayer = document.getElementById('modalVideoPlayer');
  const modalClipFilename = document.getElementById('modalClipFilename');
  const btnDownloadClipDirect = document.getElementById('btnDownloadClipDirect');
  const btnDirectorReEdit = document.getElementById('btnDirectorReEdit');

  // Director Chat
  const directorChatLogs = document.getElementById('directorChatLogs');
  const directorPromptForm = document.getElementById('directorPromptForm');
  const directorPromptInput = document.getElementById('directorPromptInput');

  // 1. Initialize Captions Engine with Hinglish Default
  const captionsEngine = new ViralCaptionsEngine({
    highlightColor: '#FFE600',
    inactiveColor: '#FFFFFF',
    fontSize: 48,
    captionYPercent: 0.50,
    captionOffset: 0.0,
    hookText: 'WAIT FOR IT... 💀',
    language: 'hinglish'
  });

  // Populate textarea with default Hinglish script
  captionScriptTextarea.value = "Bhai ye kya bol diya tune sach me aisa hoga kya dekho aage kya hua";

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
    },
    onLayoutChange: (mode) => {
      updateLayoutFocusUI(mode);
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
      layoutMode: player.layoutMode,
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

  // Initial Load with Hinglish Preset
  player.loadPreset(STREAM_PRESETS['tutorial-demo']);
  updateTrimDisplays();

  // -------------------------------------------------------------
  // MOBILE NAVIGATION TABS (CapCut Mobile App Style)
  // -------------------------------------------------------------
  document.querySelectorAll('.m-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.dataset.section;
      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        // On mobile, scroll smoothly to the tapped section
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // -------------------------------------------------------------
  // PLAYBACK COORDINATION
  // -------------------------------------------------------------
  function syncPlayPause(isPlaying) {
    playIcon.textContent = isPlaying ? '⏸' : '▶';
    if (mobilePlayIcon) mobilePlayIcon.textContent = isPlaying ? '⏸' : '▶';
  }

  btnPlayPause.addEventListener('click', () => {
    const isPlaying = player.togglePlay();
    syncPlayPause(isPlaying);
  });

  if (btnMobilePlayToggle) {
    btnMobilePlayToggle.addEventListener('click', () => {
      const isPlaying = player.togglePlay();
      syncPlayPause(isPlaying);
    });
  }

  timelineScrubber.addEventListener('input', (e) => {
    player.seekTo(parseFloat(e.target.value));
  });

  // -------------------------------------------------------------
  // YOUTUBE TIMESTAMP PARSER & CLIP CUTTER
  // -------------------------------------------------------------
  function parseTimestampToSeconds(str) {
    if (!str) return 0;
    const clean = str.trim();
    // Case 1: MM:SS or HH:MM:SS
    if (clean.includes(':')) {
      const parts = clean.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    // Case 2: 1m30s or 90s
    let total = 0;
    const mMatch = clean.match(/(\d+)m/);
    const sMatch = clean.match(/(\d+(\.\d+)?)s?/);
    if (mMatch) total += parseInt(mMatch[1], 10) * 60;
    if (sMatch && !mMatch) total = parseFloat(sMatch[1]);
    else if (sMatch && mMatch) total += parseFloat(sMatch[1]);
    return total || 0;
  }

  function setClipTimes(startSec, endSec) {
    const maxDur = Math.max(30.0, player.duration || 60.0);
    const s = Math.max(0, Math.min(maxDur - 1, startSec));
    const e = Math.max(s + 1, Math.min(maxDur, endSec));

    player.trimStart = Number(s.toFixed(1));
    player.trimEnd = Number(e.toFixed(1));

    updateTrimDisplays();
  }

  function updateTrimDisplays() {
    const s = player.trimStart;
    const e = player.trimEnd;
    const dur = Math.max(0, e - s);

    timeFormattedStart.value = formatTime(s);
    timeFormattedEnd.value = formatTime(e);
    trimStartHidden.value = s;
    trimEndHidden.value = e;

    sliderTrimStart.max = player.duration || 60;
    sliderTrimEnd.max = player.duration || 60;
    sliderTrimStart.value = s;
    sliderTrimEnd.value = e;

    timelineScrubber.max = player.duration || 60;

    const leftPct = (s / (player.duration || 60)) * 100;
    const widthPct = ((e - s) / (player.duration || 60)) * 100;
    momentTrimBar.style.left = `${leftPct}%`;
    momentTrimBar.style.width = `${widthPct}%`;

    const durText = `${dur.toFixed(1)}s Short`;
    clipDurationTag.textContent = durText;
    if (mobileDurText) mobileDurText.textContent = durText;
  }

  // Stepper Buttons (+1s, -1s, +5s, -5s)
  document.getElementById('btnStartMinus5').addEventListener('click', () => setClipTimes(player.trimStart - 5, player.trimEnd));
  document.getElementById('btnStartMinus1').addEventListener('click', () => setClipTimes(player.trimStart - 1, player.trimEnd));
  document.getElementById('btnStartPlus1').addEventListener('click', () => setClipTimes(player.trimStart + 1, player.trimEnd));
  document.getElementById('btnStartPlus5').addEventListener('click', () => setClipTimes(player.trimStart + 5, player.trimEnd));

  document.getElementById('btnEndMinus5').addEventListener('click', () => setClipTimes(player.trimStart, player.trimEnd - 5));
  document.getElementById('btnEndMinus1').addEventListener('click', () => setClipTimes(player.trimStart, player.trimEnd - 1));
  document.getElementById('btnEndPlus1').addEventListener('click', () => setClipTimes(player.trimStart, player.trimEnd + 1));
  document.getElementById('btnEndPlus5').addEventListener('click', () => setClipTimes(player.trimStart, player.trimEnd + 5));

  timeFormattedStart.addEventListener('change', () => {
    const sec = parseTimestampToSeconds(timeFormattedStart.value);
    setClipTimes(sec, player.trimEnd);
  });

  timeFormattedEnd.addEventListener('change', () => {
    const sec = parseTimestampToSeconds(timeFormattedEnd.value);
    setClipTimes(player.trimStart, sec);
  });

  sliderTrimStart.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    setClipTimes(val, Math.max(val + 3, player.trimEnd));
  });

  sliderTrimEnd.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    setClipTimes(Math.min(val - 3, player.trimStart), val);
  });

  // Duration Presets (15s, 30s, 45s, 60s)
  document.querySelectorAll('.dur-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dur-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetDuration = parseFloat(btn.dataset.dur);
      setClipTimes(player.trimStart, player.trimStart + targetDuration);
      directorAI.addChatMessage('system', '⏱️ Clip Duration', `Set moment duration to ${targetDuration}s.`);
    });
  });

  // -------------------------------------------------------------
  // FOCUS & LAYOUT MODES (Only Face, Only Gameplay, Split 50/50)
  // -------------------------------------------------------------
  function updateLayoutFocusUI(mode) {
    player.setLayoutMode(mode);

    // Update top pills & big focus cards
    document.querySelectorAll('.layout-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.layout === mode);
    });
    document.querySelectorAll('.focus-card').forEach(c => {
      c.classList.toggle('active', c.dataset.focus === mode);
    });

    const splitRatioItem = document.getElementById('splitRatioItem');
    const vpFormatBadge = document.getElementById('vpFormatBadge');

    if (mode === 'gameplay-only') {
      if (safeZoneSplitTag) safeZoneSplitTag.textContent = '🎮 100% FULLSCREEN GAMEPLAY';
      if (guideSplitLine) guideSplitLine.style.display = 'none';
      if (splitRatioItem) splitRatioItem.style.display = 'none';
      if (vpFormatBadge) vpFormatBadge.textContent = 'GAMEPLAY ONLY SHORT';
      if (mobileModeText) mobileModeText.textContent = 'Gameplay Only';
      document.querySelectorAll('.framing-speaker-controls-card').forEach(el => el.style.opacity = '0.5');
    } else if (mode === 'face-only') {
      if (safeZoneSplitTag) safeZoneSplitTag.textContent = '🎙️ 100% FULLSCREEN SPEAKER';
      if (guideSplitLine) guideSplitLine.style.display = 'none';
      if (splitRatioItem) splitRatioItem.style.display = 'none';
      if (vpFormatBadge) vpFormatBadge.textContent = 'FACECAM ONLY SHORT';
      if (mobileModeText) mobileModeText.textContent = 'Facecam Only';
      document.querySelectorAll('.framing-speaker-controls-card').forEach(el => el.style.opacity = '1');
    } else {
      if (safeZoneSplitTag) safeZoneSplitTag.textContent = '50% SPLIT: SPEAKER TOP / GAMEPLAY BOTTOM';
      if (guideSplitLine) guideSplitLine.style.display = 'flex';
      if (splitRatioItem) splitRatioItem.style.display = 'block';
      if (vpFormatBadge) vpFormatBadge.textContent = '9:16 VERTICAL SHORT';
      if (mobileModeText) mobileModeText.textContent = 'Split 50/50';
      document.querySelectorAll('.framing-speaker-controls-card').forEach(el => el.style.opacity = '1');
    }
  }

  document.querySelectorAll('.layout-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => updateLayoutFocusUI(btn.dataset.layout));
  });

  document.querySelectorAll('.focus-card').forEach(card => {
    card.addEventListener('click', () => updateLayoutFocusUI(card.dataset.focus));
  });

  // Face Framing Sliders
  topCropY.addEventListener('input', (e) => {
    player.topCropY = parseInt(e.target.value, 10) / 100;
    lblTopCropY.textContent = `${e.target.value}%`;
  });

  topCropX.addEventListener('input', (e) => {
    player.topCropX = parseInt(e.target.value, 10) / 100;
    lblTopCropX.textContent = `${e.target.value}%`;
  });

  topZoom.addEventListener('input', (e) => {
    player.topZoom = parseInt(e.target.value, 10) / 100;
    lblTopZoom.textContent = `${player.topZoom.toFixed(1)}x`;
  });

  splitRatio.addEventListener('input', (e) => {
    player.splitRatio = parseInt(e.target.value, 10) / 100;
    lblSplitRatio.textContent = `${e.target.value} / ${100 - parseInt(e.target.value, 10)}`;
  });

  document.querySelectorAll('.gameplay-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.gameplay-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      player.gameplayPreset = card.dataset.gameplay;
    });
  });

  // -------------------------------------------------------------
  // MULTI-LANGUAGE HINGLISH CAPTIONS ENGINE
  // -------------------------------------------------------------
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.dataset.lang;
      captionsEngine.setLanguage(lang);

      if (lang === 'hindi') {
        captionScriptTextarea.value = "भाई ये क्या बोल दिया तूने सच में ऐसा हो सकता है क्या देखो आगे क्या हुआ";
      } else if (lang === 'hinglish') {
        captionScriptTextarea.value = "Bhai ye kya bol diya tune sach me aisa hoga kya dekho aage kya hua";
      } else {
        captionScriptTextarea.value = "Wait look at what just happened on the screen right now watch this";
      }

      captionsEngine.generateFromText(captionScriptTextarea.value, player.trimStart + 0.3, player.trimEnd);
      directorAI.addChatMessage('system', '🇮🇳 Language Selected', `Switched caption engine to ${lang.toUpperCase()}.`);
    });
  });

  // Apply User's Custom Typed Script to Karaoke Engine
  btnApplyCustomScript.addEventListener('click', () => {
    const text = captionScriptTextarea.value.trim();
    if (!text) return;

    captionsEngine.generateFromText(text, player.trimStart + 0.3, player.trimEnd);
    directorAI.addChatMessage('system', '✨ Captions Applied', `Generated word-by-word karaoke captions for: "${text.substring(0, 35)}..."`);
    player.seekTo(player.trimStart);
  });

  btnAutoGenerateScript.addEventListener('click', () => {
    captionsEngine.generateDefaultCaptions(captionsEngine.language || 'hinglish');
    captionScriptTextarea.value = captionsEngine.words.map(w => w.word).join(' ');
    directorAI.addChatMessage('system', '⚡ Auto-Transcribe', 'Generated synchronized karaoke captions for this moment.');
  });

  captionOffset.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    captionsEngine.setOffset(val);
    lblCaptionOffset.textContent = (val >= 0 ? `+${val.toFixed(2)}s` : `${val.toFixed(2)}s`);
  });

  document.getElementById('btnOffsetMinus02').addEventListener('click', () => {
    captionOffset.value = (parseFloat(captionOffset.value) - 0.2).toFixed(2);
    captionOffset.dispatchEvent(new Event('input'));
  });

  document.getElementById('btnOffsetPlus02').addEventListener('click', () => {
    captionOffset.value = (parseFloat(captionOffset.value) + 0.2).toFixed(2);
    captionOffset.dispatchEvent(new Event('input'));
  });

  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const color = swatch.dataset.color;
      captionsEngine.setHighlightColor(color);
      activeColorPreview.style.background = color;
    });
  });

  hookTextInput.addEventListener('input', (e) => captionsEngine.setHookText(e.target.value));

  document.querySelectorAll('[data-hook]').forEach(chip => {
    chip.addEventListener('click', () => {
      hookTextInput.value = chip.dataset.hook;
      captionsEngine.setHookText(chip.dataset.hook);
    });
  });

  // -------------------------------------------------------------
  // SOURCE INGESTION (Supports YouTube ?t= timestamp parsing)
  // -------------------------------------------------------------
  btnFetchUrl.addEventListener('click', async () => {
    const rawUrl = videoUrlInput.value.trim();
    if (!rawUrl) return;

    btnFetchUrl.disabled = true;
    btnFetchUrl.innerHTML = '<span>⏳ Loading...</span>';

    // Check if YouTube timestamp exists in URL (e.g. &t=1m30s or ?t=90)
    const tParam = rawUrl.match(/[?&#]t=([^&]+)/);
    if (tParam) {
      const parsedStart = parseTimestampToSeconds(tParam[1]);
      setClipTimes(parsedStart, parsedStart + 15.0);
      directorAI.addChatMessage('system', '⏱️ Timestamp Detected', `Set start timestamp to ${formatTime(parsedStart)} from URL.`);
    }

    // Direct Video Stream (.mp4, .webm, .mov)
    if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(rawUrl)) {
      player.loadSpeakerMedia(rawUrl);
      directorAI.addChatMessage('system', '✅ Video Stream Ready', 'Direct stream loaded into 9:16 player.');
      btnFetchUrl.disabled = false;
      btnFetchUrl.innerHTML = '<span>Fetch Video</span>';
      return;
    }

    // Local server with yt-dlp check
    try {
      const resp = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && data.videoUrl && data.videoUrl.startsWith('http')) {
          player.loadSpeakerMedia(data.videoUrl);
          directorAI.addChatMessage('system', '✅ Stream Extracted', `Loaded "${data.title || 'Stream'}".`);
          btnFetchUrl.disabled = false;
          btnFetchUrl.innerHTML = '<span>Fetch Video</span>';
          return;
        }
      }
    } catch (e) {}

    // Cloud Stream Extraction
    const streamResolvers = [
      'https://cobalt-api.kwiatekm.tokyo/api/json',
      'https://api.cobalt.tools/api/json'
    ];
    let found = false;

    for (const res of streamResolvers) {
      try {
        const cResp = await fetch(res, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl, vQuality: '720' })
        });
        if (cResp.ok) {
          const cData = await cResp.json();
          if (cData.url) {
            player.loadSpeakerMedia(cData.url);
            directorAI.addChatMessage('system', '🎉 Stream Connected', 'Video loaded into 9:16 studio!');
            found = true;
            break;
          }
        }
      } catch (err) {}
    }

    btnFetchUrl.disabled = false;
    btnFetchUrl.innerHTML = '<span>Fetch Video</span>';

    if (!found) {
      directorAI.addChatMessage('system', 'ℹ️ Link Ingested', 
        `To bypass YouTube browser restrictions on your PC, run \`node server/server.js\` where your yt-dlp is installed, or drop your downloaded video with "Upload from Phone/PC".`
      );
    }
  });

  localVideoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      player.loadSpeakerMedia(file);
      // Auto-generate captions so they never disappear
      captionsEngine.generateDefaultCaptions(captionsEngine.language || 'hinglish');
      directorAI.addChatMessage('system', '📁 Video Loaded', `Loaded ${file.name}. Hinglish captions active.`);
    }
  });

  btnDemoStream.addEventListener('click', () => {
    player.loadPreset(STREAM_PRESETS['tutorial-demo']);
    updateTrimDisplays();
    directorAI.addChatMessage('system', '⚡ Demo Ready', 'Loaded demo with Hinglish captions and 9:16 layout.');
  });

  document.querySelectorAll('.preset-pills .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.preset-pills .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const preset = STREAM_PRESETS[chip.dataset.preset];
      if (preset) {
        player.loadPreset(preset);
        updateTrimDisplays();
      }
    });
  });

  // -------------------------------------------------------------
  // AI DIRECTOR & PROMPT FORM
  // -------------------------------------------------------------
  directorPromptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const prompt = directorPromptInput.value.trim();
    if (prompt) {
      directorAI.processPrompt(prompt);
      directorPromptInput.value = '';
    }
  });

  document.querySelectorAll('.prompt-chip').forEach(chip => {
    chip.addEventListener('click', () => directorAI.processPrompt(chip.dataset.cmd));
  });

  function applySettingsToUI(adj) {
    if (adj.layoutMode !== undefined) updateLayoutFocusUI(adj.layoutMode);
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
    if (adj.hookText !== undefined) {
      captionsEngine.setHookText(adj.hookText);
      hookTextInput.value = adj.hookText;
    }
  }

  // -------------------------------------------------------------
  // EXPORT SHORT ACTION
  // -------------------------------------------------------------
  btnExportClip.addEventListener('click', () => exporter.exportShort());
  if (btnMobileStickyExport) btnMobileStickyExport.addEventListener('click', () => exporter.exportShort());
  if (btnQuickExportTop) btnQuickExportTop.addEventListener('click', () => exporter.exportShort());

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
  });

  // -------------------------------------------------------------
  // CLIPS GALLERY
  // -------------------------------------------------------------
  async function loadClipsGallery() {
    try {
      const resp = await fetch('/api/clips');
      if (resp.ok) {
        const data = await resp.json();
        renderClipsGrid(data.clips || []);
      }
    } catch (e) {}
  }

  function renderClipsGrid(clips) {
    galleryCountTag.textContent = `${clips.length} clip${clips.length === 1 ? '' : 's'} saved`;

    let maxIdx = 0;
    clips.forEach(c => {
      const m = c.name.match(/clip_(\d+)\./);
      if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
    });
    const nextIdx = maxIdx + 1;
    exporter.setClipIndex(nextIdx);
    const padded = String(nextIdx).padStart(2, '0');
    if (topClipName) topClipName.textContent = `clip_${padded}.mp4`;
    if (exportSubFilename) exportSubFilename.textContent = `clip_${padded}.mp4`;

    if (clips.length === 0) return;

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
          </div>
        </div>
      </div>
    `).join('');
  }

  btnRefreshClips.addEventListener('click', loadClipsGallery);
  loadClipsGallery();

  function formatTime(seconds) {
    const s = Math.max(0, seconds || 0);
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${ms}`;
  }
});
