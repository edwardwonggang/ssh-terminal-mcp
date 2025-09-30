import React, { useState } from 'react';

export function NewConnectionModal({ onConnect, onClose, savedSessions, onLoadSession, onDeleteSession }) {
  const [sessionType, setSessionType] = useState('ssh');
  const [showSaved, setShowSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    password: '',
    saveConfig: false
  });
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (sessionType === 'ssh') {
      if (!formData.host || !formData.username || !formData.password) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    const config = {
      ...formData,
      sessionType,
      port: sessionType === 'ssh' ? parseInt(formData.port) : undefined
    };
    
    setIsConnecting(true);
    try {
      await onConnect(config);
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
    }
  };

  const handleLoadSession = (session) => {
    setFormData({
      name: session.name || '',
      host: session.host || '',
      port: session.port?.toString() || '22',
      username: session.username || '',
      password: '',
      saveConfig: false
    });
    setSessionType(session.sessionType || 'ssh');
    setShowSaved(false);
  };

  const handleDeleteSession = async (e, sessionName) => {
    e.stopPropagation();
    if (window.confirm(`Delete saved session "${sessionName}"?`)) {
      try {
        await onDeleteSession(sessionName);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>{showSaved ? 'Saved Sessions' : 'New Connection'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {showSaved ? (
            <div className="saved-sessions">
              {savedSessions.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No saved sessions yet
                </p>
              ) : (
                savedSessions.map(session => (
                  <div
                    key={session.name}
                    className="saved-session-item"
                    onClick={() => handleLoadSession(session)}
                  >
                    <div className="saved-session-info">
                      <div className="saved-session-name">{session.name}</div>
                      <div className="saved-session-details">
                        {session.sessionType === 'ssh' 
                          ? `${session.username}@${session.host}:${session.port}`
                          : session.sessionType.toUpperCase()}
                      </div>
                    </div>
                    <div className="saved-session-actions">
                      <button
                        className="btn btn-small btn-danger"
                        onClick={(e) => handleDeleteSession(e, session.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
              <button className="btn btn-primary" onClick={() => setShowSaved(false)} style={{ marginTop: '16px', width: '100%' }}>
                Create New Connection
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="session-type-selector">
                <div
                  className={`type-option ${sessionType === 'ssh' ? 'selected' : ''}`}
                  onClick={() => setSessionType('ssh')}
                >
                  <div className="type-icon">🔐</div>
                  <div className="type-label">SSH</div>
                </div>
                <div
                  className={`type-option ${sessionType === 'powershell' ? 'selected' : ''}`}
                  onClick={() => setSessionType('powershell')}
                >
                  <div className="type-icon">⚡</div>
                  <div className="type-label">PowerShell</div>
                </div>
                <div
                  className={`type-option ${sessionType === 'cmd' ? 'selected' : ''}`}
                  onClick={() => setSessionType('cmd')}
                >
                  <div className="type-icon">📟</div>
                  <div className="type-label">CMD</div>
                </div>
              </div>

              {sessionType === 'ssh' && (
                <>
                  <div className="form-group">
                    <label>Connection Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="My Server (optional)"
                      disabled={isConnecting}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Host *</label>
                      <input
                        type="text"
                        value={formData.host}
                        onChange={(e) => setFormData({...formData, host: e.target.value})}
                        placeholder="192.168.1.100"
                        required
                        disabled={isConnecting}
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label>Port *</label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => setFormData({...formData, port: e.target.value})}
                        required
                        disabled={isConnecting}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="root"
                      required
                      disabled={isConnecting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      required
                      disabled={isConnecting}
                    />
                  </div>
                </>
              )}

              {sessionType === 'powershell' && (
                <div className="form-group">
                  <label>Session Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="PowerShell Session"
                    disabled={isConnecting}
                  />
                </div>
              )}

              {sessionType === 'cmd' && (
                <div className="form-group">
                  <label>Session Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="CMD Session"
                    disabled={isConnecting}
                  />
                </div>
              )}

              <div className="modal-footer">
                <label className="save-config-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.saveConfig}
                    onChange={(e) => setFormData({...formData, saveConfig: e.target.checked})}
                    disabled={isConnecting || sessionType !== 'ssh'}
                  />
                  <span>Save configuration</span>
                </label>
                <div className="modal-actions">
                  {savedSessions.length > 0 && (
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => setShowSaved(true)}
                      disabled={isConnecting}
                    >
                      Saved ({savedSessions.length})
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={onClose}
                    disabled={isConnecting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}