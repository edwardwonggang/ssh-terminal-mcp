import React, { useState } from 'react';

function ConnectionModal({ onConnect, onClose }) {
  const [formData, setFormData] = useState({
    host: '',
    port: '22',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证表单
    if (!formData.host) {
      setError('Please enter a host');
      return;
    }
    if (!formData.username) {
      setError('Please enter a username');
      return;
    }
    if (!formData.password) {
      setError('Please enter a password');
      return;
    }

    const port = parseInt(formData.port);
    if (isNaN(port) || port < 1 || port > 65535) {
      setError('Please enter a valid port number (1-65535)');
      return;
    }

    setIsConnecting(true);
    
    try {
      onConnect({
        host: formData.host,
        port: port,
        username: formData.username,
        password: formData.password
      });
    } catch (err) {
      setError(err.message);
      setIsConnecting(false);
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
          <h2>SSH Connection</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="host">Host *</label>
              <input
                type="text"
                id="host"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="192.168.1.100 or example.com"
                autoFocus
                disabled={isConnecting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port *</label>
              <input
                type="text"
                id="port"
                name="port"
                value={formData.port}
                onChange={handleChange}
                placeholder="22"
                disabled={isConnecting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="root"
              disabled={isConnecting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isConnecting}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
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
        </form>
      </div>
    </div>
  );
}

export default ConnectionModal;