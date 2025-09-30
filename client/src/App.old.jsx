import React, { useState, useRef, useEffect } from 'react';
import Terminal from './components/Terminal';
import ConnectionModal from './components/ConnectionModal';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const wsRef = useRef(null);
  const terminalRef = useRef(null);

  const handleConnect = (config) => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({
        type: 'connect',
        ...config
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          setIsConnected(true);
          setConnectionInfo(config);
          setShowModal(false);
          if (terminalRef.current) {
            terminalRef.current.write('\r\n✓ Connected to server\r\n\r\n');
          }
          break;
        
        case 'data':
          if (terminalRef.current) {
            terminalRef.current.write(data.data);
          }
          break;
        
        case 'disconnected':
          setIsConnected(false);
          setConnectionInfo(null);
          if (terminalRef.current) {
            terminalRef.current.write('\r\n✗ Disconnected from server\r\n');
          }
          break;
        
        case 'error':
          console.error('SSH Error:', data.message);
          if (terminalRef.current) {
            terminalRef.current.write(`\r\n✗ Error: ${data.message}\r\n`);
          }
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setConnectionInfo(null);
    };

    wsRef.current = ws;
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'disconnect' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionInfo(null);
  };

  const handleTerminalData = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'data',
        data
      }));
    }
  };

  const handleTerminalResize = (cols, rows) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="app-title">
            <div className="app-icon">🖥</div>
            SSH Terminal
          </div>
          {connectionInfo && (
            <span style={{ fontSize: '12px', color: '#969696' }}>
              {connectionInfo.username}@{connectionInfo.host}:{connectionInfo.port || 22}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <div className="status-indicator">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          {!isConnected ? (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              New Connection
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="terminal-container">
        <Terminal
          ref={terminalRef}
          onData={handleTerminalData}
          onResize={handleTerminalResize}
          isConnected={isConnected}
        />
      </div>

      {showModal && (
        <ConnectionModal
          onConnect={handleConnect}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default App;