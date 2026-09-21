import type { NetworkInfo } from '../types';

declare global {
  interface Navigator {
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
    };
  }
}

async function measureLatency(): Promise<number | null> {
  try {
    const urls = [window.location.origin + '/favicon.ico'];
    const pings: number[] = [];

    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      await fetch(urls[0], {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors',
      });
      pings.push(performance.now() - start);
    }
    // Take the median
    pings.sort((a, b) => a - b);
    return Math.round(pings[Math.floor(pings.length / 2)]);
  } catch {
    return null;
  }
}

async function measureDownloadSpeed(): Promise<number | null> {
  try {
    // Download a ~1MB random file. We generate a data URL on the server
    // or use a known endpoint. For self-hosted, we'll use the app's
    // own static assets. Fallback: generate a blob from a script.
    const url = '/api/speed-test-download';

    const start = performance.now();
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const elapsed = (performance.now() - start) / 1000; // seconds
    const bits = blob.size * 8;
    const mbps = bits / elapsed / 1_000_000;
    return Math.round(mbps * 100) / 100;
  } catch {
    // Fallback: use navigator.connection downlink if available
    return navigator.connection?.downlink ?? null;
  }
}

async function measureUploadSpeed(): Promise<number | null> {
  try {
    const testSize = 512 * 1024; // 512 KB
    const blob = new Blob([new ArrayBuffer(testSize)]);

    const start = performance.now();
    const response = await fetch('/api/speed-test-upload', {
      method: 'POST',
      body: blob,
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const elapsed = (performance.now() - start) / 1000;
    const bits = testSize * 8;
    const mbps = bits / elapsed / 1_000_000;
    return Math.round(mbps * 100) / 100;
  } catch {
    return null;
  }
}

export async function detectNetwork(): Promise<NetworkInfo> {
  const conn = navigator.connection;

  return {
    effectiveType: conn?.effectiveType ?? null,
    downlink: conn?.downlink ?? null,
    rtt: conn?.rtt ?? null,
    saveData: conn?.saveData ?? null,
    downloadSpeed: await measureDownloadSpeed(),
    uploadSpeed: await measureUploadSpeed(),
    latency: await measureLatency(),
    online: navigator.onLine,
  };
}
