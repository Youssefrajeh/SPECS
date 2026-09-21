'use client';

import type { SensorStatus } from '@/src/lib/types';

interface SensorTesterProps {
  name: string;
  icon: string;
  status: SensorStatus;
  count?: number;
  onTest?: () => Promise<void>;
  testing?: boolean;
}

function statusBadge(status: SensorStatus) {
  switch (status) {
    case 'available':
      return <span className="badge supported">✓ Available</span>;
    case 'unavailable':
      return <span className="badge unsupported">✗ Unavailable</span>;
    case 'denied':
      return <span className="badge partial">🚫 Denied</span>;
    case 'untested':
      return <span className="badge untested">? Untested</span>;
  }
}

export default function SensorTester({ name, icon, status, count, onTest, testing }: SensorTesterProps) {
  return (
    <div className="stat-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span style={{ fontSize: 'var(--text-xl)' }}>{icon}</span>
          <div>
            <div className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
            {count !== undefined && count > 0 && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {count} device{count !== 1 ? 's' : ''} detected
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {statusBadge(status)}
          {onTest && status !== 'available' && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onTest}
              disabled={testing}
            >
              {testing ? <span className="spinner" /> : 'Test'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
