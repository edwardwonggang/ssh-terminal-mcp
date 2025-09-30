import { useState, useEffect } from 'react';

export function useSessionManager() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);

  // 加载保存的会话配置
  useEffect(() => {
    fetch('http://localhost:3000/api/config')
      .then(res => res.json())
      .then(config => {
        setSavedSessions(config.savedSessions || []);
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const createSession = (config, ws) => {
    const newSession = {
      id: Date.now().toString(),
      type: config.sessionType || 'ssh',
      name: config.name || `${config.sessionType || 'ssh'} - ${new Date().toLocaleTimeString()}`,
      config,
      ws,
      connected: false
    };
    
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession;
  };

  const updateSession = (id, updates) => {
    setSessions(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ));
  };

  const removeSession = (id) => {
    const session = sessions.find(s => s.id === id);
    if (session?.ws) {
      session.ws.close();
    }
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const getActiveSession = () => {
    return sessions.find(s => s.id === activeSessionId);
  };

  const saveSessionConfig = async (config) => {
    try {
      const response = await fetch('http://localhost:3000/api/config/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const result = await response.json();
      setSavedSessions(result.config.savedSessions);
      return result;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  };

  const deleteSavedSession = async (name) => {
    try {
      const response = await fetch(`http://localhost:3000/api/config/session/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      setSavedSessions(result.config.savedSessions);
      return result;
    } catch (error) {
      console.error('Failed to delete session:', error);
      throw error;
    }
  };

  return {
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
  };
}