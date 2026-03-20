# ============================================
#  OpenClaw 便携启动脚本 (PowerShell)
#  用法: .\run_openclaw.ps1 [命令参数]
#  示例: .\run_openclaw.ps1 --version
#        .\run_openclaw.ps1 doctor
#        .\run_openclaw.ps1 gateway run
# ============================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OpenClawDir = Join-Path $ScriptDir "openclaw"
$OpenClawEntry = Join-Path $OpenClawDir "openclaw.mjs"

# 检查 Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "[错误] 未找到 Node.js，请先安装 Node.js 22.16 或更高版本" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org/"
    exit 1
}

# 检查版本
$nodeVersion = (node -v).TrimStart('v')
$major, $minor = $nodeVersion.Split('.')[0..1]
if ([int]$major -lt 22 -or ([int]$major -eq 22 -and [int]$minor -lt 16)) {
    Write-Host "[警告] Node.js 版本 $nodeVersion 过低，建议 22.16 或更高版本" -ForegroundColor Yellow
}

# 检查 OpenClaw
if (-not (Test-Path $OpenClawEntry)) {
    Write-Host "[错误] 未找到 OpenClaw，请确认 openclaw 目录存在" -ForegroundColor Red
    exit 1
}

# 运行 OpenClaw
& node $OpenClawEntry @args
