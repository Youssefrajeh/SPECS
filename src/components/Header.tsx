'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/scan', label: 'Run Scan', icon: '🔍' },
    { href: '/compare', label: 'Compare', icon: '⚖️' },
  ];

  return (
    <header className="header">
      <div className="header-inner">
        <Link href="/" className="logo">
          <span className="logo-icon">⚡</span>
          <span className="gradient-text">SPECS</span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${pathname === link.href ? 'active' : ''}`}
            >
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
