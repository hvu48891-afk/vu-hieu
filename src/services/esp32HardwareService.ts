/**
 * ESP32 Physical Hardware Bridge Service
 * Supports:
 * 1. Web Serial API (Direct USB / COM port connection from Google Chrome / Edge)
 * 2. Network / WebSocket (Direct IP / WiFi connection to ESP32)
 * 3. Bidirectional telemetry reception (PZEM-004T 24V, PIR, DHT22, Relays)
 * 4. Hardware command transmission (Toggle relays, all-off, ping)
 */

export interface ESP32Telemetry {
  voltageV: number;
  currentA: number;
  powerW: number;
  energyKWh?: number;
  powerFactor?: number;
  frequencyHz?: number;
  temperature?: number;
  humidity?: number;
  motionDetected?: boolean;
  relays?: { [pinOrIndex: string]: boolean };
  raw: string;
  timestamp: number;
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'RX' | 'TX' | 'INFO' | 'ERROR';
  text: string;
}

export type ConnectionMode = 'serial' | 'websocket' | 'none';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

class ESP32HardwareService {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private readableStreamClosed: any = null;
  private writableStreamClosed: any = null;

  private ws: WebSocket | null = null;
  private mode: ConnectionMode = 'none';
  private status: ConnectionStatus = 'disconnected';
  private portInfo: string = '';
  private boundClassroomId: string = 'cr-a101'; // Default bound to Room A101
  private overrideTelemetry: boolean = true; // Apply real measurements to bound room

  private logs: SerialLogEntry[] = [];
  private listeners: Set<() => void> = new Set();
  private telemetryCallbacks: Set<(data: ESP32Telemetry) => void> = new Set();

  private rxBuffer: string = '';
  private txBytes: number = 0;
  private rxBytes: number = 0;
  private connectTimestamp: number | null = null;

  constructor() {
    // Listen for disconnect events if supported
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      (navigator as any).serial.addEventListener('disconnect', () => {
        this.addLog('INFO', 'Cổng Serial vừa bị ngắt kết nối vật lý (rút cáp USB)!');
        this.disconnect();
      });
    }
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in (navigator as any);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public getPortInfo(): string {
    return this.portInfo;
  }

  public getBoundClassroomId(): string {
    return this.boundClassroomId;
  }

  public setBoundClassroomId(id: string) {
    this.boundClassroomId = id;
    this.notify();
  }

  public isOverrideTelemetry(): boolean {
    return this.overrideTelemetry;
  }

  public setOverrideTelemetry(override: boolean) {
    this.overrideTelemetry = override;
    this.notify();
  }

  public getLogs(): SerialLogEntry[] {
    return this.logs;
  }

  public getStats() {
    return {
      txBytes: this.txBytes,
      rxBytes: this.rxBytes,
      uptimeSec: this.connectTimestamp ? Math.floor((Date.now() - this.connectTimestamp) / 1000) : 0,
    };
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onTelemetry(cb: (data: ESP32Telemetry) => void): () => void {
    this.telemetryCallbacks.add(cb);
    return () => this.telemetryCallbacks.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error(e);
      }
    });
  }

  private addLog(direction: 'RX' | 'TX' | 'INFO' | 'ERROR', text: string) {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
    const entry: SerialLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      direction,
      text,
    };
    this.logs = [...this.logs.slice(-250), entry];
    this.notify();
  }

  // --- WEB SERIAL (USB / COM PORT) ---
  public async connectSerial(baudRate: number = 115200): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebSerialSupported()) {
      const err = 'Trình duyệt hiện tại không hỗ trợ Web Serial API. Vui lòng sử dụng Google Chrome, Microsoft Edge, Opera hoặc dùng chế độ WiFi/WebSocket.';
      this.addLog('ERROR', err);
      return { success: false, error: err };
    }

    try {
      this.status = 'connecting';
      this.mode = 'serial';
      this.notify();

      this.addLog('INFO', `Đang yêu cầu chọn cổng COM/USB (Baud rate: ${baudRate})...`);
      this.port = await (navigator as any).serial.requestPort();

      await this.port.open({ baudRate });

      const info = this.port.getInfo?.();
      const usbVendor = info?.usbVendorId ? ` [VID: 0x${info.usbVendorId.toString(16)}]` : '';
      this.portInfo = `Cổng Serial (USB)${usbVendor} @ ${baudRate} bps`;

      this.status = 'connected';
      this.connectTimestamp = Date.now();
      this.addLog('INFO', `Đã kết nối thành công với mạch ESP32 qua ${this.portInfo}!`);

      this.startSerialReader();
      this.notify();

      // Send initial PING / HANDSHAKE
      setTimeout(() => {
        this.sendCommand('{"cmd":"PING","client":"SmartClass_Web"}');
      }, 500);

      return { success: true };
    } catch (err: any) {
      this.status = 'disconnected';
      this.mode = 'none';
      const msg = err.message || 'Không thể mở cổng Serial hoặc người dùng đã hủy chọn cổng.';
      this.addLog('ERROR', `Lỗi kết nối Serial: ${msg}`);
      this.notify();
      return { success: false, error: msg };
    }
  }

  private async startSerialReader() {
    try {
      while (this.port && this.port.readable && this.status === 'connected') {
        const textDecoder = new TextDecoderStream();
        this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
        this.reader = textDecoder.readable.getReader();

        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value) {
              this.rxBytes += value.length;
              this.processIncomingChunk(value);
            }
          }
        } catch (readErr) {
          console.warn('Serial read error or closed:', readErr);
        } finally {
          this.reader.releaseLock();
        }
      }
    } catch (err: any) {
      if (this.status === 'connected') {
        this.addLog('ERROR', `Lỗi đọc luồng Serial: ${err.message || err}`);
        this.disconnect();
      }
    }
  }

  // --- WEBSOCKET / LAN CONNECTION ---
  public connectWebSocket(url: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        let wsUrl = url.trim();
        if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
          wsUrl = `ws://${wsUrl}`;
        }

        this.status = 'connecting';
        this.mode = 'websocket';
        this.addLog('INFO', `Đang kết nối WebSocket tới ESP32 tại ${wsUrl}...`);
        this.notify();

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.status = 'connected';
          this.portInfo = `WebSocket: ${wsUrl}`;
          this.connectTimestamp = Date.now();
          this.addLog('INFO', `Đã kết nối thành công tới mạch ESP32 qua mạng LAN (${wsUrl})!`);
          this.notify();
          this.sendCommand('{"cmd":"PING","client":"SmartClass_Web"}');
          resolve({ success: true });
        };

        this.ws.onmessage = (event) => {
          const data = typeof event.data === 'string' ? event.data : '';
          this.rxBytes += data.length;
          this.processIncomingChunk(data + '\n');
        };

        this.ws.onerror = () => {
          this.addLog('ERROR', `Lỗi kết nối WebSocket tới ${wsUrl}!`);
        };

        this.ws.onclose = () => {
          this.addLog('INFO', 'Đã ngắt kết nối WebSocket khỏi mạch ESP32.');
          this.disconnect();
          resolve({ success: false, error: 'Kết nối WebSocket bị đóng.' });
        };
      } catch (err: any) {
        this.status = 'disconnected';
        this.mode = 'none';
        const msg = err.message || 'Không thể tạo kết nối WebSocket.';
        this.addLog('ERROR', msg);
        this.notify();
        resolve({ success: false, error: msg });
      }
    });
  }

  // --- PARSE INCOMING DATA STREAM ---
  private processIncomingChunk(chunk: string) {
    this.rxBuffer += chunk;
    const lines = this.rxBuffer.split(/\r?\n/);
    // Keep the remainder (incomplete line) in rxBuffer
    this.rxBuffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      this.addLog('RX', line);
      this.parseAndDispatchTelemetry(line);
    }
  }

  private parseAndDispatchTelemetry(line: string) {
    let telemetry: ESP32Telemetry | null = null;

    // 1. Try parsing JSON format
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const obj = JSON.parse(line);
        // Check if object contains measurements
        if (
          obj.voltage !== undefined ||
          obj.voltageV !== undefined ||
          obj.power !== undefined ||
          obj.powerW !== undefined ||
          obj.current !== undefined ||
          obj.currentA !== undefined ||
          obj.temp !== undefined ||
          obj.relays !== undefined
        ) {
          const v = Number(obj.voltage ?? obj.voltageV ?? 24.0);
          const i = Number(obj.current ?? obj.currentA ?? 0.0);
          const p = Number(obj.power ?? obj.powerW ?? (v * i));
          telemetry = {
            voltageV: isNaN(v) ? 24.0 : Number(v.toFixed(2)),
            currentA: isNaN(i) ? 0.0 : Number(i.toFixed(2)),
            powerW: isNaN(p) ? 0.0 : Number(p.toFixed(1)),
            energyKWh: obj.energy !== undefined ? Number(obj.energy) : undefined,
            powerFactor: obj.pf !== undefined ? Number(obj.pf) : 0.98,
            frequencyHz: obj.freq !== undefined ? Number(obj.freq) : 50.0,
            temperature: obj.temp !== undefined ? Number(obj.temp) : (obj.temperature !== undefined ? Number(obj.temperature) : undefined),
            humidity: obj.humidity !== undefined ? Number(obj.humidity) : (obj.hum !== undefined ? Number(obj.hum) : undefined),
            motionDetected: obj.motion !== undefined ? Boolean(obj.motion) : (obj.pir !== undefined ? Boolean(obj.pir) : undefined),
            relays: obj.relays || undefined,
            raw: line,
            timestamp: Date.now(),
          };
        }
      } catch {
        // Not valid JSON, try key-value
      }
    }

    // 2. Try parsing Key-Value CSV format: "V:24.1,I:1.2,P:28.8,T:27.5,H:65,M:1"
    if (!telemetry && (line.includes('V:') || line.includes('VOLTAGE:') || line.includes('V='))) {
      try {
        const parts = line.split(/[,;\s]+/);
        let v = 24.0, i = 0.0, p = 0.0, temp: number | undefined, hum: number | undefined, m: boolean | undefined;
        for (const part of parts) {
          const [k, val] = part.split(/[:=]/);
          if (!k || !val) continue;
          const key = k.toUpperCase().trim();
          const num = parseFloat(val);
          if (key === 'V' || key === 'VOLTAGE') v = num;
          else if (key === 'I' || key === 'CURRENT') i = num;
          else if (key === 'P' || key === 'POWER') p = num;
          else if (key === 'T' || key === 'TEMP') temp = num;
          else if (key === 'H' || key === 'HUM') hum = num;
          else if (key === 'M' || key === 'PIR' || key === 'MOTION') m = num > 0 || val.toLowerCase() === 'true';
        }
        telemetry = {
          voltageV: Number(v.toFixed(2)),
          currentA: Number(i.toFixed(2)),
          powerW: Number(p.toFixed(1)),
          powerFactor: 0.98,
          frequencyHz: 50.0,
          temperature: temp,
          humidity: hum,
          motionDetected: m,
          raw: line,
          timestamp: Date.now(),
        };
      } catch {
        // ignore
      }
    }

    if (telemetry) {
      this.telemetryCallbacks.forEach((cb) => {
        try {
          cb(telemetry!);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }

  // --- SEND COMMANDS DOWN TO HARDWARE ---
  public async sendCommand(commandText: string): Promise<boolean> {
    const text = commandText.endsWith('\n') ? commandText : `${commandText}\n`;
    this.addLog('TX', text.trim());
    this.txBytes += text.length;

    // Send via Web Serial
    if (this.mode === 'serial' && this.port && this.port.writable) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const writer = this.port.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
        return true;
      } catch (err: any) {
        this.addLog('ERROR', `Lỗi gửi lệnh qua Serial: ${err.message || err}`);
        return false;
      }
    }

    // Send via WebSocket
    if (this.mode === 'websocket' && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(text);
        return true;
      } catch (err: any) {
        this.addLog('ERROR', `Lỗi gửi lệnh qua WebSocket: ${err.message || err}`);
        return false;
      }
    }

    this.addLog('ERROR', 'Không thể gửi lệnh: Chưa có kết nối mạch thực tế nào hoạt động!');
    return false;
  }

  public async sendRelayCommand(deviceKey: string, pin: number | string, state: boolean): Promise<boolean> {
    const numericPin = typeof pin === 'number' ? pin : parseInt(String(pin).replace(/\D/g, '') || '16', 10);
    const jsonCmd = JSON.stringify({
      cmd: 'SET_RELAY',
      device: deviceKey,
      pin: numericPin,
      state: state ? 1 : 0,
      voltage: '24V',
    });
    return this.sendCommand(jsonCmd);
  }

  public async sendAllOffCommand(): Promise<boolean> {
    return this.sendCommand(JSON.stringify({ cmd: 'ALL_OFF', voltage: '24V' }));
  }

  // --- DISCONNECT ---
  public async disconnect() {
    this.status = 'disconnected';
    this.portInfo = '';
    this.connectTimestamp = null;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // ignore
      }
      this.reader = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // ignore
      }
      this.port = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    this.mode = 'none';
    this.addLog('INFO', 'Đã ngắt toàn bộ kết nối phần cứng.');
    this.notify();
  }
}

export const esp32HardwareService = new ESP32HardwareService();
