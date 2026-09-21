import type { SavedDevice, DeviceReport } from './types';
import { formatRam } from './types';

const STORAGE_KEY = 'specs_devices';

function generateId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function generateNickname(report: DeviceReport): string {
  const platform = report.hardware.platform || 'Unknown';
  const cores = report.hardware.cpuCores ? `${report.hardware.cpuCores}-core` : '';
  const ram = report.hardware.deviceMemory ? formatRam(report.hardware.deviceMemory, report.hardware.deviceMemoryManual).replace(' ', '') : '';
  const parts = [platform, cores, ram].filter(Boolean);
  return parts.join(' • ') || 'Unknown Device';
}

export function loadDevices(): SavedDevice[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedDevice[];
  } catch {
    return [];
  }
}

export function saveDevice(report: DeviceReport, nickname?: string): SavedDevice {
  const devices = loadDevices();
  const device: SavedDevice = {
    id: generateId(),
    nickname: nickname || generateNickname(report),
    timestamp: Date.now(),
    report,
  };
  devices.push(device);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  return device;
}

export function deleteDevice(id: string): void {
  const devices = loadDevices().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

export function updateDeviceNickname(id: string, nickname: string): void {
  const devices = loadDevices();
  const device = devices.find((d) => d.id === id);
  if (device) {
    device.nickname = nickname;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  }
}

export function getDevice(id: string): SavedDevice | null {
  return loadDevices().find((d) => d.id === id) ?? null;
}

export function exportDevices(): string {
  const devices = loadDevices();
  return JSON.stringify(devices, null, 2);
}

export function importDevices(json: string): number {
  try {
    const incoming = JSON.parse(json) as SavedDevice[];
    if (!Array.isArray(incoming)) throw new Error('Invalid format');

    const existing = loadDevices();
    const existingIds = new Set(existing.map((d) => d.id));
    let added = 0;

    for (const device of incoming) {
      if (device.id && device.report && !existingIds.has(device.id)) {
        existing.push(device);
        existingIds.add(device.id);
        added++;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return added;
  } catch {
    throw new Error('Failed to import: invalid JSON format');
  }
}

export function clearAllDevices(): void {
  localStorage.removeItem(STORAGE_KEY);
}
