'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { SavedDevice } from '@/src/lib/types';
import { loadDevices, deleteDevice, exportDevices, importDevices } from '@/src/lib/storage';
import DeviceCard from '@/src/components/DeviceCard';

export default function HomePage() {
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setMounted(true);
    setDevices(loadDevices());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Delete this device report?')) {
      deleteDevice(id);
      setDevices(loadDevices());
    }
  };

  const handleExport = () => {
    const json = exportDevices();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `specs-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const added = importDevices(text);
      setDevices(loadDevices());
      alert(`Imported ${added} device(s) successfully.`);
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!mounted) {
    return (
      <div className="page">
        <div className="container">
          <div className="hero">
            <div style={{ width: 60, height: 60, margin: '0 auto' }}>
              <span className="spinner" style={{ width: 40, height: 40 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div className="hero animate-fade-in">
          <h1 className="hero-title">
            <span className="gradient-text">Device Diagnostics</span>
          </h1>
          <p className="hero-subtitle">
            Test your device&apos;s hardware, network, browser capabilities, and performance.
            Compare results across multiple devices.
          </p>
          <div className="hero-actions">
            <Link href="/scan" className="btn btn-primary btn-lg">
              ⚡ Run Full Diagnostic
            </Link>
            {devices.length >= 2 && (
              <Link href="/compare" className="btn btn-secondary btn-lg">
                ⚖️ Compare Devices
              </Link>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {devices.length > 0 && (
          <div className="animate-slide-up" style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            justifyContent: 'center',
            marginBottom: 'var(--space-3xl)',
            flexWrap: 'wrap',
          }}>
            <div className="stat-item" style={{ minWidth: 200 }}>
              <span className="stat-label">Devices Tested</span>
              <span className="stat-value">{devices.length}</span>
            </div>
            <div className="stat-item" style={{ minWidth: 200 }}>
              <span className="stat-label">Last Test</span>
              <span className="stat-value mono" style={{ fontSize: 'var(--text-xs)' }}>
                {new Date(Math.max(...devices.map((d) => d.timestamp))).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {devices.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-xl)',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
          }}>
            <h2 className="section-title" style={{ margin: 0 }}>Saved Devices</h2>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                📤 Export
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📥 Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Device Grid */}
        {devices.length > 0 ? (
          <div className="stat-grid-2">
            {devices
              .sort((a, b) => b.timestamp - a.timestamp)
              .map((device, i) => (
                <div key={device.id} className={`stagger-${Math.min(i + 1, 6)}`}>
                  <DeviceCard device={device} onDelete={handleDelete} />
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-state animate-slide-up">
            <div className="empty-state-icon">🖥️</div>
            <h3 className="empty-state-title">No devices tested yet</h3>
            <p className="empty-state-text">
              Run your first diagnostic to see your device&apos;s capabilities and benchmark scores.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
              <Link href="/scan" className="btn btn-primary">
                ⚡ Start First Scan
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📥 Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
