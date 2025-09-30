import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { SSHManager } from './ssh-manager.js';
import { LocalShellManager } from './local-shell-manager.js';
import { MCPServer } from './mcp-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 中间件
app.use(cors());
app.use(express.json());

// 存储所有的会话
const sessions = new Map();

// 配置存储路径
const DATA_DIR = path.join(__dirname, '..', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 加载保存的配置
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return { savedSessions: [] };
}

// 保存配置
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

// WebSocket连接处理
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let sessionManager = null;
  let sessionId = null;
  let sessionType = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'connect':
          // SSH连接
          const { host, port, username, password } = data;
          await sshManager.connect({
            host,
            port: port || 22,
            username,
            password
          }, (data) => {
            // 将SSH输出发送到客户端
            ws.send(JSON.stringify({ type: 'data', data: data.toString() }));
          });
          ws.send(JSON.stringify({ type: 'connected' }));
          break;

        case 'data':
          // 执行命令
          if (sshManager.isConnected()) {
            sshManager.write(data.data);
          }
          break;

        case 'resize':
          // 调整终端大小
          if (sshManager.isConnected()) {
            sshManager.resize(data.cols, data.rows);
          }
          break;

        case 'disconnect':
          // 断开连接
          sshManager.disconnect();
          ws.send(JSON.stringify({ type: 'disconnected' }));
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', message: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    sshManager.disconnect();
    sshSessions.delete(sessionId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// MCP协议服务器
const mcpServer = new MCPServer(sshSessions);

// MCP API路由
app.post('/mcp/execute', async (req, res) => {
  try {
    const { sessionId, command, timeout } = req.body;
    const result = await mcpServer.executeCommand(sessionId, command, timeout);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/mcp/get-content', async (req, res) => {
  try {
    const { sessionId, lines } = req.body;
    const result = await mcpServer.getTerminalContent(sessionId, lines);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/mcp/sessions', (req, res) => {
  const sessions = Array.from(sshSessions.keys());
  res.json({ sessions });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  console.log(`MCP API available at http://localhost:${PORT}/mcp`);
});