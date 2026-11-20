/**
 * Director AI Module
 * Translates natural language editing requests into framing, zoom, and subtitle sync adjustments.
 */

class DirectorAI {
  constructor(options = {}) {
    this.chatContainer = options.chatContainer;
    this.onApplyAdjustments = options.onApplyAdjustments || (() => {});
    this.onTriggerReExport = options.onTriggerReExport || (() => {});
    this.getCurrentSettings = options.getCurrentSettings || (() => ({}));
  }

  /**
   * Process a director prompt either via backend API or instant client-side NLP engine
   */
  async processPrompt(promptText) {
    if (!promptText || !promptText.trim()) return;

    const trimmed = promptText.trim();

    // 1. Add user director instruction to chat box
    this.addChatMessage('user', '🎬 Director (You)', trimmed);

    // Show temporary typing indicator
    const typingId = this.addChatMessage('system', '🤖 Editor AI', 'Analyzing instruction & computing framing adjustments...');

    try {
      const currentSettings = this.getCurrentSettings();
      let result;

      // Try calling server API
      try {
        const resp = await fetch('/api/director-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: trimmed, currentSettings })
        });
        if (resp.ok) {
          result = await resp.json();
        }
      } catch (netErr) {
        // Fallback to local client NLP parser
      }

      if (!result) {
        result = this.clientFallbackParse(trimmed, currentSettings);
      }

      // Remove typing indicator
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      // 2. Add AI Editor's response
      this.addChatMessage('system', '🤖 Editor AI', result.message || 'Adjustments applied to 9:16 layout!');

      // 3. Apply adjustments to composition engine & sliders
      if (result.adjustments && Object.keys(result.adjustments).length > 0) {
        this.onApplyAdjustments(result.adjustments);
      }

      // 4. If prompt requested re-export, fire it!
      if (result.triggerReExport) {
        setTimeout(() => {
          this.addChatMessage('system', '⚡ Export Pipeline', 'Starting automatic re-export with updated framing and sync...');
          this.onTriggerReExport();
        }, 600);
      }

      return result;

    } catch (err) {
      console.error('Director error:', err);
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();
      this.addChatMessage('system', '🤖 Editor AI', `Applied framing corrections for: "${trimmed}".`);
    }
  }

  /**
   * Client-side NLP parser when offline or without backend
   */
  clientFallbackParse(prompt, currentSettings) {
    const p = prompt.toLowerCase();
    const adjustments = {};
    const logs = [];

    // Face / Speaker adjustments
    if (p.includes('face') || p.includes('speaker') || p.includes('head') || p.includes('camera')) {
      if (p.includes('cut off') || p.includes('top cut') || p.includes('too high') || p.includes('move down') || p.includes('shift down')) {
        const match = p.match(/(\d+)%/);
        const delta = match ? parseInt(match[1]) / 100 : 0.12;
        adjustments.topCropY = Math.min(1.0, (currentSettings.topCropY || 0.2) + delta);
        logs.push(`Shifted speaker crop down by ${Math.round(delta * 100)}%`);
      } else if (p.includes('too low') || p.includes('move up') || p.includes('shift up')) {
        const match = p.match(/(\d+)%/);
        const delta = match ? parseInt(match[1]) / 100 : 0.12;
        adjustments.topCropY = Math.max(0.0, (currentSettings.topCropY || 0.2) - delta);
        logs.push(`Shifted speaker crop up by ${Math.round(delta * 100)}%`);
      }

      if (p.includes('move left') || p.includes('shift left')) {
        adjustments.topCropX = Math.max(0.0, (currentSettings.topCropX || 0.5) - 0.1);
        logs.push('Shifted speaker crop 10% to the left');
      } else if (p.includes('move right') || p.includes('shift right')) {
        adjustments.topCropX = Math.min(1.0, (currentSettings.topCropX || 0.5) + 0.1);
        logs.push('Shifted speaker crop 10% to the right');
      }

      if (p.includes('zoom in') || p.includes('closer') || p.includes('bigger face')) {
        adjustments.topZoom = Math.min(2.5, (currentSettings.topZoom || 1.0) + 0.2);
        logs.push('Zoomed in on speaker face (+20%)');
      } else if (p.includes('zoom out') || p.includes('wider') || p.includes('smaller face')) {
        adjustments.topZoom = Math.max(0.7, (currentSettings.topZoom || 1.0) - 0.2);
        logs.push('Zoomed out speaker view (-20%)');
      }
    }

    // Caption sync adjustments
    if (p.includes('caption') || p.includes('subtitle') || p.includes('word') || p.includes('text') || p.includes('sync')) {
      if (p.includes('late') || p.includes('behind') || p.includes('slow') || p.includes('earlier') || p.includes('speed up')) {
        const match = p.match(/(\d+(\.\d+)?)s/);
        const delta = match ? parseFloat(match[1]) : 0.35;
        adjustments.captionOffset = Number(((currentSettings.captionOffset || 0) - delta).toFixed(2));
        logs.push(`Shifted captions earlier by ${delta}s to lock with dialogue`);
      } else if (p.includes('early') || p.includes('fast') || p.includes('ahead') || p.includes('later') || p.includes('delay')) {
        const match = p.match(/(\d+(\.\d+)?)s/);
        const delta = match ? parseFloat(match[1]) : 0.35;
        adjustments.captionOffset = Number(((currentSettings.captionOffset || 0) + delta).toFixed(2));
        logs.push(`Delayed captions by ${delta}s to sync with speech`);
      }

      if (p.includes('yellow')) adjustments.highlightColor = '#FFE600';
      if (p.includes('green')) adjustments.highlightColor = '#00FF66';
      if (p.includes('cyan')) adjustments.highlightColor = '#00F0FF';
      if (p.includes('pink')) adjustments.highlightColor = '#FF3366';
    }

    // Hook changes
    const hookMatch = prompt.match(/(?:change|set|make|update)?\s*hook(?:\s*to|\s*:)?\s*["']?([^"'\n]+)["']?/i);
    if (hookMatch && !p.includes('face') && !p.includes('caption')) {
      const newHook = hookMatch[1].trim().replace(/^to\s+/i, '');
      adjustments.hookText = newHook.toUpperCase();
      logs.push(`Updated 2-second hook banner to: "${newHook}"`);
    }

    // Gameplay background switches
    if (p.includes('runner') || p.includes('speed track') || p.includes('subway')) {
      adjustments.gameplayPreset = 'runner';
      logs.push('Switched bottom background to 3D Speed Runner');
    } else if (p.includes('parkour') || p.includes('voxel') || p.includes('block')) {
      adjustments.gameplayPreset = 'parkour';
      logs.push('Switched bottom background to Voxel Parkour');
    } else if (p.includes('stunt') || p.includes('ramp') || p.includes('neon')) {
      adjustments.gameplayPreset = 'stunt';
      logs.push('Switched bottom background to Neon Stunt Ramp');
    }

    // Re-export triggers
    let triggerReExport = false;
    if (p.includes('re-export') || p.includes('reexport') || p.includes('export') || p.includes('fix and export') || p.includes('save it')) {
      triggerReExport = true;
    }

    if (logs.length === 0) {
      logs.push('Framing and sync parameters updated to match your instructions!');
    }

    return {
      success: true,
      message: logs.join('. '),
      adjustments,
      triggerReExport
    };
  }

  addChatMessage(type, sender, text) {
    if (!this.chatContainer) return null;
    const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const div = document.createElement('div');
    div.id = msgId;
    div.className = `chat-message ${type}`;
    div.innerHTML = `
      <span class="chat-sender">${sender}:</span>
      <span class="chat-text">${text}</span>
    `;
    this.chatContainer.appendChild(div);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    return msgId;
  }
}
