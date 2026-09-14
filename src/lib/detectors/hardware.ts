import type { HardwareInfo, BatteryInfo, StorageInfo } from '../types';

declare global {
  interface Navigator {
    deviceMemory?: number;
    cpuPerformance?: { tier: number };
    getBattery?: () => Promise<{
      charging: boolean;
      level: number;
      chargingTime: number;
      dischargingTime: number;
    }>;
    userAgentData?: {
      platform: string;
      brands: Array<{ brand: string; version: string }>;
      mobile: boolean;
      getHighEntropyValues: (hints: string[]) => Promise<{
        platform: string;
        platformVersion: string;
        architecture: string;
        model: string;
        fullVersionList: Array<{ brand: string; version: string }>;
      }>;
    };
  }
}

async function getBattery(): Promise<BatteryInfo | null> {
  try {
    if (!navigator.getBattery) return null;
    const batt = await navigator.getBattery();
    return {
      charging: batt.charging,
      level: batt.level,
      chargingTime: batt.chargingTime === Infinity ? null : batt.chargingTime,
      dischargingTime: batt.dischargingTime === Infinity ? null : batt.dischargingTime,
    };
  } catch {
    return null;
  }
}

async function getStorage(): Promise<StorageInfo | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    const quota = est.quota ?? 0;
    const usage = est.usage ?? 0;
    return {
      quota,
      usage,
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    };
  } catch {
    return null;
  }
}

function getPlatform(): string {
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform || navigator.platform || 'Unknown';
  }
  return navigator.platform || 'Unknown';
}

export async function detectHardware(): Promise<HardwareInfo> {
  const [battery, storage] = await Promise.all([getBattery(), getStorage()]);

  return {
    cpuCores: navigator.hardwareConcurrency ?? null,
    cpuPerformanceTier: navigator.cpuPerformance?.tier ?? null,
    deviceMemory: navigator.deviceMemory ?? null,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    colorDepth: window.screen.colorDepth,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    platform: getPlatform(),
    userAgent: navigator.userAgent,
    battery,
    storage,
  };
}
