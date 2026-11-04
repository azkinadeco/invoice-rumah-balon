'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js so the app shell keeps opening without internet.
 * Production only: in dev the worker would cache hot-reload assets.
 * Browsers only allow service workers on HTTPS or localhost.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => console.warn('Service worker registration failed:', err));
  }, []);

  return null;
}
