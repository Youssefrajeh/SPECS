'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { DeviceReport, HardwareInfo, NetworkInfo, BrowserCapabilities, BenchmarkResults, SensorInfo } from '@/src/lib/types';
import { formatRam } from '@/src/lib/types';
import { detectHardware } from '@/src/lib/detectors/hardware';
import { detectNetwork } from '@/src/lib/detectors/network';
import { detectBrowser } from '@/src/lib/detectors/browser';
import { runBenchmarks } from '@/src/lib/detectors/performance';
import { detectSensors } from '@/src/lib/detectors/sensors';
import { saveDevice } from '@/src/lib/storage';
import ProgressRing from '@/src/components/ProgressRing';
import GaugeChart from '@/src/components/GaugeChart';
import CapabilityBadge from '@/src/components/CapabilityBadge';
import SensorTester from '@/src/components/SensorTester';

const RAM_KEY = 'specs_manual_ram_gb';

type ScanPhase = 'idle' | 'hardware' | 'network' | 'browser' | 'performance' | 'sensors' | 'complete';

const PHASES: { key: ScanPhase; label: string }[] = [
  { key: 'hardware', label: 'Hardware Detection' },
  { key: 'network', label: 'Network Analysis' },
  { key: 'browser', label: 'Browser Capabilities' },
  { key: 'performance', label: 'Performance Benchmarks' },
  { key: 'sensors', label: 'Sensor Access' },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ScanPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [benchmarkStep, setBenchmarkStep] = useState('');

  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [browser, setBrowser] = useState<BrowserCapabilities | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResults | null>(null);
  const [sensors, setSensors] = useState<SensorInfo | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');

  const phaseIndex = (p: ScanPhase) => PHASES.findIndex((ph) => ph.key === p);
  const currentIndex = phase === 'idle' ? -1 : phase === 'complete' ? PHASES.length : phaseIndex(phase);

  const runScan = useCallback(async () => {
    setPhase('hardware');
    setProgress(0);

    // 1. Hardware
    const hw = await detectHardware();
    try {
      const saved = Number(localStorage.getItem(RAM_KEY));
      if (saved > 0) {
        hw.deviceMemory = saved;
        hw.deviceMemoryManual = true;
      }
    } catch {}
    setHardware(hw);
    setProgress(20);

    // 2. Network
    setPhase('network');
    const net = await detectNetwork();
    setNetwork(net);
    setProgress(40);

    // 3. Browser
    setPhase('browser');
    const br = await detectBrowser();
    setBrowser(br);
    setProgress(60);

    // 4. Performance
    setPhase('performance');
    const bench = await runBenchmarks((step, total, name) => {
      setBenchmarkStep(name);
      setProgress(60 + (step / total) * 25);
    });
    setBenchmarks(bench);
    setProgress(85);

    // 5. Sensors
    setPhase('sensors');
    const sen = await detectSensors();
    setSensors(sen);
    setProgress(100);

    setPhase('complete');
  }, []);

  const handleSave = () => {
    if (!hardware || !network || !browser || !sensors) return;
    const report: DeviceReport = {
      hardware,
      network,
      browser,
      benchmarks,
      sensors,
    };
    const device = saveDevice(report, nickname || undefined);
    setSavedId(device.id);
  };

  const getStepStatus = (key: ScanPhase) => {
    const idx = phaseIndex(key);
    if (currentIndex > idx) return 'completed';
    if (currentIndex === idx) return 'active';
    return 'pending';
  };

  return (
    <div className="page">
      <div className="container">
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 className="section-title">
            Device Scanner
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 'var(--space-lg)' }}>
            Run a comprehensive diagnostic across all device capabilities.
          </p>

          {phase === 'idle' && (
            <button className="btn btn-primary btn-lg" onClick={runScan}>
              Start Diagnostic Scan
            </button>
          )}

          {phase !== 'idle' && phase !== 'complete' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-lg)' }}>
              <ProgressRing progress={progress} size={80} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Scanning...</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {PHASES[currentIndex]?.label}
                  {benchmarkStep && ` — ${benchmarkStep}`}
                </div>
              </div>
            </div>
          )}

          {phase === 'complete' && !savedId && (
            <div className="animate-scale-in" style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ maxWidth: 280 }}
                placeholder="Device nickname (optional)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleSave}>
                Save Results
              </button>
            </div>
          )}

          {savedId && (
            <div className="animate-scale-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => router.push(`/report/${savedId}`)}>
                View Full Report
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/')}>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Phase Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {PHASES.map((p) => {
            const status = getStepStatus(p.key);
            return (
              <div
                key={p.key}
                className={`scanner-step ${status}`}
              >
                <div className="scanner-step-header">
                  <div className="scanner-step-title">
                    <div className="scanner-step-number">
                      {status === 'completed' ? '✓' : status === 'active' ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : phaseIndex(p.key) + 1}
                    </div>
                    <span>{p.label}</span>
                  </div>
                  <div className={`scanner-status ${status === 'active' ? 'running' : status === 'completed' ? 'done' : ''}`}>
                    {status === 'active' ? 'Running...' : status === 'completed' ? 'Complete' : 'Pending'}
                  </div>
                </div>

                {/* Results for completed phases */}
                {status === 'completed' && p.key === 'hardware' && hardware && (
                  <div className="stat-grid animate-fade-in">
                    <div className="stat-item"><span className="stat-label">CPU Cores</span><span className="stat-value">{hardware.cpuCores ?? 'N/A'}</span></div>
                    <div className="stat-item">
                      <span className="stat-label">RAM (GB){hardware.deviceMemoryManual ? '' : ' — browser caps at 8'}</span>
                      <input
                        type="number"
                        min={1}
                        placeholder={formatRam(hardware.deviceMemory)}
                        value={hardware.deviceMemoryManual ? hardware.deviceMemory ?? '' : ''}
                        onChange={(e) => {
                          const gb = Number(e.target.value);
                          try {
                            if (gb > 0) localStorage.setItem(RAM_KEY, String(gb));
                            else localStorage.removeItem(RAM_KEY);
                          } catch {}
                          setHardware({ ...hardware, deviceMemory: gb > 0 ? gb : hardware.deviceMemory, deviceMemoryManual: gb > 0 });
                        }}
                        className="stat-value"
                      />
                    </div>
                    <div className="stat-item"><span className="stat-label">Screen</span><span className="stat-value">{hardware.screenWidth}×{hardware.screenHeight}</span></div>
                    <div className="stat-item"><span className="stat-label">Pixel Ratio</span><span className="stat-value">{hardware.devicePixelRatio}x</span></div>
                    <div className="stat-item"><span className="stat-label">Color Depth</span><span className="stat-value">{hardware.colorDepth}-bit</span></div>
                    <div className="stat-item"><span className="stat-label">Touch Points</span><span className="stat-value">{hardware.maxTouchPoints}</span></div>
                    <div className="stat-item"><span className="stat-label">Platform</span><span className="stat-value mono">{hardware.platform}</span></div>
                    <div className="stat-item"><span className="stat-label">Battery</span><span className="stat-value">{hardware.battery ? `${Math.round(hardware.battery.level * 100)}%${hardware.battery.charging ? ' ' : ''}` : 'N/A'}</span></div>
                    <div className="stat-item"><span className="stat-label">Storage</span><span className="stat-value">{hardware.storage ? formatBytes(hardware.storage.quota) : 'N/A'}</span></div>
                  </div>
                )}

                {status === 'completed' && p.key === 'network' && network && (
                  <div className="stat-grid animate-fade-in">
                    <div className="stat-item"><span className="stat-label">Status</span><span className={`badge ${network.online ? 'supported' : 'unsupported'}`}>{network.online ? 'Online' : 'Offline'}</span></div>
                    <div className="stat-item"><span className="stat-label">Type</span><span className="stat-value">{network.effectiveType?.toUpperCase() ?? 'N/A'}</span></div>
                    <div className="stat-item"><span className="stat-label">Download</span><span className="stat-value">{network.downloadSpeed ? `${network.downloadSpeed} Mbps` : network.downlink ? `~${network.downlink} Mbps` : 'N/A'}</span></div>
                    <div className="stat-item"><span className="stat-label">Upload</span><span className="stat-value">{network.uploadSpeed ? `${network.uploadSpeed} Mbps` : 'N/A'}</span></div>
                    <div className="stat-item"><span className="stat-label">Latency</span><span className="stat-value">{network.latency ? `${network.latency} ms` : network.rtt ? `~${network.rtt} ms` : 'N/A'}</span></div>
                    <div className="stat-item"><span className="stat-label">Data Saver</span><span className="stat-value">{network.saveData === null ? 'N/A' : network.saveData ? 'On' : 'Off'}</span></div>
                  </div>
                )}

                {status === 'completed' && p.key === 'browser' && browser && (
                  <div className="stat-grid animate-fade-in">
                    <CapabilityBadge label="WebGPU" supported={browser.webGPU.supported} detail={browser.webGPU.detail} />
                    <CapabilityBadge label="WebGL 2" supported={browser.webGL2.supported} detail={browser.webGL2.detail} />
                    <CapabilityBadge label="WebRTC" supported={browser.webRTC.supported} />
                    <CapabilityBadge label="WebAssembly" supported={browser.webAssembly.supported} />
                    <CapabilityBadge label="Service Worker" supported={browser.serviceWorker.supported} />
                    <CapabilityBadge label="SharedArrayBuffer" supported={browser.sharedArrayBuffer.supported} />
                    <CapabilityBadge label="Web Bluetooth" supported={browser.webBluetooth.supported} />
                    <CapabilityBadge label="Web USB" supported={browser.webUSB.supported} />
                    <CapabilityBadge label="Notifications" supported={browser.notifications.supported} />
                    <CapabilityBadge label="Clipboard API" supported={browser.clipboard.supported} />
                    <CapabilityBadge label="WebSocket" supported={browser.webSocket.supported} />
                    <CapabilityBadge label="PDF Viewer" supported={browser.pdfViewer.supported} />
                    <CapabilityBadge label="H.264" supported={browser.codecs.h264} />
                    <CapabilityBadge label="VP9" supported={browser.codecs.vp9} />
                    <CapabilityBadge label="AV1" supported={browser.codecs.av1} />
                    <CapabilityBadge label="HEVC" supported={browser.codecs.hevc} />
                    <CapabilityBadge label="Opus" supported={browser.codecs.opus} />
                    <CapabilityBadge label="AAC" supported={browser.codecs.aac} />
                  </div>
                )}

                {status === 'completed' && p.key === 'performance' && benchmarks && (
                  <div className="animate-fade-in">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
                      <GaugeChart score={benchmarks.overallScore} size={100} label="Overall" />
                      <div style={{ flex: 1 }}>
                        {[benchmarks.cpuSingleCore, benchmarks.cpuMultiCore, benchmarks.memoryThroughput, benchmarks.gpuRender, benchmarks.domPerformance, benchmarks.jsEngine].map((b) => (
                          <div key={b.name} style={{ marginBottom: 'var(--space-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                              <span>{b.name}</span>
                              <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                                {b.rawValue} {b.unit} — Score: {b.score}
                              </span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className={`progress-bar-fill ${b.score >= 70 ? 'green' : b.score >= 40 ? '' : 'warm'}`}
                                style={{ width: `${b.score}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {status === 'completed' && p.key === 'sensors' && sensors && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <SensorTester name="Accelerometer" status={sensors.accelerometer} />
                    <SensorTester name="Gyroscope" status={sensors.gyroscope} />
                    <SensorTester name="Magnetometer" status={sensors.magnetometer} />
                    <SensorTester name="Ambient Light" status={sensors.ambientLight} />
                    <SensorTester name="Geolocation" status={sensors.geolocation} />
                    <SensorTester name="Camera" status={sensors.camera} count={sensors.cameraDevices} />
                    <SensorTester name="Microphone" status={sensors.microphone} count={sensors.micDevices} />
                    <SensorTester name="Speakers" status={sensors.speakers} count={sensors.speakerDevices} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
