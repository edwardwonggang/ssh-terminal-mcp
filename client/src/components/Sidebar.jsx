import React from 'react';

export function Sidebar({ sessions, activeSessionId, onSessionSelect, onNewSession, collapsed, onToggle }) {
  const getSessionIcon = (type) => {
    switch (type) {
      case 'ssh':
        return '🔐';
      case 'powershell':
        return '⚡';
      case 'cmd':
        return '📟';
      default:
        return '🖥';
    }
  };

  const getSessionDisplayName = (session) => {
    if (session.name) return session.name;
    
    if (session.type === 'ssh' && session.config.host) {
      return `${session.config.username || 'user'}@${session.config.host}`;
    }
    
    return `${session.type.toUpperCase()} - ${new Date(parseInt(session.id)).toLocaleTimeString()}`;
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="app-logo">
            <div className="logo-icon">🖥</div>
            <span>Terminal MCP</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '☰' : '×'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="sessions-section">
            <div className="section-title">Active Sessions ({sessions.length})</div>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active sessions
              </div>
            ) : (
              <ul className="session-list">
                {sessions.map(session => (
                  <li
                    key={session.id}
                    className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                    onClick={() => onSessionSelect(session.id)}
                    title={getSessionDisplayName(session)}
                  >
                    <div className="session-icon">
                      {getSessionIcon(session.type)}
                    </div>
                    <div className="session-info">
                      <div className="session-name">
                        {getSessionDisplayName(session)}
                      </div>
                      {session.type === 'ssh' && session.config.host && (
                        <div className="session-detail">
                          {session.config.host}:{session.config.port || 22}
                        </div>
                      )}
                    </div>
                    <div className={`session-status ${session.connected ? 'connected' : ''}`}></div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button className="new-session-btn" onClick={onNewSession}>
            <span>+</span>
            <span>New Session</span>
          </button>
        </>
      )}
    </div>
  );
}