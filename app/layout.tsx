import type { Metadata } from 'next';
import './globals.css';
import './components.css';
import Header from '@/src/components/Header';

export const metadata: Metadata = {
  title: 'SPECS — Device Diagnostic Dashboard',
  description: 'Comprehensive device specification testing, benchmarking, and comparison tool. Detect hardware, network, browser capabilities, run performance benchmarks, and compare across devices.',
  keywords: ['device specs', 'benchmark', 'hardware test', 'browser test', 'speed test', 'device comparison'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
