import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

const Terminal = forwardRef(({ onData, onResize, isConnected }, ref) => {
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
    }
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    // 创建终端实例
    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
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
      scrollback: 1000
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    // 打开终端
    xterm.open(terminalRef.current);
    fitAddon.fit();

    // 欢迎信息
    xterm.writeln('╔═══════════════════════════════════════════════════════════╗');
    xterm.writeln('║         SSH Terminal with MCP Protocol Support            ║');
    xterm.writeln('╚═══════════════════════════════════════════════════════════╝');
    xterm.writeln('');
    xterm.writeln('Click "New Connection" to connect to an SSH server.');
    xterm.writeln('');
    xterm.writeln('MCP API Endpoints:');
    xterm.writeln('  POST /mcp/execute       - Execute command');
    xterm.writeln('  POST /mcp/get-content   - Get terminal content');
    xterm.writeln('  GET  /mcp/sessions      - List sessions');
    xterm.writeln('');

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
  }, []);

  // 连接状态变化时的处理
  useEffect(() => {
    if (xtermRef.current && !isConnected) {
      // 可以在这里添加断开连接后的提示
    }
  }, [isConnected]);

  return (
    <div className="terminal-wrapper">
      <div className="terminal-content" ref={terminalRef} />
    </div>
  );
});

Terminal.displayName = 'Terminal';

export default Terminal;