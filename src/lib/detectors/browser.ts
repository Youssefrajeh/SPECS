import type { BrowserCapabilities, BrowserCapability } from '../types';

function check(condition: boolean, detail?: string): BrowserCapability {
  return { supported: condition, detail };
}

function checkCodec(mimeType: string): boolean {
  if (typeof MediaRecorder === 'undefined') return false;
  try {
    return MediaRecorder.isTypeSupported(mimeType);
  } catch {
    return false;
  }
}

function getWebGLRenderer(): string | null {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return null;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    return gl.getParameter(gl.RENDERER);
  } catch {
    return null;
  }
}

export async function detectBrowser(): Promise<BrowserCapabilities> {
  const gpuRenderer = getWebGLRenderer();

  let webgpuDetail = 'Not supported';
  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as unknown as { gpu: { requestAdapter: () => Promise<{ name: string } | null> } }).gpu.requestAdapter();
      webgpuDetail = adapter ? `Supported (${adapter.name})` : 'Adapter unavailable';
    } catch {
      webgpuDetail = 'Error requesting adapter';
    }
  }

  return {
    webGPU: check('gpu' in navigator, webgpuDetail),
    webGL2: check(
      (() => {
        try {
          return !!document.createElement('canvas').getContext('webgl2');
        } catch {
          return false;
        }
      })(),
      gpuRenderer ?? undefined
    ),
    webRTC: check('RTCPeerConnection' in window),
    serviceWorker: check('serviceWorker' in navigator),
    webAssembly: check('WebAssembly' in window),
    sharedArrayBuffer: check(typeof SharedArrayBuffer !== 'undefined'),
    webBluetooth: check('bluetooth' in navigator),
    webUSB: check('usb' in navigator),
    webSerial: check('serial' in navigator),
    webNFC: check('NDEFReader' in window),
    webSocket: check('WebSocket' in window),
    notifications: check('Notification' in window),
    clipboard: check('clipboard' in navigator),
    pdfViewer: check(
      'pdfViewerEnabled' in navigator
        ? (navigator as unknown as { pdfViewerEnabled: boolean }).pdfViewerEnabled
        : false
    ),
    cookiesEnabled: check(navigator.cookieEnabled),
    codecs: {
      h264: checkCodec('video/webm; codecs=avc1') || checkCodec('video/mp4; codecs=avc1'),
      vp9: checkCodec('video/webm; codecs=vp9'),
      av1: checkCodec('video/webm; codecs=av01'),
      hevc: checkCodec('video/mp4; codecs=hevc') || checkCodec('video/mp4; codecs=hvc1'),
      opus: checkCodec('audio/webm; codecs=opus'),
      aac: checkCodec('audio/mp4; codecs=mp4a.40.2'),
    },
  };
}
