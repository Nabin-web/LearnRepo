(function() {
  'use strict';

  console.log('3D Store Widget initialized');

  // Get configuration from script tag
  const script = document.currentScript;
  const storeId = script ? script.getAttribute('data-store-id') : null;
  const domain = window.location.hostname;

  const API_URL = script ? script.getAttribute('data-api-url') || 'http://localhost:8000' : 'http://localhost:8000';

  if (!storeId && !domain) {
    console.error('Widget: No store ID or domain provided');
    return;
  }

  // Fetch widget configuration
  async function fetchConfig() {
    try {
      const url = storeId 
        ? `${API_URL}/api/stores/${storeId}`
        : `${API_URL}/api/widget/config?domain=${domain}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch widget config');
      
      const data = await response.json();
      
      // Extract widget config
      const config = storeId 
        ? { videoUrl: data.widgetConfig?.videoUrl, clickableLink: data.widgetConfig?.clickableLink }
        : data;
      
      if (config.videoUrl) {
        renderWidget(config);
      }
    } catch (error) {
      console.error('Widget error:', error);
    }
  }

  // Render the widget
  function renderWidget(config) {
    // Create shadow DOM for isolation
    const widgetContainer = document.createElement('div');
    widgetContainer.id = '3d-store-widget';
    document.body.appendChild(widgetContainer);

    const shadow = widgetContainer.attachShadow({ mode: 'open' });

    // Create styles
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
      }
      .widget-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .video-banner {
        width: 300px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        transition: transform 0.2s;
      }
      .video-banner:hover {
        transform: scale(1.05);
      }
      .video-banner video {
        width: 100%;
        height: auto;
        display: block;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
      }
      .modal-content {
        position: relative;
        width: 90%;
        max-width: 1200px;
        height: 80vh;
        background: white;
        border-radius: 12px;
        overflow: hidden;
      }
      .modal-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 24px;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-close:hover {
        background: rgba(0, 0, 0, 0.9);
      }
      iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `;
    shadow.appendChild(style);

    // Create widget HTML
    const container = document.createElement('div');
    container.className = 'widget-container';
    container.innerHTML = `
      <div class="video-banner">
        <video autoplay loop muted playsinline>
          <source src="${config.videoUrl}" type="video/mp4">
        </video>
      </div>
    `;
    shadow.appendChild(container);

    // Track analytics
    trackEvent('widget_loaded');

    const videoBanner = container.querySelector('.video-banner');
    const video = container.querySelector('video');

    video.addEventListener('loadeddata', () => {
      trackEvent('video_loaded');
    });

    // Click handler
    videoBanner.addEventListener('click', () => {
      trackEvent('video_clicked');
      openModal(config.clickableLink);
    });
  }

  // Open modal with iframe
  function openModal(url) {
    const shadow = document.querySelector('#3d-store-widget').shadowRoot;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">×</button>
        <iframe src="${url}"></iframe>
      </div>
    `;
    shadow.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Analytics tracking
  function trackEvent(eventName) {
    console.log('Widget event:', eventName);
    
    // Send to backend if needed
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: '3d_store_widget',
        event_label: domain || storeId,
      });
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchConfig);
  } else {
    fetchConfig();
  }
})();
