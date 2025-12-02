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
   * Detect video format from URL extension
   */
  function getVideoType(videoUrl) {
    const urlLower = videoUrl.toLowerCase();
    if (urlLower.endsWith(".mp4")) return "video/mp4";
    if (urlLower.endsWith(".webm")) return "video/webm";
    if (urlLower.endsWith(".ogg") || urlLower.endsWith(".ogv"))
      return "video/ogg";
    if (urlLower.endsWith(".mov")) return "video/quicktime";
    // Default to mp4 if format cannot be determined
    return "video/mp4";
  }

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
          // Properly clean up video element
          video.pause();
          // Remove all source elements
          const sources = video.querySelectorAll("source");
          sources.forEach((source) => source.remove());
          // Clear both src property and attribute
          video.src = "";
          video.removeAttribute("src");
          // Remove all event listeners by cloning (if needed)
          // Reset video element state
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
  async function renderWidget(config, targetStoreId) {
    // Always cleanup existing widget first to ensure fresh render
    cleanupWidget();

    // Small delay to ensure cleanup completes and DOM is ready
    // This is especially important when navigating back to the page
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create widget container
    const widgetContainer2 = document.createElement("div");
    widgetContainer2.id = WIDGET_ID;
    widgetContainer2.setAttribute(
      "data-store-id",
      targetStoreId || storeId || ""
    );
    document.body.appendChild(widgetContainer2);

    // Use Shadow DOM for style isolation
    const shadow = widgetContainer2.attachShadow({ mode: "open" });

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
      .modal-content video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
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

    // Validate video URL
    if (
      !config.videoUrl ||
      typeof config.videoUrl !== "string" ||
      config.videoUrl.trim() === ""
    ) {
      console.error("[Widget] Invalid video URL:", config.videoUrl);
      return;
    }

    // Inject styles (moved here to ensure shadow is created first)
    const style2 = document.createElement("style");
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
      .modal-content video {
        width: 100%;
        height: 100%;
        object-fit: contain;
        background: #000;
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
    shadow.appendChild(style2);

    // Create widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "widget-container";

    const videoBanner = document.createElement("div");
    videoBanner.className = "video-banner";
    videoBanner.setAttribute("role", "button");
    videoBanner.setAttribute("aria-label", "Click to view more information");
    videoBanner.setAttribute("tabindex", "0");

    // Create video element programmatically to ensure clean state
    const video = document.createElement("video");
    video.setAttribute("autoplay", "true");
    video.setAttribute("loop", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "auto");

    // Create and append source element
    const source = document.createElement("source");

    // Use setAttribute to ensure it's properly set
    source.setAttribute("src", config.videoUrl);
    source.setAttribute("type", getVideoType(config.videoUrl));
    video.appendChild(source);

    // Verify source was set correctly
    if (
      !source.getAttribute("src") ||
      source.getAttribute("src") !== config.videoUrl
    ) {
      console.error(
        "[Widget] Failed to set source src attribute:",
        config.videoUrl
      );
      return;
    }

    videoBanner.appendChild(video);
    widgetContainer.appendChild(videoBanner);
    shadow.appendChild(widgetContainer);

    // Track if video has started playing
    let videoStarted = false;

    // Function to start video playback
    const startVideo = () => {
      if (videoStarted || video.readyState < 2) return; // Already started or not ready
      video
        .play()
        .then(() => {
          videoStarted = true;
        })
        .catch(() => {
          // Ignore autoplay errors - video will play on next user interaction
        });
    };

    // Ensure video loads after being added to DOM
    setTimeout(() => {
      // Double-check source is still set before loading
      const currentSource = video.querySelector("source");
      if (currentSource && currentSource.getAttribute("src")) {
        video.load();

        // Try to play immediately (may be blocked by autoplay policy)
        video
          .play()
          .then(() => {
            videoStarted = true;
          })
          .catch((err) => {
            // Autoplay was prevented - this is normal browser behavior
            // Check if it's specifically an autoplay policy error
            const isAutoplayError =
              err.name === "NotAllowedError" ||
              err.message?.includes("user didn't interact") ||
              err.message?.includes("autoplay");

            if (!isAutoplayError) {
              // Only log if it's not an autoplay prevention error
              console.warn(
                "[Widget] Banner video play error:",
                err.message || err
              );
            }

            // Add one-time click handler to start video on first user interaction
            const startOnInteraction = () => {
              startVideo();
              // Remove listeners after first interaction
              document.removeEventListener("click", startOnInteraction, true);
              document.removeEventListener(
                "touchstart",
                startOnInteraction,
                true
              );
            };

            // Listen for first user interaction anywhere on the page
            document.addEventListener("click", startOnInteraction, {
              once: true,
              capture: true,
            });
            document.addEventListener("touchstart", startOnInteraction, {
              once: true,
              capture: true,
            });
          });
      } else {
        console.error(
          "[Widget] Source lost before load, re-setting:",
          config.videoUrl
        );
        // Re-set the source if it was lost
        if (currentSource) {
          currentSource.setAttribute("src", config.videoUrl);
          video.load();
        }
      }
    }, 100);

    // Track widget loaded event
    trackEvent("widget_loaded", {
      videoUrl: config.videoUrl,
      clickableLink: config.clickableLink,
    });

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
        videoUrl: config.videoUrl,
      });
      // Open modal with the video URL (not the clickable link page)
      openModal(config.videoUrl, shadow);
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
   * Open modal with video player
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
    modal.setAttribute("aria-label", "Video player");

    // Create modal content
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "Close video player");
    closeBtn.setAttribute("tabindex", "0");
    closeBtn.textContent = "×";

    // Create video element
    const video = document.createElement("video");
    video.setAttribute("controls", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "auto");
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "contain";
    video.style.background = "#000";

    // Create source element for the video
    const source = document.createElement("source");
    source.setAttribute("src", url);
    source.setAttribute("type", getVideoType(url));
    video.appendChild(source);

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(video);
    modal.appendChild(modalContent);
    shadow.appendChild(modal);

    // Add error handler for better debugging (before loading)
    const errorHandler = () => {
      setTimeout(() => {
        const error = video.error;
        if (error && error.code && error.code !== 0) {
          console.error("[Widget] Video playback error:", {
            code: error.code,
            message: error.message,
            videoUrl: url,
            videoType: getVideoType(url),
            currentSrc: video.currentSrc || video.src,
          });
        }
      }, 100);
    };
    video.addEventListener("error", errorHandler, { once: true });

    // Load and play the video after a small delay to ensure DOM is ready
    setTimeout(() => {
      // Verify source is still set
      const currentSource = video.querySelector("source");
      if (currentSource && currentSource.getAttribute("src")) {
        video.load();
        video.play().catch((err) => {
          // Only log if it's not just an autoplay prevention
          if (!err.message.includes("play() request was interrupted")) {
            console.warn("[Widget] Video play error:", err.message || err);
          }
        });
      } else {
        console.error("[Widget] Source element lost before load");
      }
    }, 50);

    // Close button handler
    const closeModal = () => {
      // Pause and cleanup video
      try {
        video.pause();
        // Remove error handler to prevent errors during cleanup
        video.removeEventListener("error", errorHandler);
        // Clear sources first
        const sources = video.querySelectorAll("source");
        sources.forEach((source) => source.remove());
        // Then clear src
        video.removeAttribute("src");
        video.src = "";
        // Reset video element
        video.load();
      } catch {
        // Ignore cleanup errors
      }

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
        await renderWidget(config, targetStoreId);
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
