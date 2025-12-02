/**
 * Central configuration for API endpoints
 * Uses environment variables with fallback to production URL
 */

// Backend API URL - defaults to production Render URL
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  "https://learnrepo.onrender.com";

// Socket.IO URL - defaults to production Render URL
export const SOCKET_URL = 
  process.env.NEXT_PUBLIC_SOCKET_URL || 
  "https://learnrepo.onrender.com";

// Widget script URL - derived from API URL
export const WIDGET_SCRIPT_URL = `${API_URL}/widget/video-banner-widget.js`;

