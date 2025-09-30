import { Client } from 'ssh2';

export class SSHManager {
  constructor() {
    this.client = null;
    this.stream = null;
    this.connected = false;
    this.terminalBuffer = [];
    this.maxBufferLines = 1000;
  }

  async connect(config, onData) {
    return new Promise((resolve, reject) => {
      this.client = new Client();

      this.client.on('ready', () => {
        console.log('SSH connection established');
        
        this.client.shell({
          term: 'xterm-256color',
          rows: 24,
          cols: 80,
          modes: {
            ECHO: 1,
            ICANON: 0
          }
        }, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          this.stream = stream;
          this.connected = true;

          stream.on('data', (data) => {
            const text = data.toString();
            this.addToBuffer(text);
            onData(data);
          });

          stream.on('close', () => {
            console.log('SSH stream closed');
            this.connected = false;
            this.client.end();
          });

          stream.stderr.on('data', (data) => {
            const text = data.toString();
            this.addToBuffer(text);
            onData(data);
          });

          resolve();
        });
      });

      this.client.on('error', (err) => {
        console.error('SSH connection error:', err);
        this.connected = false;
        reject(err);
      });

      this.client.on('close', () => {
        console.log('SSH connection closed');
        this.connected = false;
      });

      this.client.connect(config);
    });
  }

  write(data) {
    if (this.stream && this.connected) {
      this.stream.write(data);
    }
  }

  resize(cols, rows) {
    if (this.stream && this.connected) {
      this.stream.setWindow(rows, cols);
    }
  }

  disconnect() {
    if (this.stream) {
      this.stream.end();
    }
    if (this.client) {
      this.client.end();
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  addToBuffer(text) {
    const lines = text.split('\n');
    this.terminalBuffer.push(...lines);
    
    // 保持缓冲区大小限制
    if (this.terminalBuffer.length > this.maxBufferLines) {
      this.terminalBuffer = this.terminalBuffer.slice(-this.maxBufferLines);
    }
  }

  getBufferContent(lines = 100) {
    const start = Math.max(0, this.terminalBuffer.length - lines);
    return this.terminalBuffer.slice(start).join('\n');
  }

  async executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected to SSH server'));
        return;
      }

      let output = '';
      const timeoutId = setTimeout(() => {
        reject(new Error('Command execution timeout'));
      }, timeout);

      this.client.exec(command, (err, stream) => {
        if (err) {
          clearTimeout(timeoutId);
          reject(err);
          return;
        }

        stream.on('data', (data) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data) => {
          output += data.toString();
        });

        stream.on('close', (code) => {
          clearTimeout(timeoutId);
          resolve({
            exitCode: code,
            output: output
          });
        });
      });
    });
  }
}