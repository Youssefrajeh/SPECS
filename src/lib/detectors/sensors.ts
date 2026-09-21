import type { SensorInfo, SensorStatus } from '../types';

async function checkSensor(SensorClass: unknown): Promise<SensorStatus> {
  if (!SensorClass) return 'unavailable';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sensor = new (SensorClass as any)();
    return new Promise<SensorStatus>((resolve) => {
      const timeout = setTimeout(() => {
        sensor.stop?.();
        resolve('available');
      }, 1000);

      sensor.onreading = () => {
        clearTimeout(timeout);
        sensor.stop();
        resolve('available');
      };
      sensor.onerror = (e: { error?: { name?: string } }) => {
        clearTimeout(timeout);
        sensor.stop?.();
        if (e?.error?.name === 'NotAllowedError') {
          resolve('denied');
        } else {
          resolve('unavailable');
        }
      };
      sensor.start();
    });
  } catch {
    return 'unavailable';
  }
}

async function checkGeolocation(): Promise<SensorStatus> {
  if (!navigator.geolocation) return 'unavailable';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    if (result.state === 'granted') return 'available';
    if (result.state === 'denied') return 'denied';
    return 'available'; // 'prompt' means it's available but untested
  } catch {
    return 'available'; // Assume available since the API exists
  }
}

async function checkMedia(kind: 'videoinput' | 'audioinput' | 'audiooutput'): Promise<{ status: SensorStatus; count: number }> {
  if (!navigator.mediaDevices?.enumerateDevices) {
    return { status: 'unavailable', count: 0 };
  }
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const matching = devices.filter((d) => d.kind === kind);
    return { status: matching.length > 0 ? 'available' : 'unavailable', count: matching.length };
  } catch {
    return { status: 'unavailable', count: 0 };
  }
}

export async function detectSensors(): Promise<SensorInfo> {
  const w = window as unknown as Record<string, unknown>;

  const [accelerometer, gyroscope, magnetometer, ambientLight, geolocation, camera, mic, speakers] =
    await Promise.all([
      checkSensor(w.Accelerometer),
      checkSensor(w.Gyroscope),
      checkSensor(w.Magnetometer),
      checkSensor(w.AmbientLightSensor),
      checkGeolocation(),
      checkMedia('videoinput'),
      checkMedia('audioinput'),
      checkMedia('audiooutput'),
    ]);

  return {
    accelerometer,
    gyroscope,
    magnetometer,
    ambientLight,
    geolocation,
    camera: camera.status,
    microphone: mic.status,
    speakers: speakers.status,
    cameraDevices: camera.count,
    micDevices: mic.count,
    speakerDevices: speakers.count,
  };
}

export async function testCameraAccess(): Promise<SensorStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'available';
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotAllowedError') return 'denied';
    return 'unavailable';
  }
}

export async function testMicrophoneAccess(): Promise<SensorStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return 'available';
  } catch (e) {
    if (e instanceof DOMException && e.name === 'NotAllowedError') return 'denied';
    return 'unavailable';
  }
}

export async function testGeolocationAccess(): Promise<SensorStatus> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('available'),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) resolve('denied');
        else resolve('unavailable');
      },
      { timeout: 5000 }
    );
  });
}
