'use client';

import Link from 'next/link';
import type { SavedDevice } from '@/src/lib/types';
import GaugeChart from './GaugeChart';

interface DeviceCardProps {
  device: SavedDevice;
  onDelete?: (id: string) => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function DeviceCard({ device, onDelete }: DeviceCardProps) {
  const { report } = device;
  const score = report.benchmarks?.overallScore ?? null;

  return (
    <div className="card device-card animate-slide-up">
      {onDelete && (
        <div className="device-card-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(device.id);
            }}
            title="Delete device"
          >
            🗑️
          </button>
        </div>
      )}

      <Link href={`/report/${device.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="card-header">
          <div className="card-icon blue">💻</div>
          <div>
            <div className="card-title">{device.nickname}</div>
            <div className="card-subtitle">{formatDate(device.timestamp)}</div>
          </div>
        </div>

        <div className="device-card-specs">
          <div className="device-card-spec">
            CPU Cores: <span className="device-card-spec-value">{report.hardware.cpuCores ?? 'N/A'}</span>
          </div>
          <div className="device-card-spec">
            RAM: <span className="device-card-spec-value">{report.hardware.deviceMemory ? `${report.hardware.deviceMemory} GB` : 'N/A'}</span>
          </div>
          <div className="device-card-spec">
            Screen: <span className="device-card-spec-value">{report.hardware.screenWidth}×{report.hardware.screenHeight}</span>
          </div>
          <div className="device-card-spec">
            Storage: <span className="device-card-spec-value">{report.hardware.storage ? formatBytes(report.hardware.storage.quota) : 'N/A'}</span>
          </div>
        </div>

        {score !== null && (
          <div className="device-card-score">
            <GaugeChart score={score} size={64} />
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                Overall Score
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 35 ? 'Average' : 'Below Average'}
              </div>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}
