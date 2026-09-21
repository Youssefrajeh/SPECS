'use client';

interface GaugeChartProps {
  score: number; // 0–100
  size?: number;
  label?: string;
}

export default function GaugeChart({ score, size = 120, label }: GaugeChartProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'poor';
  if (score >= 80) colorClass = 'excellent';
  else if (score >= 60) colorClass = 'good';
  else if (score >= 35) colorClass = 'average';

  return (
    <div className="gauge-container" style={{ width: size, height: size }}>
      <svg className="gauge-svg" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`gauge-fill ${colorClass}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            '--dash-length': `${circumference}`,
            '--dash-target': `${offset}`,
          } as React.CSSProperties}
        />
      </svg>
      <div className="gauge-value">
        <div className="gauge-score">{score}</div>
        {label && <div className="gauge-label">{label}</div>}
      </div>
    </div>
  );
}
