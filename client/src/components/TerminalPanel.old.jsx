import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

const TerminalPanel = forwardRef(({ onData, onResize, isConnected, sessionType }, ref) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useImperativeHandle(ref, () => ({
    write: (data) => {
      if (xtermRef.current) {
        xtermRef.current.write(data);
      }
    },
    clear: () => {
      if (xtermRef.current) {
        xtermRef.current.clear();
      }
    },
    focus: () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;
    if (xtermRef.current) return; // 防止重复创建

    // 创建终端实例
    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Consolas, "Courier New", "Cascadia Code", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      allowTransparency: false,
      scrollback: 10000,
      tabStopWidth: 4,
      convertEol: false,
      windowsMode: sessionType === 'cmd' || sessionType === 'powershell'
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // 打开终端
    xterm.open(terminalRef.current);
    
    // 延迟fit以确保容器尺寸已确定，并且等待DOM完全渲染
    const fitTerminal = () => {
      try {
        if (terminalRef.current && terminalRef.current.offsetParent !== null) {
          fitAddon.fit();
        }
      } catch (e) {
        console.error('Error fitting terminal:', e);
      }
    };
    
    setTimeout(fitTerminal, 150);
    setTimeout(fitTerminal, 300);

    // 欢迎信息
    if (!isConnected) {
      xterm.writeln('\x1b[1;36m╔═══════════════════════════════════════════════════════════╗\x1b[0m');
      xterm.writeln('\x1b[1;36m║\x1b[0m         SSH Terminal with MCP Protocol Support            \x1b[1;36m║\x1b[0m');
      xterm.writeln('\x1b[1;36m╚═══════════════════════════════════════════════════════════╝\x1b[0m');
      xterm.writeln('');
      xterm.writeln('\x1b[1;33mReady to connect...\x1b[0m');
      xterm.writeln('');
      xterm.writeln('Click "New Session" to start:');
      xterm.writeln('  \x1b[32m•\x1b[0m SSH - Connect to remote server');
      xterm.writeln('  \x1b[34m•\x1b[0m PowerShell - Local PowerShell terminal');
      xterm.writeln('  \x1b[35m•\x1b[0m CMD - Local Command Prompt');
      xterm.writeln('');
      xterm.writeln('\x1b[2mMCP API Endpoints:\x1b[0m');
      xterm.writeln('\x1b[2m  POST /mcp/execute       - Execute command\x1b[0m');
      xterm.writeln('\x1b[2m  POST /mcp/get-content   - Get terminal content\x1b[0m');
      xterm.writeln('\x1b[2m  GET  /mcp/sessions      - List sessions\x1b[0m');
      xterm.writeln('');
    }

    // 处理用户输入
    xterm.onData((data) => {
      if (onData && isConnected) {
        onData(data);
      }
    });

    // 处理终端大小调整
    xterm.onResize(({ cols, rows }) => {
      if (onResize) {
        onResize(cols, rows);
      }
    });

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    // 窗口大小调整
    const handleResize = () => {
      if (fitAddon) {
        setTimeout(() => {
          try {
            fitAddon.fit();
          } catch (e) {
            console.error('Error fitting terminal:', e);
          }
        }, 0);
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      if (xterm) {
        xterm.dispose();
      }
    };
  }, []); // 只创建一次

  // 连接状态变化时的处理
  useEffect(() => {
    if (xtermRef.current) {
      if (isConnected) {
        // 连接成功后聚焦终端
        setTimeout(() => {
          xtermRef.current.focus();
        }, 100);
      }
    }
  }, [isConnected]);

  // 当窗口大小或激活会话变化时重新fit
  useEffect(() => {
    if (fitAddonRef.current && terminalRef.current && isConnected) {
      const timer = setTimeout(() => {
        try {
          if (terminalRef.current && terminalRef.current.offsetParent !== null) {
            fitAddonRef.current.fit();
          }
        } catch (e) {
          console.error('Error fitting terminal:', e);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  return (
    <div className="terminal-wrapper">
      <div className="terminal-content" ref={terminalRef} />
    </div>
  );
});

TerminalPanel.displayName = 'TerminalPanel';

export default TerminalPanel;