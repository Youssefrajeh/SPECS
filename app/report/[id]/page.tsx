'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SavedDevice } from '@/src/lib/types';
import { formatRam } from '@/src/lib/types';
import { getDevice, deleteDevice } from '@/src/lib/storage';
import GaugeChart from '@/src/components/GaugeChart';
import CapabilityBadge from '@/src/components/CapabilityBadge';
import SensorTester from '@/src/components/SensorTester';

type TabKey = 'hardware' | 'network' | 'browser' | 'performance' | 'sensors';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'hardware', label: 'Hardware' },
  { key: 'network', label: 'Network' },
  { key: 'browser', label: 'Browser' },
  { key: 'performance', label: 'Performance' },
  { key: 'sensors', label: 'Sensors' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [device, setDevice] = useState<SavedDevice | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('hardware');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setMounted(true);
    const id = params.id as string;
    const d = getDevice(id);
    setDevice(d);
  }, [params.id]);

  if (!mounted) {
    return (
      <div className="page">
        <div className="container"><div className="spinner" style={{ margin: '100px auto' }} /></div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3 className="empty-state-title">Device Not Found</h3>
            <p className="empty-state-text">This device report doesn&apos;t exist or has been deleted.</p>
            <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const { report } = device;

  const handleDelete = () => {
    if (confirm('Delete this device report?')) {
      deleteDevice(device.id);
      router.push('/');
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Header */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <Link href="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-sm)', display: 'block' }}>
                ← Back to Dashboard
              </Link>
              <h1 className="section-title" style={{ margin: 0 }}>
                {device.nickname}
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-xs)' }}>
                {formatDate(device.timestamp)}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              {report.benchmarks && (
                <GaugeChart score={report.benchmarks.overallScore} size={80} label="Score" />
              )}
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'hardware' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Hardware Information</div>
                  <div className="card-subtitle">CPU, memory, display, battery, and storage</div>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-item"><span className="stat-label">CPU Cores</span><span className="stat-value">{report.hardware.cpuCores ?? 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">CPU Tier</span><span className="stat-value">{report.hardware.cpuPerformanceTier ?? 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">Device Memory</span><span className="stat-value">{formatRam(report.hardware.deviceMemory, report.hardware.deviceMemoryManual)}</span></div>
                <div className="stat-item"><span className="stat-label">Screen Resolution</span><span className="stat-value">{report.hardware.screenWidth}×{report.hardware.screenHeight}</span></div>
                <div className="stat-item"><span className="stat-label">Device Pixel Ratio</span><span className="stat-value">{report.hardware.devicePixelRatio}x</span></div>
                <div className="stat-item"><span className="stat-label">Color Depth</span><span className="stat-value">{report.hardware.colorDepth}-bit</span></div>
                <div className="stat-item"><span className="stat-label">Max Touch Points</span><span className="stat-value">{report.hardware.maxTouchPoints}</span></div>
                <div className="stat-item"><span className="stat-label">Platform</span><span className="stat-value mono">{report.hardware.platform}</span></div>
                {report.hardware.battery && (
                  <>
                    <div className="stat-item"><span className="stat-label">Battery Level</span><span className="stat-value">{Math.round(report.hardware.battery.level * 100)}%</span></div>
                    <div className="stat-item"><span className="stat-label">Charging</span><span className="stat-value">{report.hardware.battery.charging ? 'Yes' : 'No'}</span></div>
                  </>
                )}
                {report.hardware.storage && (
                  <>
                    <div className="stat-item"><span className="stat-label">Storage Quota</span><span className="stat-value">{formatBytes(report.hardware.storage.quota)}</span></div>
                    <div className="stat-item"><span className="stat-label">Storage Used</span><span className="stat-value">{formatBytes(report.hardware.storage.usage)} ({report.hardware.storage.percent}%)</span></div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div className="stat-label" style={{ marginBottom: 4 }}>User Agent</div>
                <code style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {report.hardware.userAgent}
                </code>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Network Analysis</div>
                  <div className="card-subtitle">Connection type, speed, and latency</div>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-item"><span className="stat-label">Online</span><span className={`badge ${report.network.online ? 'supported' : 'unsupported'}`}>{report.network.online ? 'Yes' : 'No'}</span></div>
                <div className="stat-item"><span className="stat-label">Connection Type</span><span className="stat-value">{report.network.effectiveType?.toUpperCase() ?? 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">Download Speed</span><span className="stat-value">{report.network.downloadSpeed ? `${report.network.downloadSpeed} Mbps` : report.network.downlink ? `~${report.network.downlink} Mbps` : 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">Upload Speed</span><span className="stat-value">{report.network.uploadSpeed ? `${report.network.uploadSpeed} Mbps` : 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">Latency</span><span className="stat-value">{report.network.latency ? `${report.network.latency} ms` : report.network.rtt ? `~${report.network.rtt} ms` : 'N/A'}</span></div>
                <div className="stat-item"><span className="stat-label">Data Saver</span><span className="stat-value">{report.network.saveData === null ? 'N/A' : report.network.saveData ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          )}

          {activeTab === 'browser' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Browser Capabilities</div>
                  <div className="card-subtitle">APIs, features, and codec support</div>
                </div>
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Web APIs</h3>
              <div className="stat-grid" style={{ marginBottom: 'var(--space-xl)' }}>
                <CapabilityBadge label="WebGPU" supported={report.browser.webGPU.supported} detail={report.browser.webGPU.detail} />
                <CapabilityBadge label="WebGL 2" supported={report.browser.webGL2.supported} detail={report.browser.webGL2.detail} />
                <CapabilityBadge label="WebRTC" supported={report.browser.webRTC.supported} />
                <CapabilityBadge label="WebAssembly" supported={report.browser.webAssembly.supported} />
                <CapabilityBadge label="Service Worker" supported={report.browser.serviceWorker.supported} />
                <CapabilityBadge label="SharedArrayBuffer" supported={report.browser.sharedArrayBuffer.supported} />
                <CapabilityBadge label="Web Bluetooth" supported={report.browser.webBluetooth.supported} />
                <CapabilityBadge label="Web USB" supported={report.browser.webUSB.supported} />
                <CapabilityBadge label="Web Serial" supported={report.browser.webSerial.supported} />
                <CapabilityBadge label="Web NFC" supported={report.browser.webNFC.supported} />
                <CapabilityBadge label="WebSocket" supported={report.browser.webSocket.supported} />
                <CapabilityBadge label="Notifications" supported={report.browser.notifications.supported} />
                <CapabilityBadge label="Clipboard" supported={report.browser.clipboard.supported} />
                <CapabilityBadge label="PDF Viewer" supported={report.browser.pdfViewer.supported} />
                <CapabilityBadge label="Cookies" supported={report.browser.cookiesEnabled.supported} />
              </div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--text-secondary)' }}>Codec Support</h3>
              <div className="stat-grid">
                <CapabilityBadge label="H.264 (AVC)" supported={report.browser.codecs.h264} />
                <CapabilityBadge label="VP9" supported={report.browser.codecs.vp9} />
                <CapabilityBadge label="AV1" supported={report.browser.codecs.av1} />
                <CapabilityBadge label="HEVC (H.265)" supported={report.browser.codecs.hevc} />
                <CapabilityBadge label="Opus" supported={report.browser.codecs.opus} />
                <CapabilityBadge label="AAC" supported={report.browser.codecs.aac} />
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Performance Benchmarks</div>
                  <div className="card-subtitle">CPU, GPU, memory, and JS engine scoring</div>
                </div>
              </div>
              {report.benchmarks ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-xl)' }}>
                    <GaugeChart score={report.benchmarks.overallScore} size={140} label="Overall" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {[
                      report.benchmarks.cpuSingleCore,
                      report.benchmarks.cpuMultiCore,
                      report.benchmarks.memoryThroughput,
                      report.benchmarks.gpuRender,
                      report.benchmarks.domPerformance,
                      report.benchmarks.jsEngine,
                    ].map((b) => (
                      <div key={b.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>{b.name}</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{b.rawValue} {b.unit}</span>
                            <span style={{ fontWeight: 700, color: b.score >= 70 ? 'var(--accent-green)' : b.score >= 40 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                              {b.score}/100
                            </span>
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: 10 }}>
                          <div
                            className={`progress-bar-fill ${b.score >= 70 ? 'green' : b.score >= 40 ? '' : 'warm'}`}
                            style={{ width: `${b.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
                  <p className="empty-state-text">No benchmark data available for this device.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sensors' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Sensor Access</div>
                  <div className="card-subtitle">Motion, location, camera, and audio devices</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <SensorTester name="Accelerometer" status={report.sensors.accelerometer} />
                <SensorTester name="Gyroscope" status={report.sensors.gyroscope} />
                <SensorTester name="Magnetometer" status={report.sensors.magnetometer} />
                <SensorTester name="Ambient Light" status={report.sensors.ambientLight} />
                <SensorTester name="Geolocation" status={report.sensors.geolocation} />
                <SensorTester name="Camera" status={report.sensors.camera} count={report.sensors.cameraDevices} />
                <SensorTester name="Microphone" status={report.sensors.microphone} count={report.sensors.micDevices} />
                <SensorTester name="Speakers" status={report.sensors.speakers} count={report.sensors.speakerDevices} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
