import { NextResponse } from 'next/server';

// Accept uploaded blob for upload speed test, return size received
export async function POST(request: Request) {
  try {
    const body = await request.arrayBuffer();
    return NextResponse.json({
      received: body.byteLength,
      timestamp: Date.now(),
    });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
