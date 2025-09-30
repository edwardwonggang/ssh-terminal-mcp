# 项目升级指南

## 已完成的工作

### ✅ 后端改进
1. **多会话类型支持** - SSH、PowerShell、CMD
2. **本地Shell管理器** (`server/local-shell-manager.js`)
3. **配置持久化** - 会话保存和加载功能
4. **新的API端点**:
   - `GET /api/config` - 获取配置
   - `POST /api/config/save-session` - 保存会话配置
   - `DELETE /api/config/session/:name` - 删除保存的会话
   - `GET /api/sessions` - 获取活跃会话列表

### ✅ UI改进
1. **白色主题CSS** (`client/src/styles.css`) - 完整的WindTerm风格设计
2. **会话管理器** (`client/src/components-new/SessionManager.jsx`)

## 需要完成的工作

### 1. 创建新的React组件

创建以下文件在 `client/src/components-new/` 目录：

#### NewConnectionModal.jsx
```jsx
import React, { useState } from 'react';

export function NewConnectionModal({ onConnect, onClose, savedSessions, onLoadSession }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
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
    
    onConnect(config);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{showSaved ? 'Saved Sessions' : 'New Connection'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {showSaved ? (
            // 显示保存的会话列表
            <div className="saved-sessions">
              {savedSessions.map(session => (
                <div
                  key={session.name}
                  className="saved-session-item"
                  onClick={() => onLoadSession(session)}
                >
                  <div className="saved-session-info">
                    <div className="saved-session-name">{session.name}</div>
                    <div className="saved-session-details">
                      {session.sessionType === 'ssh' 
                        ? `${session.username}@${session.host}:${session.port}`
                        : session.sessionType.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn btn-primary" onClick={() => setShowSaved(false)}>
                Create New
              </button>
            </div>
          ) : (
            // 新建会话表单
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

              {session Type === 'ssh' && (
                <>
                  <div className="form-group">
                    <label>Connection Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="My Server"
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
                      />
                    </div>
                    <div className="form-group">
                      <label>Port *</label>
                      <input
                        type="text"
                        value={formData.port}
                        onChange={(e) => setFormData({...formData, port: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              <div className="modal-footer">
                <label className="save-config-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.saveConfig}
                    onChange={(e) => setFormData({...formData, saveConfig: e.target.checked})}
                  />
                  Save configuration
                </label>
                <div className="modal-actions">
                  {savedSessions.length > 0 && (
                    <button type="button" className="btn" onClick={() => setShowSaved(true)}>
                      Saved ({savedSessions.length})
                    </button>
                  )}
                  <button type="button" className="btn" onClick={onClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Connect</button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Sidebar.jsx
```jsx
import React from 'react';

export function Sidebar({ sessions, activeSessionId, onSessionSelect, onNewSession, collapsed, onToggle }) {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="app-logo">
            <div className="logo-icon">🖥</div>
            <span>Terminal MCP</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '☰' : '×'}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="sessions-section">
            <div className="section-title">Active Sessions</div>
            <ul className="session-list">
              {sessions.map(session => (
                <li
                  key={session.id}
                  className={`session-item ${session.id === activeSessionId ? 'active' : ''}`}
                  onClick={() => onSessionSelect(session.id)}
                >
                  <div className="session-icon">
                    {session.type === 'ssh' ? '🔐' : session.type === 'powershell' ? '⚡' : '📟'}
                  </div>
                  <div className="session-info">
                    <div className="session-name">{session.name}</div>
                    {session.config.host && (
                      <div className="session-detail">{session.config.host}</div>
                    )}
                  </div>
                  <div className={`session-status ${session.connected ? 'connected' : ''}`}></div>
                </li>
              ))}
            </ul>
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
```

#### 更新App.jsx
将旧的App.jsx重命名为App.old.jsx，创建新的App.jsx整合所有功能。

### 2. 测试步骤

1. 启动服务器: `npm run server`
2. 启动客户端: `npm run client`
3. 测试SSH连接
4. 测试PowerShell/CMD本地终端
5. 测试会话保存和加载
6. 测试多标签页切换

### 3. 遗留问题修复

#### 终端输入问题
确保SSH连接后xterm.js的onData事件正确绑定到WebSocket。

####  TAB补全
SSH服务器应该自动处理TAB键，确保：
1. SSH2配置正确设置了PTY模式
2. WebSocket正确传输所有键盘输入（包括特殊键）

#### 彩色渲染
xterm.js已支持ANSI颜色，确保：
1. SSH shell环境变量正确 (`TERM=xterm-256color`)
2. 服务器配置支持彩色输出

### 4. 下一步改进

- [ ] 添加SSH密钥认证
- [ ] 实现文件上传/下载（SFTP）
- [ ] 添加终端录制功能
- [ ] 实现命令历史记录搜索
- [ ] 添加多主题支持
- [ ] 实现拖放排序标签页
- [ ] 添加快捷键支持
- [ ] 实现终端分屏功能

## 快速完成建议

如果你想快速看到效果，可以：

1. 先将 `styles.css` 替换 `index.css`
2. 更新 `Terminal.jsx` 确保正确处理输入
3. 简化App.jsx只支持单会话SSH连接，验证基本功能
4. 逐步添加多会话、本地Shell等功能

需要我继续完成某个特定部分吗？