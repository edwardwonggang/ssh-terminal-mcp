import os from 'os';

// 动态导入 node-pty
let ptyModule = null;

async function getPtyModule() {
  if (!ptyModule) {
    try {
      ptyModule = await import('node-pty');
      console.log('✓ node-pty loaded successfully');
    } catch (error) {
      console.error('✗ Failed to load node-pty:', error.message);
      console.error('Falling back to basic shell support without PTY features');
      throw error;
    }
  }
  return ptyModule;
}

export class LocalShellManager {
  constructor(shellType = 'powershell') {
    this.shellType = shellType;
    this.ptyProcess = null;
    this.connected = false;
    this.terminalBuffer = [];
    this.maxBufferLines = 1000;
  }

  async connect(onData) {
    try {
      const pty = await getPtyModule();
      
      let shell, shellArgs = [];
      
      if (os.platform() === 'win32') {
        if (this.shellType === 'powershell') {
          shell = 'powershell.exe';
          shellArgs = [];
        } else if (this.shellType === 'cmd') {
          shell = 'cmd.exe';
          shellArgs = [];
        } else {
          shell = 'powershell.exe';
          shellArgs = [];
        }
      } else {
        // Linux/Mac
        shell = process.env.SHELL || '/bin/bash';
        shellArgs = [];
      }

      console.log(`Starting PTY shell: ${shell}`);

      // 创建 PTY 进程
      this.ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: process.env.USERPROFILE || process.env.HOME || process.cwd(),
        env: process.env,
        // Windows ConPTY 支持
        useConpty: os.platform() === 'win32',
        conptyInheritCursor: true
      });

      // 监听数据输出
      this.ptyProcess.onData((data) => {
        this.addToBuffer(data);
        if (onData) {
          onData(data);
        }
      });

      // 监听进程退出
      this.ptyProcess.onExit(({ exitCode, signal }) => {
        console.log(`Shell process exited: code=${exitCode}, signal=${signal}`);
        this.connected = false;
      });

      this.connected = true;
      console.log(`✓ Local PTY shell (${this.shellType}) started successfully`);
      
    } catch (error) {
      console.error('Failed to start PTY shell:', error);
      this.connected = false;
      throw error;
    }
  }

  write(data) {
    if (this.ptyProcess && this.connected) {
      try {
        this.ptyProcess.write(data);
      } catch (error) {
        console.error('Error writing to PTY:', error);
      }
    }
  }

  resize(cols, rows) {
    if (this.ptyProcess && this.connected) {
      try {
        this.ptyProcess.resize(cols, rows);
        console.log(`Terminal resized to ${cols}x${rows}`);
      } catch (error) {
        console.error('Error resizing PTY:', error);
      }
    }
  }

  disconnect() {
    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill();
        console.log('PTY process killed');
      } catch (error) {
        console.error('Error killing PTY process:', error);
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
      let dataDisposable;
      
      const timeoutId = setTimeout(() => {
        if (dataDisposable) {
          dataDisposable.dispose();
        }
        reject(new Error('Command execution timeout'));
      }, timeout);

      // 监听数据输出
      try {
        dataDisposable = this.ptyProcess.onData((data) => {
          output += data;
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
        return;
      }

      // 发送命令
      this.write(command + '\r');

      // 等待命令执行完成
      setTimeout(() => {
        clearTimeout(timeoutId);
        if (dataDisposable) {
          dataDisposable.dispose();
        }
        
        resolve({
          exitCode: 0,
          output: output
        });
      }, 2000);
    });
  }
}