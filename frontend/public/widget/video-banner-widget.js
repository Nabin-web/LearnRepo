/**
 * Video Banner Widget
 * A loadable JavaScript widget that displays a floating video banner
 * and opens a clickable link in an iframe overlay.
 *
 * Usage:
 * <script src="https://your-domain.com/widget/video-banner-widget.js" data-api-url="http://localhost:8000"></script>
 */

(function () {
  "use strict";

  // Configuration
  const script = document.currentScript;
  const API_URL = script
    ? script.getAttribute("data-api-url") || "http://localhost:8000"
    : "http://localhost:8000";
  const currentDomain = window.location.hostname;
  const storeId = script ? script.getAttribute("data-store-id") : null;
  const WIDGET_ID = "video-banner-widget";

  // Analytics service endpoint
  const ANALYTICS_ENDPOINT = `${API_URL}/api/widget/analytics`;

  /**
   * Track analytics events
   * Reports events to the backend analytics service
   */
  function trackEvent(eventName, metadata = {}) {
    const eventData = {
      event: eventName,
      domain: currentDomain,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      ...metadata,
    };

    // Send to backend analytics service
    fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
      keepalive: true, // Ensures request completes even if page unloads
    }).catch((err) => {
      console.warn("Analytics tracking failed:", err);
    });

    // Also log for debugging
    console.log(`[Widget Analytics] ${eventName}`, eventData);
  }

  /**
   * Fetch widget configuration from backend
   * Supports both store-based (store_id) and domain-based lookup
   */
  async function fetchWidgetConfig(targetStoreId) {
    try {
      // Use provided storeId or fall back to script attribute
      const effectiveStoreId = targetStoreId || storeId;

      // Build URL with store_id if provided, otherwise use domain
      let url;
      if (effectiveStoreId) {
        // Store-based lookup
        url = `${API_URL}/api/widget/config?domain=${encodeURIComponent(
          currentDomain
        )}&store_id=${encodeURIComponent(effectiveStoreId)}`;
      } else {
        // Domain-based lookup (default)
        url = `${API_URL}/api/widget/config?domain=${encodeURIComponent(
          currentDomain
        )}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch widget config: ${response.status}`);
      }

      const config = await response.json();

      if (!config.videoUrl || !config.clickableLink) {
        throw new Error(
          "Invalid widget configuration: missing videoUrl or clickableLink"
        );
      }

      return config;
    } catch (error) {
      console.error("[Widget] Error fetching configuration:", error);
      return null;
    }
  }

  /**
   * Clean up and remove the widget from DOM
   */
  function cleanupWidget() {
    const existingWidget = document.getElementById(WIDGET_ID);
    if (existingWidget) {
      // Stop any videos before removing
      const shadow = existingWidget.shadowRoot;
      if (shadow) {
        const video = shadow.querySelector("video");
        if (video) {
          video.pause();
          video.src = "";
          video.load();
        }
        // Remove any open modals
        const modal = shadow.querySelector(".modal-overlay");
        if (modal) {
          modal.remove();
        }
      }
      existingWidget.remove();
      console.log("[Widget] Widget cleaned up");
    }
  }

  /**
   * Create and render the widget
   */
  function renderWidget(config, targetStoreId) {
    // Always cleanup existing widget first to ensure fresh render
    cleanupWidget();

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.id = WIDGET_ID;
    widgetContainer.setAttribute(
      "data-store-id",
      targetStoreId || storeId || ""
    );
    document.body.appendChild(widgetContainer);

    // Use Shadow DOM for style isolation
    const shadow = widgetContainer.attachShadow({ mode: "open" });

    // Inject styles
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
      }
      .widget-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      .video-banner {
        width: 300px;
        max-width: calc(100vw - 40px);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        background: #000;
      }
      .video-banner:hover {
        transform: scale(1.05);
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
      }
      .video-banner:active {
        transform: scale(1.02);
      }
      .video-banner video {
        width: 100%;
        height: auto;
        display: block;
        pointer-events: none;
      }
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000000;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .modal-content {
        position: relative;
        width: 90%;
        max-width: 1200px;
        height: 80vh;
        max-height: 90vh;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .modal-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 28px;
        line-height: 1;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
        font-family: Arial, sans-serif;
      }
      .modal-close:hover {
        background: rgba(0, 0, 0, 0.9);
      }
      .modal-close:active {
        transform: scale(0.95);
      }
      .modal-content iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
      @media (max-width: 768px) {
        .widget-container {
          bottom: 10px;
          left: 10px;
        }
        .video-banner {
          width: 250px;
        }
        .modal-content {
          width: 95%;
          height: 85vh;
        }
      }
    `;
    shadow.appendChild(style);

    // Create widget HTML structure
    const container = document.createElement("div");
    container.className = "widget-container";
    container.innerHTML = `
      <div class="video-banner" role="button" aria-label="Click to view more information" tabindex="0">
        <video autoplay loop muted playsinline preload="auto">
          <source src="${config.videoUrl}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    `;
    shadow.appendChild(container);

    // Track widget loaded event
    trackEvent("widget_loaded", {
      videoUrl: config.videoUrl,
      clickableLink: config.clickableLink,
    });

    // Get video element and banner
    const videoBanner = container.querySelector(".video-banner");
    const video = container.querySelector("video");

    // Track video loaded event
    video.addEventListener(
      "loadeddata",
      () => {
        trackEvent("video_loaded", {
          videoUrl: config.videoUrl,
        });
      },
      { once: true }
    );

    // Handle video errors - only log actual errors
    video.addEventListener("error", () => {
      // Wait a bit to ensure error state is set
      setTimeout(() => {
        const error = video.error;
        // Only log if there's an actual error (null or code 0 means no error)
        if (error && error.code && error.code !== 0) {
          const errorMessages = {
            1: "MEDIA_ERR_ABORTED - Video loading was aborted",
            2: "MEDIA_ERR_NETWORK - Network error while loading video",
            3: "MEDIA_ERR_DECODE - Video decoding error",
            4: "MEDIA_ERR_SRC_NOT_SUPPORTED - Video format not supported",
          };
          const errorMsg =
            errorMessages[error.code] || `Unknown error (code: ${error.code})`;
          console.error("[Widget] Video load error:", errorMsg, {
            code: error.code,
            message: error.message || "No additional details",
            videoUrl: config.videoUrl,
          });
        }
        // If error is null or code is 0, it's just a warning/stub event - ignore it
      }, 100);
    });

    // Click handler for banner
    const handleClick = () => {
      trackEvent("banner_clicked", {
        clickableLink: config.clickableLink,
      });
      openModal(config.clickableLink, shadow);
    };

    videoBanner.addEventListener("click", handleClick);

    // Keyboard accessibility
    videoBanner.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    });
  }

  /**
   * Open modal with iframe overlay
   */
  function openModal(url, shadow) {
    // Check if modal already exists
    if (shadow.querySelector(".modal-overlay")) {
      return;
    }

    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Content overlay");

    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="Close overlay" tabindex="0">×</button>
        <iframe src="${url}" title="Content overlay" allowfullscreen></iframe>
      </div>
    `;

    shadow.appendChild(modal);

    // Close button handler
    const closeBtn = modal.querySelector(".modal-close");
    const closeModal = () => {
      modal.style.animation = "fadeOut 0.2s ease";
      setTimeout(() => {
        modal.remove();
      }, 200);
    };

    closeBtn.addEventListener("click", closeModal);

    // Keyboard accessibility for close button
    closeBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        closeModal();
      }
    });

    // Close on overlay click (outside modal content)
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Focus management
    closeBtn.focus();
  }

  /**
   * Initialize the widget
   * @param {string} targetStoreId - Optional store ID to use (overrides script attribute)
   */
  async function init(targetStoreId) {
    // Wait for DOM to be ready
    const runInit = async () => {
      const config = await fetchWidgetConfig(targetStoreId);
      if (config) {
        renderWidget(config, targetStoreId);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runInit);
    } else {
      await runInit();
    }
  }

  // Expose global functions for manual widget management
  window.VideoBannerWidget = {
    init: init,
    cleanup: cleanupWidget,
    destroy: cleanupWidget,
  };

  // Auto-initialize if storeId is available from script tag
  // This will run only if the script loads with a storeId attribute
  // Manual initialization via window.VideoBannerWidget.init() will override this
  if (storeId) {
    // Delay auto-init slightly to allow manual initialization to take precedence
    setTimeout(() => {
      // Only auto-init if widget doesn't exist (manual init hasn't run)
      if (!document.getElementById(WIDGET_ID)) {
        init();
      }
    }, 50);
  }
})();
