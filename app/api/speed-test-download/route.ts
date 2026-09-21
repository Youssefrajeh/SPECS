import { NextResponse } from 'next/server';

// Generate ~1MB of random data for download speed test
export async function GET() {
  const size = 1024 * 1024; // 1 MB
  const buffer = new Uint8Array(size);

  // Fill with pseudo-random data
  for (let i = 0; i < size; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': size.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
