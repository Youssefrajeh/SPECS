'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { SavedDevice } from '@/src/lib/types';
import { loadDevices } from '@/src/lib/storage';
import RadarChart from '@/src/components/RadarChart';

const CHART_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#f472b6', '#34d399', '#a855f7'];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

interface CompareRow {
  label: string;
  values: (string | number | null)[];
  type?: 'higher-better' | 'lower-better' | 'neutral';
}

function getCompareData(devices: SavedDevice[]): CompareRow[] {
  return [
    {
      label: 'CPU Cores',
      values: devices.map((d) => d.report.hardware.cpuCores),
      type: 'higher-better',
    },
    {
      label: 'RAM (GB)',
      values: devices.map((d) => d.report.hardware.deviceMemory),
      type: 'higher-better',
    },
    {
      label: 'Screen',
      values: devices.map((d) => `${d.report.hardware.screenWidth}×${d.report.hardware.screenHeight}`),
      type: 'neutral',
    },
    {
      label: 'Pixel Ratio',
      values: devices.map((d) => d.report.hardware.devicePixelRatio),
      type: 'higher-better',
    },
    {
      label: 'Touch Points',
      values: devices.map((d) => d.report.hardware.maxTouchPoints),
      type: 'neutral',
    },
    {
      label: 'Storage',
      values: devices.map((d) => d.report.hardware.storage ? formatBytes(d.report.hardware.storage.quota) : 'N/A'),
      type: 'neutral',
    },
    {
      label: 'Connection',
      values: devices.map((d) => d.report.network.effectiveType?.toUpperCase() ?? 'N/A'),
      type: 'neutral',
    },
    {
      label: 'Download (Mbps)',
      values: devices.map((d) => d.report.network.downloadSpeed ?? d.report.network.downlink ?? null),
      type: 'higher-better',
    },
    {
      label: 'Latency (ms)',
      values: devices.map((d) => d.report.network.latency ?? d.report.network.rtt ?? null),
      type: 'lower-better',
    },
    {
      label: 'Overall Score',
      values: devices.map((d) => d.report.benchmarks?.overallScore ?? null),
      type: 'higher-better',
    },
    {
      label: 'CPU Single',
      values: devices.map((d) => d.report.benchmarks?.cpuSingleCore.score ?? null),
      type: 'higher-better',
    },
    {
      label: 'CPU Multi',
      values: devices.map((d) => d.report.benchmarks?.cpuMultiCore.score ?? null),
      type: 'higher-better',
    },
    {
      label: 'Memory',
      values: devices.map((d) => d.report.benchmarks?.memoryThroughput.score ?? null),
      type: 'higher-better',
    },
    {
      label: 'GPU',
      values: devices.map((d) => d.report.benchmarks?.gpuRender.score ?? null),
      type: 'higher-better',
    },
    {
      label: 'DOM',
      values: devices.map((d) => d.report.benchmarks?.domPerformance.score ?? null),
      type: 'higher-better',
    },
    {
      label: 'JS Engine',
      values: devices.map((d) => d.report.benchmarks?.jsEngine.score ?? null),
      type: 'higher-better',
    },
  ];
}

function getBestWorst(values: (string | number | null)[], type?: string): { best: number; worst: number } {
  const numericValues = values.map((v, i) => ({ val: typeof v === 'number' ? v : null, idx: i })).filter((x) => x.val !== null);
  if (numericValues.length < 2) return { best: -1, worst: -1 };

  let best = numericValues[0];
  let worst = numericValues[0];

  for (const item of numericValues) {
    if (type === 'higher-better') {
      if (item.val! > best.val!) best = item;
      if (item.val! < worst.val!) worst = item;
    } else if (type === 'lower-better') {
      if (item.val! < best.val!) best = item;
      if (item.val! > worst.val!) worst = item;
    }
  }

  if (best.val === worst.val) return { best: -1, worst: -1 };
  return { best: best.idx, worst: worst.idx };
}

export default function ComparePage() {
  const [allDevices, setAllDevices] = useState<SavedDevice[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const devices = loadDevices();
    setAllDevices(devices);
    // Auto-select first 2
    if (devices.length >= 2) {
      setSelectedIds(new Set(devices.slice(0, 2).map((d) => d.id)));
    }
  }, []);

  const toggleDevice = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  };

  const selectedDevices = allDevices.filter((d) => selectedIds.has(d.id));
  const compareData = selectedDevices.length >= 2 ? getCompareData(selectedDevices) : [];

  const radarLabels = ['CPU Single', 'CPU Multi', 'Memory', 'GPU', 'DOM', 'JS Engine'];
  const radarDatasets = selectedDevices.map((d, i) => ({
    label: d.nickname,
    values: [
      d.report.benchmarks?.cpuSingleCore.score ?? 0,
      d.report.benchmarks?.cpuMultiCore.score ?? 0,
      d.report.benchmarks?.memoryThroughput.score ?? 0,
      d.report.benchmarks?.gpuRender.score ?? 0,
      d.report.benchmarks?.domPerformance.score ?? 0,
      d.report.benchmarks?.jsEngine.score ?? 0,
    ],
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (!mounted) {
    return (
      <div className="page">
        <div className="container"><div className="spinner" style={{ margin: '100px auto' }} /></div>
      </div>
    );
  }

  if (allDevices.length < 2) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">⚖️</div>
            <h3 className="empty-state-title">Not enough devices</h3>
            <p className="empty-state-text">
              You need at least 2 saved device reports to use the comparison tool.
              Currently you have {allDevices.length}.
            </p>
            <Link href="/scan" className="btn btn-primary">⚡ Run a Scan</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
          <h1 className="section-title">
            <span className="gradient-text">Compare Devices</span>
          </h1>
          <p className="section-subtitle">
            Select 2–4 devices to compare side by side.
          </p>
        </div>

        {/* Device Picker */}
        <div className="animate-slide-up" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
            {allDevices.map((device) => (
              <label key={device.id} className={`checkbox-card ${selectedIds.has(device.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(device.id)}
                  onChange={() => toggleDevice(device.id)}
                  disabled={!selectedIds.has(device.id) && selectedIds.size >= 4}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{device.nickname}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Score: {device.report.benchmarks?.overallScore ?? 'N/A'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {selectedDevices.length >= 2 && (
          <>
            {/* Radar Chart */}
            {radarDatasets.some((ds) => ds.values.some((v) => v > 0)) && (
              <div className="card animate-slide-up" style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'center' }}>
                <RadarChart labels={radarLabels} datasets={radarDatasets} size={340} />
              </div>
            )}

            {/* Comparison Table */}
            <div className="animate-slide-up" style={{ overflowX: 'auto' }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    {selectedDevices.map((d, i) => (
                      <th key={d.id} style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                        {d.nickname}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareData.map((row) => {
                    const { best, worst } = getBestWorst(row.values, row.type);
                    return (
                      <tr key={row.label}>
                        <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {row.label}
                        </td>
                        {row.values.map((val, i) => (
                          <td
                            key={i}
                            className={i === best ? 'best' : i === worst ? 'worst' : ''}
                          >
                            {val ?? 'N/A'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
