# 调试指南

## 当前修复的问题

### 1. xterm.js dimensions错误
**问题**: `Cannot read properties of undefined (reading 'dimensions')`
**修复**: 
- 添加了DOM准备检查
- 使用多次延迟fit确保元素已渲染
- 添加offsetParent检查

### 2. 会话管理问题
**问题**: WebSocket数据无法找到对应会话
**修复**:
- 使用闭包存储currentSession
- 避免依赖外部sessions数组查找

### 3. 终端重复创建
**问题**: useEffect重复触发导致多个终端实例
**修复**:
- 添加xtermRef.current检查防止重复创建
- 移除sessionType依赖，只创建一次

## 测试步骤

### 测试SSH连接
1. 启动服务: `npm run dev`
2. 打开浏览器: http://localhost:5173
3. 点击"New Session"
4. 选择SSH，输入连接信息
5. 验证：
   - ✓ 终端显示正常
   - ✓ 可以输入命令
   - ✓ TAB补全工作
   - ✓ 彩色输出正常

### 测试PowerShell
1. 点击"New Session"
2. 选择PowerShell
3. 点击Connect
4. 验证：
   - ✓ 立即显示PowerShell提示符
   - ✓ 可以执行命令（如`Get-Date`）
   - ✓ 输出显示正常

### 测试CMD
1. 点击"New Session"
2. 选择CMD  
3. 点击Connect
4. 验证：
   - ✓ 显示CMD提示符
   - ✓ 可以执行命令（如`dir`）
   - ✓ 输出显示正常

### 测试多会话
1. 创建2-3个不同类型的会话
2. 在标签页之间切换
3. 验证：
   - ✓ 每个会话独立工作
   - ✓ 切换无延迟
   - ✓ 数据不混淆

## 常见错误和解决方案

### 错误1: "dimensions" TypeError
**原因**: DOM元素未完全渲染
**解决**: 已修复，使用延迟fit和元素检查

### 错误2: WebSocket立即断开
**原因**: 服务器连接失败或立即关闭
**检查**:
```bash
# 确保服务器运行
curl http://localhost:3000/health
```

### 错误3: 无法输入
**原因**: isConnected状态未正确更新
**检查**: 控制台中session.connected应为true

### 错误4: 终端显示空白
**原因**: xterm未正确初始化
**检查**: F12查看是否有JavaScript错误

## 日志检查

### 后端日志应显示：
```
Server running on port 3000
WebSocket server ready
Client connected
SSH connection established (或 Shell process 对于本地shell)
```

### 前端控制台应显示：
```
WebSocket connected
（无错误信息）
```

## 性能优化

### 如果遇到延迟：
1. 减少终端scrollback: 在TerminalPanel.jsx中设置更小的值
2. 限制输出: 对于大量输出使用`| head`或`more`
3. 检查网络: 确保本地连接稳定

## 快速重启

```powershell
# 停止当前服务 (Ctrl+C)
# 清理node进程
taskkill /F /IM node.exe

# 重新启动
npm run dev
```

## 清理缓存

```powershell
# 清理前端缓存
Remove-Item -Recurse -Force client/node_modules/.vite

# 重启
npm run dev
```

## 检查配置文件

配置文件位置: `data/config.json`
```json
{
  "savedSessions": [
    {
      "name": "My Server",
      "sessionType": "ssh",
      "host": "192.168.1.100",
      "port": 22,
      "username": "user"
    }
  ]
}
```

## 浏览器兼容性

推荐使用：
- Chrome/Edge (推荐)
- Firefox
- Safari

不支持：
- IE11及更早版本

## 获取更多帮助

1. 查看控制台错误
2. 查看服务器日志
3. 查看Network标签中的WebSocket连接
4. 检查data/config.json格式是否正确