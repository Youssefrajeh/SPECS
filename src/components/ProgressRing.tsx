'use client';

interface ProgressRingProps {
  progress: number; // 0–100
  size?: number;
  strokeWidth?: number;
}

export default function ProgressRing({ progress, size = 80, strokeWidth = 6 }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', position: 'absolute' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-blue)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span style={{ 
        fontSize: 'var(--text-sm)', 
        fontWeight: 700, 
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-primary)',
        zIndex: 1 
      }}>
        {Math.round(progress)}%
      </span>
    </div>
  );
}
