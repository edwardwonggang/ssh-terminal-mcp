import { spawn } from 'child_process';
import os from 'os';

export class LocalShellManager {
  constructor(shellType = 'powershell') {
    this.shellType = shellType;
    this.process = null;
    this.connected = false;
    this.terminalBuffer = [];
    this.maxBufferLines = 1000;
  }

  async connect(onData) {
    return new Promise((resolve, reject) => {
      try {
        let shellCommand, shellArgs;
        
        if (os.platform() === 'win32') {
          if (this.shellType === 'powershell') {
            shellCommand = 'powershell.exe';
            shellArgs = ['-NoLogo', '-NoExit', '-Command', '-'];
          } else if (this.shellType === 'cmd') {
            shellCommand = 'cmd.exe';
            shellArgs = [];
          } else {
            shellCommand = 'powershell.exe';
            shellArgs = ['-NoLogo', '-NoExit', '-Command', '-'];
          }
        } else {
          shellCommand = '/bin/bash';
          shellArgs = [];
        }

        this.process = spawn(shellCommand, shellArgs, {
          windowsHide: true,
          env: process.env,
          cwd: process.env.USERPROFILE || process.env.HOME || process.cwd()
        });

        this.process.stdout.on('data', (data) => {
          const text = data.toString();
          this.addToBuffer(text);
          onData(text);
        });

        this.process.stderr.on('data', (data) => {
          const text = data.toString();
          this.addToBuffer(text);
          onData(text);
        });

        this.process.on('close', (code) => {
          console.log(`Shell process exited with code ${code}`);
          this.connected = false;
        });

        this.process.on('error', (err) => {
          console.error('Shell process error:', err);
          this.connected = false;
          reject(err);
        });

        this.connected = true;
        console.log(`Local shell (${this.shellType}) started successfully`);
        resolve();
      } catch (error) {
        console.error('Failed to start shell:', error);
        this.connected = false;
        reject(error);
      }
    });
  }

  write(data) {
    if (this.process && this.connected) {
      try {
        this.process.stdin.write(data);
      } catch (error) {
        console.error('Error writing to shell:', error);
      }
    }
  }

  resize(cols, rows) {
    // 简单的 spawn 不支持调整大小
    // 需要使用 node-pty 才能完全支持
  }

  disconnect() {
    if (this.process) {
      try {
        this.process.kill();
      } catch (error) {
        console.error('Error killing shell process:', error);
      }
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  addToBuffer(text) {
    const lines = text.split('\n');
    this.terminalBuffer.push(...lines);
    
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
        reject(new Error('Not connected to shell'));
        return;
      }

      let output = '';
      const timeoutId = setTimeout(() => {
        reject(new Error('Command execution timeout'));
      }, timeout);

      const dataHandler = (data) => {
        output += data.toString();
      };

      this.process.stdout.on('data', dataHandler);
      this.process.stderr.on('data', dataHandler);

      this.write(command + '\n');

      setTimeout(() => {
        clearTimeout(timeoutId);
        this.process.stdout.removeListener('data', dataHandler);
        this.process.stderr.removeListener('data', dataHandler);
        
        resolve({
          exitCode: 0,
          output: output
        });
      }, 2000);
    });
  }
}