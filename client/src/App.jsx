import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { NewConnectionModal } from './components/NewConnectionModal';
import TerminalPanel from './components/TerminalPanel';
import { useSessionManager } from './components/SessionManager';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const terminalRefs = useRef({});
  
  const {
    sessions,
    activeSessionId,
    savedSessions,
    createSession,
    updateSession,
    removeSession,
    getActiveSession,
    setActiveSessionId,
    saveSessionConfig,
    deleteSavedSession
  } = useSessionManager();

  const activeSession = getActiveSession();

  const handleConnect = async (config) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket('ws://localhost:3000');
      let currentSession = null;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        
        // 发送连接请求
        ws.send(JSON.stringify({
          type: 'connect',
          ...config
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            {
              currentSession = createSession(config, ws);
              updateSession(currentSession.id, { connected: true });
              setShowModal(false);
              
              // 如果配置要求保存
              if (config.saveConfig && config.sessionType === 'ssh') {
                try {
                  await saveSessionConfig({
                    name: config.name || `${config.username}@${config.host}`,
                    sessionType: config.sessionType,
                    host: config.host,
                    port: config.port,
                    username: config.username
                  });
                } catch (err) {
                  console.error('Failed to save session config:', err);
                }
              }
              
              resolve();
              break;
            }
          
          case 'data':
            {
              // 使用闭包中的currentSession
              if (currentSession) {
                const termRef = terminalRefs.current[currentSession.id];
                if (termRef) {
                  termRef.write(data.data);
                }
              }
              break;
            }
          
          case 'disconnected':
            {
              if (currentSession) {
                updateSession(currentSession.id, { connected: false });
                const termRef = terminalRefs.current[currentSession.id];
                if (termRef) {
                  termRef.write('\r\n\x1b[31m✗ Disconnected from server\x1b[0m\r\n');
                }
              }
              break;
            }
          
          case 'error':
            console.error('Server Error:', data.message);
            if (currentSession) {
              const termRef = terminalRefs.current[currentSession.id];
              if (termRef) {
                termRef.write(`\r\n\x1b[31m✗ Error: ${data.message}\x1b[0m\r\n`);
              }
            }
            reject(new Error(data.message));
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(new Error('WebSocket connection failed'));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        if (currentSession) {
          updateSession(currentSession.id, { connected: false });
        }
      };
    });
  };

  const getSessionById = (id) => {
    return sessions.find(s => s.id === id);
  };

  const handleTerminalData = (sessionId, data) => {
    const session = getSessionById(sessionId);
    if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({
        type: 'data',
        data
      }));
    }
  };

  const handleTerminalResize = (sessionId, cols, rows) => {
    const session = getSessionById(sessionId);
    if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({
        type: 'resize',
        cols,
        rows
      }));
    }
  };

  const handleCloseSession = (sessionId) => {
    if (window.confirm('Close this session?')) {
      const session = getSessionById(sessionId);
      if (session && session.ws) {
        session.ws.send(JSON.stringify({ type: 'disconnect' }));
        session.ws.close();
      }
      delete terminalRefs.current[sessionId];
      removeSession(sessionId);
    }
  };

  const handleLoadSession = (savedSession) => {
    handleConnect(savedSession);
  };

  useEffect(() => {
    // 清理所有WebSocket连接
    return () => {
      sessions.forEach(session => {
        if (session.ws) {
          session.ws.close();
        }
      });
    };
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewSession={() => setShowModal(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="main-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="session-tabs">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`tab ${session.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <span className="tab-label">
                    {session.name || `${session.type} - ${new Date(parseInt(session.id)).toLocaleTimeString()}`}
                  </span>
                  <button
                    className="tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseSession(session.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="toolbar-right">
            {activeSession && activeSession.connected && (
              <span style={{ fontSize: '12px', color: 'var(--success-green)', marginRight: '12px' }}>
                ● Connected
              </span>
            )}
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + New
            </button>
          </div>
        </div>

        <div className="terminal-container">
          {sessions.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🖥️</div>
              <h2>Welcome to Terminal MCP</h2>
              <p>Create a new session to get started</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                Create New Session
              </button>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                style={{
                  display: session.id === activeSessionId ? 'flex' : 'none',
                  flex: 1,
                  flexDirection: 'column'
                }}
              >
                <TerminalPanel
                  ref={(ref) => {
                    if (ref) {
                      terminalRefs.current[session.id] = ref;
                    }
                  }}
                  onData={(data) => handleTerminalData(session.id, data)}
                  onResize={(cols, rows) => handleTerminalResize(session.id, cols, rows)}
                  isConnected={session.connected}
                  sessionType={session.type}
                  isActive={session.id === activeSessionId}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <NewConnectionModal
          onConnect={handleConnect}
          onClose={() => setShowModal(false)}
          savedSessions={savedSessions}
          onLoadSession={handleLoadSession}
          onDeleteSession={deleteSavedSession}
        />
      )}
    </div>
  );
}

export default App;