/// <reference types="chrome"/>

import type { ClipResponse } from '../types/messages';

interface ApiResponse {
  id: string;
  sonar_status: string;
  sonar_data?: {
    error?: string;
  };
}

const SUPABASE_FUNCTION_URL = 'https://xedzwpnjonvrazqlowhg.functions.supabase.co/clip-query';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZHp3cG5qb252cmF6cWxvd2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczNjE4NjEsImV4cCI6MjA2MjkzNzg2MX0.72U_cJtgVYxThX8vqyZ1hkPK6dluvqqEcWEx1nIN7Ro'; // 🔐 Replace this securely

document.addEventListener('DOMContentLoaded', function () {
  const clipButton = document.getElementById('clipButton') as HTMLButtonElement;
  const openSidepanelButton = document.getElementById('openSidepanelButton') as HTMLButtonElement;
  const statusText = document.getElementById('status') as HTMLSpanElement;
  const statusIcon = document.getElementById('statusIcon') as HTMLDivElement;

  if (!clipButton || !openSidepanelButton || !statusText || !statusIcon) {
    console.error('Required DOM elements not found');
    return;
  }

  const buttonContent = {
    loading: document.createRange().createContextualFragment(`
      <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="16"></circle>
      </svg>
      Clipping...
    `),
    default: document.createRange().createContextualFragment(`
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      Clip Current Page
    `)
  };

  function updateStatus(message: string, type: 'ready' | 'error' = 'ready'): void {
    requestAnimationFrame(() => {
      statusText.textContent = message;
      statusIcon.className = `status-icon ${type}`;
    });
  }

  function setLoading(isLoading: boolean): void {
    requestAnimationFrame(() => {
      clipButton.disabled = isLoading;
      clipButton.innerHTML = '';
      clipButton.appendChild(isLoading ? buttonContent.loading.cloneNode(true) : buttonContent.default.cloneNode(true));
    });
  }

  clipButton.addEventListener('click', async () => {
    try {
      setLoading(true);
      updateStatus('Clipping content...', 'ready');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'CLIP_CONTENT' });
      if (!response?.success) throw new Error(response.error || 'Content script failed to clip content');

      const rawQuery = response.data?.raw_query;
      if (!rawQuery) throw new Error('Missing raw_query');

      const apiResponse = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ raw_query: rawQuery })
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.text();
        throw new Error(`API Error: ${error}`);
      }

      const result = await apiResponse.json() as ApiResponse;
      console.log('✅ Supabase function response:', result);

      if (result.id && result.sonar_status) {
        updateStatus('Clipped & sent successfully!', 'ready');
        if (result.sonar_status === 'error') {
          console.warn('⚠️ Sonar issue:', result.sonar_data?.error);
        }
      } else {
        throw new Error('Invalid backend response format');
      }

    } catch (err) {
      console.error('❌ Error:', err);
      updateStatus(err instanceof Error ? err.message : 'Failed to clip content', 'error');
    } finally {
      setLoading(false);
    }
  });

  openSidepanelButton.addEventListener('click', async () => {
    if (chrome.sidePanel) {
      await chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    } else {
      chrome.windows.create({
        url: 'sidepanel.html',
        type: 'popup',
        width: 400,
        height: 600
      });
    }
  });

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const currentUrl = tabs[0]?.url;
    if (!currentUrl?.includes('perplexity.ai')) {
      clipButton.disabled = true;
      updateStatus('Please navigate to Perplexity AI', 'error');
    }
  });
});