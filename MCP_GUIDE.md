# MCP协议使用指南

本文档详细说明如何通过MCP（Model Context Protocol）协议与SSH终端进行交互。

## 概述

MCP协议提供了一套标准化的API接口，允许外部应用程序通过HTTP请求与SSH终端会话进行交互。

## 基础URL

```
http://localhost:3000/mcp
```

## 认证

当前版本未实现认证机制。在生产环境中，应该添加适当的认证和授权。

## API端点

### 1. 执行命令

在指定的SSH会话中执行命令。

**端点:** `POST /mcp/execute`

**请求头:**
```
Content-Type: application/json
```

**请求体:**
```json
{
  "sessionId": "string",     // 必需：SSH会话ID
  "command": "string",       // 必需：要执行的命令
  "timeout": number          // 可选：超时时间（毫秒），默认30000
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "sessionId": "1234567890",
  "command": "ls -la /home",
  "exitCode": 0,
  "output": "total 48\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\ndrwxr-xr-x 3 root root 4096 Jan 1 12:00 ..\n",
  "timestamp": "2025-09-30T10:39:08.123Z"
}
```

**错误响应 (200):**
```json
{
  "success": false,
  "sessionId": "1234567890",
  "command": "invalid-command",
  "error": "Command execution timeout",
  "timestamp": "2025-09-30T10:39:08.123Z"
}
```

**错误响应 (500):**
```json
{
  "error": "Session 1234567890 not found"
}
```

**示例:**

```bash
# 使用curl
curl -X POST http://localhost:3000/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "1234567890",
    "command": "pwd",
    "timeout": 5000
  }'

# 使用Python
import requests
import json

response = requests.post(
    'http://localhost:3000/mcp/execute',
    json={
        'sessionId': '1234567890',
        'command': 'uname -a',
        'timeout': 10000
    }
)
result = response.json()
print(result['output'])

# 使用JavaScript/Node.js
const response = await fetch('http://localhost:3000/mcp/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: '1234567890',
    command: 'df -h',
    timeout: 15000
  })
});
const result = await response.json();
console.log(result.output);
```

---

### 2. 获取终端内容

获取SSH会话的终端缓冲区内容。

**端点:** `POST /mcp/get-content`

**请求头:**
```
Content-Type: application/json
```

**请求体:**
```json
{
  "sessionId": "string",     // 必需：SSH会话ID
  "lines": number            // 可选：获取的行数，默认100
}
```

**成功响应 (200):**
```json
{
  "success": true,
  "sessionId": "1234567890",
  "lines": 100,
  "content": "Welcome to Ubuntu 22.04 LTS\nLast login: ...\nuser@host:~$ ls\nfile1.txt  file2.txt\nuser@host:~$ ",
  "timestamp": "2025-09-30T10:39:08.123Z"
}
```

**错误响应 (200):**
```json
{
  "success": false,
  "sessionId": "1234567890",
  "error": "Failed to retrieve content",
  "timestamp": "2025-09-30T10:39:08.123Z"
}
```

**错误响应 (500):**
```json
{
  "error": "Session 1234567890 not found"
}
```

**示例:**

```bash
# 使用curl - 获取最近50行
curl -X POST http://localhost:3000/mcp/get-content \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "1234567890",
    "lines": 50
  }'

# 使用Python
import requests

response = requests.post(
    'http://localhost:3000/mcp/get-content',
    json={
        'sessionId': '1234567890',
        'lines': 200
    }
)
result = response.json()
if result['success']:
    print(result['content'])

# 使用JavaScript/Node.js
const response = await fetch('http://localhost:3000/mcp/get-content', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: '1234567890',
    lines: 150
  })
});
const result = await response.json();
if (result.success) {
  console.log(result.content);
}
```

---

### 3. 列出会话

获取所有活跃的SSH会话列表。

**端点:** `GET /mcp/sessions`

**请求头:** 无需特殊请求头

**响应 (200):**
```json
{
  "sessions": [
    "1234567890",
    "1234567891",
    "1234567892"
  ]
}
```

**示例:**

```bash
# 使用curl
curl http://localhost:3000/mcp/sessions

# 使用Python
import requests

response = requests.get('http://localhost:3000/mcp/sessions')
sessions = response.json()['sessions']
print(f"Active sessions: {len(sessions)}")
for session_id in sessions:
    print(f"  - {session_id}")

# 使用JavaScript/Node.js
const response = await fetch('http://localhost:3000/mcp/sessions');
const { sessions } = await response.json();
console.log(`Active sessions: ${sessions.length}`);
sessions.forEach(id => console.log(`  - ${id}`));
```

---

## 会话管理

### 获取会话ID

会话ID在WebSocket连接建立时由服务器生成。要获取会话ID：

1. **通过浏览器开发者工具**
   - 打开浏览器控制台
   - 查看Network标签中的WebSocket连接
   - 会话ID会在控制台日志中显示

2. **通过API查询**
   ```bash
   curl http://localhost:3000/mcp/sessions
   ```

3. **在应用中显示**
   - 可以修改前端代码，在UI中显示当前会话ID

### 会话生命周期

- **创建:** 当WebSocket连接建立时
- **活跃:** 当SSH连接成功建立后
- **销毁:** 当WebSocket连接关闭或SSH连接断开时

## 使用场景

### 1. 自动化脚本执行

```python
import requests
import time

def execute_ssh_command(session_id, command):
    response = requests.post(
        'http://localhost:3000/mcp/execute',
        json={'sessionId': session_id, 'command': command}
    )
    return response.json()

# 获取会话列表
sessions = requests.get('http://localhost:3000/mcp/sessions').json()['sessions']
if sessions:
    session_id = sessions[0]
    
    # 执行一系列命令
    commands = [
        'cd /var/log',
        'ls -lh',
        'tail -n 20 syslog'
    ]
    
    for cmd in commands:
        result = execute_ssh_command(session_id, cmd)
        print(f"Command: {cmd}")
        print(f"Output: {result['output']}\n")
        time.sleep(1)
```

### 2. 监控和日志收集

```python
import requests
import time

def monitor_terminal(session_id, interval=5):
    """每隔指定时间获取终端内容"""
    while True:
        response = requests.post(
            'http://localhost:3000/mcp/get-content',
            json={'sessionId': session_id, 'lines': 50}
        )
        result = response.json()
        if result['success']:
            print(f"=== Terminal Content at {result['timestamp']} ===")
            print(result['content'])
            print("=" * 60)
        time.sleep(interval)

# 使用示例
sessions = requests.get('http://localhost:3000/mcp/sessions').json()['sessions']
if sessions:
    monitor_terminal(sessions[0], interval=10)
```

### 3. 集成到CI/CD流程

```javascript
// Node.js示例
const fetch = require('node-fetch');

async function deployToServer(sessionId, appPath) {
  const commands = [
    'cd ' + appPath,
    'git pull origin main',
    'npm install',
    'npm run build',
    'pm2 restart app'
  ];

  for (const command of commands) {
    console.log(`Executing: ${command}`);
    const response = await fetch('http://localhost:3000/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, command, timeout: 60000 })
    });
    
    const result = await response.json();
    if (!result.success || result.exitCode !== 0) {
      console.error(`Command failed: ${command}`);
      console.error(result.output);
      process.exit(1);
    }
    console.log(result.output);
  }
  
  console.log('Deployment completed successfully!');
}
```

## 错误处理

### 常见错误

1. **Session not found**
   - 原因：会话ID不存在或已过期
   - 解决：检查会话列表，使用有效的会话ID

2. **Not connected to SSH server**
   - 原因：SSH连接未建立或已断开
   - 解决：确保SSH连接处于活跃状态

3. **Command execution timeout**
   - 原因：命令执行时间超过设定的超时时间
   - 解决：增加timeout参数值或优化命令

### 错误处理示例

```python
import requests

def safe_execute(session_id, command, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(
                'http://localhost:3000/mcp/execute',
                json={'sessionId': session_id, 'command': command},
                timeout=30
            )
            result = response.json()
            
            if result.get('success'):
                return result
            else:
                print(f"Attempt {attempt + 1} failed: {result.get('error')}")
                
        except requests.exceptions.Timeout:
            print(f"Attempt {attempt + 1} timed out")
        except Exception as e:
            print(f"Attempt {attempt + 1} error: {str(e)}")
    
    return None
```

## 最佳实践

1. **超时设置**
   - 为长时间运行的命令设置合适的超时值
   - 默认30秒可能不够，根据需要调整

2. **会话管理**
   - 定期检查会话列表
   - 处理会话断开的情况
   - 不要硬编码会话ID

3. **错误处理**
   - 始终检查响应的success字段
   - 实现重试机制
   - 记录错误日志

4. **安全性**
   - 不要在日志中记录敏感信息
   - 在生产环境中添加认证
   - 限制命令执行权限

5. **性能优化**
   - 批量执行命令时添加适当延迟
   - 合理设置获取内容的行数
   - 避免频繁轮询

## 扩展开发

如需添加新的MCP工具，请在 `server/mcp-server.js` 中：

1. 在 `defineTools()` 方法中添加工具定义
2. 实现对应的处理方法
3. 在 `server/index.js` 中添加API路由

示例：
```javascript
// 在mcp-server.js中添加新工具
{
  name: 'get_system_info',
  description: 'Get system information',
  inputSchema: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: 'The SSH session ID'
      }
    },
    required: ['sessionId']
  }
}

// 实现方法
async getSystemInfo(sessionId) {
  const commands = ['uname -a', 'uptime', 'free -h'];
  const results = {};
  
  for (const cmd of commands) {
    const result = await this.executeCommand(sessionId, cmd);
    results[cmd] = result.output;
  }
  
  return results;
}
```

## 支持

如有问题或建议，请提交Issue或Pull Request。