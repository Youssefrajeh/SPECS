'use client';

interface CapabilityBadgeProps {
  supported: boolean;
  label: string;
  detail?: string;
}

export default function CapabilityBadge({ supported, label, detail }: CapabilityBadgeProps) {
  return (
    <div className="stat-item" title={detail}>
      <span className="stat-label">{label}</span>
      <span className={`badge ${supported ? 'supported' : 'unsupported'}`}>
        {supported ? 'Yes' : 'No'}
      </span>
    </div>
  );
}
