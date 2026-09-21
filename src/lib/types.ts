// ─── Hardware ────────────────────────────────────────────────────────
export interface BatteryInfo {
  charging: boolean;
  level: number; // 0–1
  chargingTime: number | null;
  dischargingTime: number | null;
}

export interface StorageInfo {
  quota: number; // bytes
  usage: number; // bytes
  percent: number; // 0–100
}

export interface HardwareInfo {
  cpuCores: number | null;
  cpuPerformanceTier: number | null;
  deviceMemory: number | null; // GB
  deviceMemoryManual?: boolean; // true when entered by the user instead of detected
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  colorDepth: number;
  maxTouchPoints: number;
  platform: string;
  userAgent: string;
  battery: BatteryInfo | null;
  storage: StorageInfo | null;
}

// ─── Network ─────────────────────────────────────────────────────────
export interface NetworkInfo {
  effectiveType: string | null; // '4g', '3g', etc.
  downlink: number | null; // Mbps estimate
  rtt: number | null; // ms estimate
  saveData: boolean | null;
  downloadSpeed: number | null; // Mbps measured
  uploadSpeed: number | null; // Mbps measured
  latency: number | null; // ms measured
  online: boolean;
}

// ─── Browser Capabilities ────────────────────────────────────────────
export interface BrowserCapability {
  supported: boolean;
  detail?: string;
}

export interface BrowserCapabilities {
  webGPU: BrowserCapability;
  webGL2: BrowserCapability;
  webRTC: BrowserCapability;
  serviceWorker: BrowserCapability;
  webAssembly: BrowserCapability;
  sharedArrayBuffer: BrowserCapability;
  webBluetooth: BrowserCapability;
  webUSB: BrowserCapability;
  webSerial: BrowserCapability;
  webNFC: BrowserCapability;
  webSocket: BrowserCapability;
  notifications: BrowserCapability;
  clipboard: BrowserCapability;
  pdfViewer: BrowserCapability;
  cookiesEnabled: BrowserCapability;
  codecs: {
    h264: boolean;
    vp9: boolean;
    av1: boolean;
    hevc: boolean;
    opus: boolean;
    aac: boolean;
  };
}

// ─── Performance Benchmarks ──────────────────────────────────────────
export interface BenchmarkResult {
  name: string;
  score: number; // 0–100 normalised
  rawValue: number;
  unit: string;
  duration: number; // ms
}

export interface BenchmarkResults {
  cpuSingleCore: BenchmarkResult;
  cpuMultiCore: BenchmarkResult;
  memoryThroughput: BenchmarkResult;
  gpuRender: BenchmarkResult;
  domPerformance: BenchmarkResult;
  jsEngine: BenchmarkResult;
  overallScore: number; // 0–100 weighted average
}

// ─── Sensor Access ───────────────────────────────────────────────────
export type SensorStatus = 'available' | 'unavailable' | 'denied' | 'untested';

export interface SensorInfo {
  accelerometer: SensorStatus;
  gyroscope: SensorStatus;
  magnetometer: SensorStatus;
  ambientLight: SensorStatus;
  geolocation: SensorStatus;
  camera: SensorStatus;
  microphone: SensorStatus;
  speakers: SensorStatus;
  cameraDevices: number;
  micDevices: number;
  speakerDevices: number;
}

// ─── Aggregated Report ───────────────────────────────────────────────
export interface DeviceReport {
  hardware: HardwareInfo;
  network: NetworkInfo;
  browser: BrowserCapabilities;
  benchmarks: BenchmarkResults | null;
  sensors: SensorInfo;
}

export interface SavedDevice {
  id: string;
  nickname: string;
  timestamp: number; // Date.now()
  report: DeviceReport;
}

/** navigator.deviceMemory is rounded and capped at 8 by browsers, so 8 means "8 GB or more". */
export function formatRam(gb: number | null | undefined, manual = false): string {
  if (!gb) return 'N/A';
  return gb >= 8 && !manual ? '8+ GB' : `${gb} GB`;
}
