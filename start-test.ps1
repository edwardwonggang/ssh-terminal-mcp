# Terminal MCP 启动脚本

Write-Host "🚀 Starting Terminal MCP..." -ForegroundColor Cyan
Write-Host ""

# 检查Node.js
Write-Host "✓ Checking Node.js..." -ForegroundColor Green
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Installing dependencies if needed..." -ForegroundColor Yellow

# 检查后端依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..."
    npm install
}

# 检查前端依赖
if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing frontend dependencies..."
    Set-Location client
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "✓ Dependencies ready!" -ForegroundColor Green
Write-Host ""
Write-Host "🌟 Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "MCP API:  http://localhost:3000/mcp" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

# 启动服务
npm run dev