import type { BenchmarkResult, BenchmarkResults } from '../types';

function clampScore(raw: number, min: number, max: number): number {
  return Math.round(Math.min(100, Math.max(0, ((raw - min) / (max - min)) * 100)));
}

// ─── CPU: Sieve of Eratosthenes ──────────────────────────────────────
function sieve(limit: number): number {
  const flags = new Uint8Array(limit + 1);
  flags.fill(1);
  flags[0] = 0;
  flags[1] = 0;
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    if (flags[i]) {
      count++;
      for (let j = i * 2; j <= limit; j += i) {
        flags[j] = 0;
      }
    }
  }
  return count;
}

function benchCpuSingle(): BenchmarkResult {
  const limit = 1_000_000;
  const start = performance.now();
  const primes = sieve(limit);
  const duration = performance.now() - start;
  // Faster = higher score. ~50ms is excellent, ~500ms is slow.
  const score = clampScore(500 - duration, 0, 500);
  return {
    name: 'CPU Single-Core',
    score,
    rawValue: Math.round(duration),
    unit: 'ms',
    duration: Math.round(duration),
  };
}

// ─── CPU Multi-Core via Workers ──────────────────────────────────────
async function benchCpuMulti(): Promise<BenchmarkResult> {
  const cores = navigator.hardwareConcurrency || 4;
  const limit = 500_000;

  const workerCode = `
    self.onmessage = function(e) {
      const limit = e.data;
      const flags = new Uint8Array(limit + 1);
      flags.fill(1);
      flags[0] = 0; flags[1] = 0;
      let count = 0;
      for (let i = 2; i <= limit; i++) {
        if (flags[i]) {
          count++;
          for (let j = i * 2; j <= limit; j += i) flags[j] = 0;
        }
      }
      self.postMessage(count);
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);

  const start = performance.now();
  const promises: Promise<number>[] = [];

  for (let i = 0; i < cores; i++) {
    promises.push(
      new Promise<number>((resolve, reject) => {
        const w = new Worker(url);
        w.onmessage = (e) => {
          resolve(e.data);
          w.terminate();
        };
        w.onerror = (err) => {
          reject(err);
          w.terminate();
        };
        w.postMessage(limit);
      })
    );
  }

  try {
    await Promise.all(promises);
  } catch {
    // Workers may fail in some environments
  }
  const duration = performance.now() - start;
  URL.revokeObjectURL(url);

  // Throughput: cores * work / time. ~100ms excellent, ~2000ms slow.
  const score = clampScore(2000 - duration, 0, 2000);
  return {
    name: 'CPU Multi-Core',
    score,
    rawValue: Math.round(duration),
    unit: 'ms',
    duration: Math.round(duration),
  };
}

// ─── Memory Throughput ───────────────────────────────────────────────
function benchMemory(): BenchmarkResult {
  const size = 16 * 1024 * 1024; // 16 MB
  const arr = new Float64Array(size / 8);
  const start = performance.now();

  // Sequential write
  for (let i = 0; i < arr.length; i++) {
    arr[i] = i * 1.001;
  }
  // Sequential read + sum
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }

  const duration = performance.now() - start;
  const mbps = (size * 2) / (duration / 1000) / (1024 * 1024); // MB/s (read+write)

  const score = clampScore(mbps, 0, 20000);
  return {
    name: 'Memory Throughput',
    score,
    rawValue: Math.round(mbps),
    unit: 'MB/s',
    duration: Math.round(duration),
  };
}

// ─── GPU Render Benchmark ────────────────────────────────────────────
function benchGpu(): BenchmarkResult {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      return { name: 'GPU Render', score: 0, rawValue: 0, unit: 'frames', duration: 0 };
    }

    // Create a simple shader program
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, `
      attribute vec2 pos;
      void main() { gl_Position = vec4(pos, 0.0, 1.0); }
    `);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, `
      precision mediump float;
      uniform float u_time;
      void main() {
        gl_FragColor = vec4(
          sin(u_time * 3.14) * 0.5 + 0.5,
          cos(u_time * 2.71) * 0.5 + 0.5,
          sin(u_time * 1.41) * 0.5 + 0.5,
          1.0
        );
      }
    `);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const posLoc = gl.getAttribLocation(prog, 'pos');
    const timeLoc = gl.getUniformLocation(prog, 'u_time');

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const duration = 2000; // 2s test
    const start = performance.now();
    let frames = 0;
    while (performance.now() - start < duration) {
      gl.uniform1f(timeLoc, (performance.now() - start) / 1000);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.finish();
      frames++;
    }

    // Cleanup
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteBuffer(buf);

    const fps = frames / (duration / 1000);
    const score = clampScore(fps, 0, 5000);
    return { name: 'GPU Render', score, rawValue: Math.round(fps), unit: 'fps', duration };
  } catch {
    return { name: 'GPU Render', score: 0, rawValue: 0, unit: 'fps', duration: 0 };
  }
}

// ─── DOM Performance ─────────────────────────────────────────────────
function benchDom(): BenchmarkResult {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const nodeCount = 5000;
  const start = performance.now();

  for (let i = 0; i < nodeCount; i++) {
    const el = document.createElement('div');
    el.textContent = `Node ${i}`;
    el.className = 'bench-node';
    container.appendChild(el);
  }
  // Force reflow
  void container.offsetHeight;

  // Remove all
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  void container.offsetHeight;

  document.body.removeChild(container);

  const duration = performance.now() - start;
  const opsPerSec = Math.round((nodeCount * 2) / (duration / 1000));
  const score = clampScore(opsPerSec, 0, 200_000);
  return { name: 'DOM Performance', score, rawValue: opsPerSec, unit: 'ops/s', duration: Math.round(duration) };
}

// ─── JavaScript Engine ───────────────────────────────────────────────
function benchJsEngine(): BenchmarkResult {
  const start = performance.now();

  // Fibonacci iterative (no recursion to avoid call stack)
  let a = 0, b = 1;
  for (let i = 0; i < 1_000_000; i++) {
    const t = a + b;
    a = b;
    b = t;
  }

  // JSON parse/stringify
  const obj: Record<string, unknown> = {};
  for (let i = 0; i < 100; i++) {
    obj[`key_${i}`] = { value: i, nested: { arr: [1, 2, 3, i] } };
  }
  for (let i = 0; i < 500; i++) {
    JSON.parse(JSON.stringify(obj));
  }

  // Regex
  const text = 'The quick brown fox jumps over the lazy dog '.repeat(1000);
  for (let i = 0; i < 100; i++) {
    text.match(/\b\w{4,}\b/g);
  }

  const duration = performance.now() - start;
  const score = clampScore(500 - duration, 0, 500);
  return {
    name: 'JS Engine',
    score,
    rawValue: Math.round(duration),
    unit: 'ms',
    duration: Math.round(duration),
  };
}

// ─── Run All Benchmarks ──────────────────────────────────────────────
export async function runBenchmarks(
  onProgress?: (step: number, total: number, name: string) => void
): Promise<BenchmarkResults> {
  const total = 6;

  onProgress?.(1, total, 'CPU Single-Core');
  const cpuSingleCore = benchCpuSingle();

  onProgress?.(2, total, 'CPU Multi-Core');
  const cpuMultiCore = await benchCpuMulti();

  onProgress?.(3, total, 'Memory Throughput');
  const memoryThroughput = benchMemory();

  onProgress?.(4, total, 'GPU Render');
  const gpuRender = benchGpu();

  onProgress?.(5, total, 'DOM Performance');
  const domPerformance = benchDom();

  onProgress?.(6, total, 'JS Engine');
  const jsEngine = benchJsEngine();

  const weights = [0.2, 0.2, 0.15, 0.2, 0.1, 0.15];
  const scores = [cpuSingleCore.score, cpuMultiCore.score, memoryThroughput.score, gpuRender.score, domPerformance.score, jsEngine.score];
  const overallScore = Math.round(scores.reduce((sum, s, i) => sum + s * weights[i], 0));

  return {
    cpuSingleCore,
    cpuMultiCore,
    memoryThroughput,
    gpuRender,
    domPerformance,
    jsEngine,
    overallScore,
  };
}
