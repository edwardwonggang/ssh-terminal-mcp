import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { SerializeAddon } from '@xterm/addon-serialize';
import '@xterm/xterm/css/xterm.css';

const TerminalPanel = forwardRef(({ onData, onResize, isConnected, sessionType, isActive }, ref) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const isInitializedRef = useRef(false);
  const cleanupFnRef = useRef(null);

  useImperativeHandle(ref, () => ({
    write: (data) => {
      if (xtermRef.current) {
        try {
          xtermRef.current.write(data);
        } catch (e) {
          console.error('Error writing to terminal:', e);
        }
      }
    },
    clear: () => {
      if (xtermRef.current) {
        try {
          xtermRef.current.clear();
        } catch (e) {
          console.error('Error clearing terminal:', e);
        }
      }
    },
    focus: () => {
      if (xtermRef.current) {
        try {
          xtermRef.current.focus();
        } catch (e) {
          console.error('Error focusing terminal:', e);
        }
      }
    }
  }));

  useEffect(() => {
    // 仅在激活且DOM存在时初始化，避免在隐藏容器上初始化
    if (!isActive || !terminalRef.current) {
      return;
    }
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    // 创建终端实例 - 使用 Windows Terminal Campbell 主题配色
    const xterm = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"Cascadia Code", "Cascadia Mono", Consolas, "Courier New", monospace',
      fontSize: 13,
      fontWeight: '400',
      fontWeightBold: '700',
      lineHeight: 1.0,
      letterSpacing: 0,
      // Windows Terminal Campbell 主题
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#0c0c0c',
        selectionBackground: '#264f78',
        black: '#0c0c0c',
        red: '#c50f1f',
        green: '#13a10e',
        yellow: '#c19c00',
        blue: '#0037da',
        magenta: '#881798',
        cyan: '#3a96dd',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#e74856',
        brightGreen: '#16c60c',
        brightYellow: '#f9f1a5',
        brightBlue: '#3b78ff',
        brightMagenta: '#b4009e',
        brightCyan: '#61d6d6',
        brightWhite: '#f2f2f2'
      },
      allowTransparency: false,
      scrollback: 10000,
      tabStopWidth: 8,
      convertEol: false,
      windowsMode: sessionType === 'cmd' || sessionType === 'powershell',
      rightClickSelectsWord: true,
      fastScrollModifier: 'shift',
      fastScrollSensitivity: 5,
      scrollSensitivity: 1,
      minimumContrastRatio: 4.5,
      allowProposedApi: true
    });

    // 添加插件
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();
    const serializeAddon = new SerializeAddon();
    
    try {
      xterm.loadAddon(fitAddon);
      xterm.loadAddon(webLinksAddon);
      xterm.loadAddon(searchAddon);
      xterm.loadAddon(serializeAddon);
    } catch (e) {
      console.error('Error loading addons:', e);
    }

    // 使用 requestAnimationFrame 确保 DOM 完全准备好
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          // 现在打开终端
          xterm.open(terminalRef.current);
          
          // 安全的fit函数
          const safeFit = () => {
            try {
              if (terminalRef.current && 
                  terminalRef.current.offsetParent !== null &&
                  terminalRef.current.offsetWidth > 0 &&
                  terminalRef.current.offsetHeight > 0) {
                fitAddon.fit();
                return true;
              }
            } catch (e) {
              // 静默处理fit错误
            }
            return false;
          };

          // 在打开后延迟fit
          setTimeout(() => safeFit(), 50);
          setTimeout(() => safeFit(), 150);
          setTimeout(() => safeFit(), 300);
          
          // 显示欢迎信息（只在未连接时）
          if (!isConnected) {
            setTimeout(() => {
              try {
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
              } catch (e) {
                console.error('Error writing welcome message:', e);
              }
            }, 100);
          }
          
          // 处理用户输入
          const dataDisposable = xterm.onData((data) => {
            if (onData && isConnected) {
              try {
                onData(data);
              } catch (e) {
                console.error('Error handling data:', e);
              }
            }
          });

          // 处理终端大小调整
          const resizeDisposable = xterm.onResize(({ cols, rows }) => {
            if (onResize) {
              try {
                onResize(cols, rows);
              } catch (e) {
                console.error('Error handling resize:', e);
              }
            }
          });

          xtermRef.current = xterm;
          fitAddonRef.current = fitAddon;
          
          // 窗口大小调整处理
          const handleWindowResize = () => {
            // 防抖处理
            if (handleWindowResize.timeout) {
              clearTimeout(handleWindowResize.timeout);
            }
            handleWindowResize.timeout = setTimeout(() => {
              if (fitAddonRef.current && terminalRef.current) {
                try {
                  if (terminalRef.current.offsetParent !== null &&
                      terminalRef.current.offsetWidth > 0) {
                    fitAddonRef.current.fit();
                  }
                } catch (e) {
                  // 静默处理
                }
              }
            }, 100);
          };

          window.addEventListener('resize', handleWindowResize);
          
          // 返回清理函数
          // 注意：这个函数会被保存在闭包中
          const cleanup = () => {
            window.removeEventListener('resize', handleWindowResize);
            if (handleWindowResize.timeout) {
              clearTimeout(handleWindowResize.timeout);
            }
            
            try {
              dataDisposable?.dispose();
              resizeDisposable?.dispose();
              xterm?.dispose();
            } catch (e) {
              console.error('Error disposing terminal:', e);
            }
            
            isInitializedRef.current = false;
            xtermRef.current = null;
            fitAddonRef.current = null;
          };
          
          // 将清理函数存储为引用
          cleanupFnRef.current = cleanup;
          
        } catch (e) {
          console.error('Error opening terminal:', e);
        }
      });
    });
    
    // 返回清理函数
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
      }
    };
  }, [isActive]); // 仅在激活时初始化

  // 连接状态变化时的处理
  useEffect(() => {
    if (xtermRef.current && isConnected) {
      // 连接成功后聚焦终端并重新fit
      setTimeout(() => {
        try {
          xtermRef.current?.focus();
          if (fitAddonRef.current && 
              terminalRef.current && 
              terminalRef.current.offsetWidth > 0) {
            fitAddonRef.current.fit();
          }
        } catch (e) {
          console.error('Error focusing terminal:', e);
        }
      }, 150);
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