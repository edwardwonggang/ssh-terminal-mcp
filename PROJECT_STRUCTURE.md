# 项目结构

```
ssh-terminal-mcp/
├── .gitignore                  # Git 忽略文件配置
├── package.json                # 后端依赖配置
├── package-lock.json           # 锁定后端依赖版本
├── README.md                   # 项目说明文档
├── STATUS.md                   # 项目当前状态
├── PROJECT_STRUCTURE.md        # 本文件
├── start.bat                   # Windows 启动脚本
│
├── server/                     # 后端服务器代码
│   ├── index.js                # Express 服务器入口
│   ├── ssh-manager.js          # SSH 连接管理
│   ├── local-shell-manager.js  # 本地 Shell 管理（使用 node-pty）
│   └── mcp-server.js           # MCP 协议 API 实现
│
├── client/                     # 前端应用
│   ├── index.html              # HTML 入口
│   ├── package.json            # 前端依赖配置
│   ├── package-lock.json       # 锁定前端依赖版本
│   ├── vite.config.js          # Vite 构建配置
│   │
│   └── src/                    # 源代码
│       ├── main.jsx            # React 入口
│       ├── App.jsx             # 主应用组件
│       ├── styles.css          # 全局样式
│       │
│       └── components/         # React 组件
│           ├── TerminalPanel.jsx        # 终端面板组件
│           ├── Sidebar.jsx              # 侧边栏组件
│           ├── NewConnectionModal.jsx   # 新建连接对话框
│           └── SessionManager.jsx       # 会话管理 Hook
│
├── node_modules/               # Node.js 依赖包
│   └── node-pty/              # 包含编译好的 PTY 支持
│       ├── build/             # 编译的二进制文件
│       │   └── Release/
│       │       ├── conpty.node
│       │       ├── pty.node
│       │       ├── winpty.dll
│       │       └── winpty-agent.exe
│       ├── lib/               # JavaScript 库文件
│       └── package.json
│
└── data/                      # 数据存储目录
    └── config.json            # 保存的会话配置
```

## 核心文件说明

### 后端 (server/)

- **index.js** - 主服务器文件
  - 创建 Express 服务器和 WebSocket 服务器
  - 处理 HTTP API 路由
  - 管理 WebSocket 连接和会话

- **ssh-manager.js** - SSH 连接管理
  - 使用 ssh2 库
  - 处理 SSH 连接、认证、数据传输
  - 管理终端缓冲区

- **local-shell-manager.js** - 本地 Shell 管理
  - 使用 node-pty 创建 PTY
  - 支持 PowerShell 和 CMD
  - 提供完整的终端功能（TAB 补全、彩色输出等）

- **mcp-server.js** - MCP API 实现
  - 执行命令
  - 获取终端内容
  - 列出会话

### 前端 (client/src/)

- **main.jsx** - React 应用入口点

- **App.jsx** - 主应用组件
  - 管理应用状态
  - 处理 WebSocket 连接
  - 协调各个子组件

- **components/TerminalPanel.jsx** - 终端显示组件
  - 集成 xterm.js
  - 处理终端输入输出
  - 支持终端插件（fit, web-links, search, serialize）

- **components/Sidebar.jsx** - 侧边栏组件
  - 显示会话列表
  - 会话切换
  - 保存的配置管理

- **components/NewConnectionModal.jsx** - 连接对话框
  - 创建新的 SSH/PowerShell/CMD 连接
  - 加载保存的配置
  - 表单验证

- **components/SessionManager.jsx** - 会话管理 Hook
  - 会话创建、更新、删除
  - 配置保存和加载
  - 状态管理

## 依赖说明

### 后端依赖
- **express** - Web 框架
- **ws** - WebSocket 实现
- **ssh2** - SSH 客户端
- **node-pty** - PTY 终端支持
- **cors** - 跨域支持
- **uuid** - 唯一 ID 生成

### 前端依赖
- **react** - UI 框架
- **react-dom** - React DOM 渲染
- **vite** - 构建工具
- **@xterm/xterm** - 终端模拟器
- **@xterm/addon-fit** - 终端自适应插件
- **@xterm/addon-web-links** - 链接识别插件
- **@xterm/addon-search** - 搜索功能插件
- **@xterm/addon-serialize** - 序列化插件

## 端口配置

- **后端服务器**: http://localhost:3000
- **前端开发服务器**: http://localhost:5173
- **WebSocket**: ws://localhost:3000

## 数据流

```
用户浏览器 (http://localhost:5173)
    ↓
React 前端 (Vite Dev Server)
    ↓
WebSocket 连接 (ws://localhost:3000)
    ↓
Express 后端 (http://localhost:3000)
    ↓
    ├─→ SSH Manager (远程服务器)
    └─→ Local Shell Manager (本地 PowerShell/CMD via node-pty)
```

## 构建和部署

### 开发模式
```bash
npm run dev  # 同时启动后端和前端
```

### 生产构建
```bash
# 构建前端
cd client
npm run build

# 部署时只需要：
# - server/ 目录
# - node_modules/ 目录（包含 node-pty）
# - client/dist/ 目录（构建后的前端）
# - package.json
```