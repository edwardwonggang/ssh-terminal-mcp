# SSH Terminal MCP

一个基于 Web 的终端应用，支持 SSH 远程连接和本地 Shell（PowerShell/CMD），并提供 MCP (Model Context Protocol) API 接口。

![Terminal MCP](https://img.shields.io/badge/status-active-success)
![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 特性

- 🖥️ **Web 终端界面** - 基于 xterm.js 的完整终端体验
- 🔐 **SSH 连接** - 支持远程服务器 SSH 连接
- 💻 **本地 Shell** - 支持 PowerShell 和 CMD
- 🎨 **Windows Terminal 主题** - Campbell 配色方案
- 📑 **多标签页** - 同时管理多个会话
- 🔌 **MCP API** - 提供 Model Context Protocol 接口
- 💾 **会话保存** - 保存常用的 SSH 连接配置
- ⚡ **PTY 支持** - 使用 node-pty 提供完整终端功能（TAB 补全、彩色输出等）

## 🚀 快速开始

### 前置要求

- Node.js >= 16.0.0
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/edwardwonggang/ssh-terminal-mcp.git
cd ssh-terminal-mcp

# 安装依赖
npm install

# 安装客户端依赖
cd client
npm install
cd ..
```

### 运行

#### 方式一：使用启动脚本（Windows）
```bash
# 双击运行
start.bat
```

#### 方式二：使用 npm 命令
```bash
# 开发模式（同时启动服务器和客户端）
npm run dev

# 或者分别启动
# 终端 1 - 后端服务器
npm run server

# 终端 2 - 前端客户端
cd client
npm run dev
```

应用将在以下地址启动：
- 前端：http://localhost:5173
- 后端：http://localhost:3000
- MCP API：http://localhost:3000/mcp

## 📖 使用指南

### 创建新会话

1. 点击 **"New Session"** 按钮
2. 选择会话类型：
   - **SSH** - 连接远程服务器
   - **PowerShell** - 本地 PowerShell
   - **CMD** - 本地命令提示符
3. 填写连接信息（SSH 需要）
4. 点击 **"Connect"**

### SSH 连接

```
Host: 服务器地址（如 192.168.1.100）
Port: SSH 端口（默认 22）
Username: 用户名
Password: 密码
```

## 🔌 MCP API

### 执行命令
```bash
POST http://localhost:3000/mcp/execute
Content-Type: application/json

{
  "sessionId": "会话ID",
  "command": "ls -la",
  "timeout": 30000
}
```

### 获取终端内容
```bash
POST http://localhost:3000/mcp/get-content
Content-Type: application/json

{
  "sessionId": "会话ID",
  "lines": 100
}
```

### 列出会话
```bash
GET http://localhost:3000/mcp/sessions
```

## 🛠️ 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web 框架
- **WebSocket (ws)** - 实时通信
- **node-pty** - PTY 终端支持
- **ssh2** - SSH 客户端

### 前端
- **React** - UI 框架
- **Vite** - 构建工具
- **xterm.js** - 终端模拟器

## 📁 项目结构

```
ssh-terminal-mcp/
├── server/                      # 后端服务器
│   ├── index.js                 # 主服务器文件
│   ├── ssh-manager.js           # SSH 连接管理
│   ├── local-shell-manager.js   # 本地终端管理
│   └── mcp-server.js            # MCP API 实现
├── client/                      # 前端应用
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   └── package.json
├── node_modules/                # 包含编译好的 node-pty
├── start.bat                    # Windows 启动脚本
└── package.json
```

## 📄 许可证

MIT License

---

⭐ 如果这个项目对你有帮助，请给个 Star！