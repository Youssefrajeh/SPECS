'use client';

import { useRef, useEffect } from 'react';

interface RadarChartProps {
  labels: string[];
  datasets: {
    label: string;
    values: number[];
    color: string;
  }[];
  size?: number;
}

export default function RadarChart({ labels, datasets, size = 300 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size * 0.38;
    const count = labels.length;
    const angleStep = (2 * Math.PI) / count;
    const startAngle = -Math.PI / 2;

    // Clear
    ctx.clearRect(0, 0, size, size);

    // Draw grid rings
    for (let ring = 1; ring <= 5; ring++) {
      const r = (ring / 5) * maxRadius;
      ctx.beginPath();
      for (let i = 0; i <= count; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * angleStep;
      const x = cx + maxRadius * Math.cos(angle);
      const y = cy + maxRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Labels
      const labelRadius = maxRadius + 20;
      const lx = cx + labelRadius * Math.cos(angle);
      const ly = cy + labelRadius * Math.sin(angle);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    // Draw datasets
    for (const dataset of datasets) {
      ctx.beginPath();
      for (let i = 0; i <= count; i++) {
        const idx = i % count;
        const angle = startAngle + idx * angleStep;
        const val = (dataset.values[idx] ?? 0) / 100;
        const r = val * maxRadius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Fill
      ctx.fillStyle = dataset.color + '20';
      ctx.fill();

      // Stroke
      ctx.strokeStyle = dataset.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dots
      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * angleStep;
        const val = (dataset.values[i] ?? 0) / 100;
        const r = val * maxRadius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = dataset.color;
        ctx.fill();
      }
    }
  }, [labels, datasets, size]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
      <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {datasets.map((ds, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: ds.color }} />
            {ds.label}
          </div>
        ))}
      </div>
    </div>
  );
}
