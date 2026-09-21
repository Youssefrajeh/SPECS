# SPECS — Device Diagnostic Dashboard

A Next.js app that profiles the device it runs on and lets you save, view and compare reports.

- **Scan** (`/scan`): detects hardware, network (with speed test), browser capabilities and sensors, and runs CPU/memory/etc. benchmarks.
- **Home** (`/`): saved devices, with JSON export/import.
- **Report** (`/report/[id]`): tabbed detail view of a saved scan.
- **Compare** (`/compare`): radar chart and side-by-side table across devices.

Reports are stored in the browser's localStorage. The speed test uses `/api/speed-test-download` and `/api/speed-test-upload`.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```
