# 启动 Docker Compose（演示/内网部署），等待就绪后跑全量 US 矩阵测试。
# 用法:
#   .\scripts\run-us-tests.ps1                    # 直连后端 http://127.0.0.1:8000
#   .\scripts\run-us-tests.ps1 -ThroughNginx     # 经前端 Nginx http://127.0.0.1:3000
#   .\scripts\run-us-tests.ps1 -Fresh            # docker compose down -v 后重建（干净库）
param(
    [switch]$ThroughNginx,
    [switch]$Fresh
)

$ErrorActionPreference = "Stop"
# scripts/ 的上级为项目根目录 xijiu/
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root
if (-not (Test-Path (Join-Path $Root "docker-compose.yml"))) {
    Write-Error "未找到 docker-compose.yml，请从 xijiu 仓库根目录运行脚本。"
    exit 1
}

if ($Fresh) {
    Write-Host ">>> docker compose down -v"
    docker compose down -v 2>$null
}

Write-Host ">>> docker compose up -d --build"
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$backend = "http://127.0.0.1:8000/health"
$nginx = "http://127.0.0.1:3000/health"
$deadline = (Get-Date).AddMinutes(5)

Write-Host ">>> 等待后端就绪: $backend"
while ((Get-Date) -lt $deadline) {
    try {
        $r = Invoke-WebRequest -Uri $backend -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { Write-Host ">>> 后端已就绪"; break }
    } catch { }
    Start-Sleep -Seconds 2
}
try {
    $r = Invoke-WebRequest -Uri $backend -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -ne 200) { throw "backend not ready" }
} catch {
    Write-Error "后端在 5 分钟内未就绪，请检查: docker compose logs backend"
    exit 1
}

if ($ThroughNginx) {
    Write-Host ">>> 等待 Nginx 就绪: $nginx"
    $deadline2 = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $deadline2) {
        try {
            $r2 = Invoke-WebRequest -Uri $nginx -UseBasicParsing -TimeoutSec 3
            if ($r2.StatusCode -eq 200) { Write-Host ">>> Nginx 已就绪"; break }
        } catch { }
        Start-Sleep -Seconds 2
    }
    try {
        $r2 = Invoke-WebRequest -Uri $nginx -UseBasicParsing -TimeoutSec 3
        if ($r2.StatusCode -ne 200) { throw "nginx not ready" }
    } catch {
        Write-Error "Nginx 未就绪，请检查: docker compose logs frontend"
        exit 1
    }
    $env:XIJIU_API_BASE = "http://127.0.0.1:3000"
} else {
    $env:XIJIU_API_BASE = "http://127.0.0.1:8000"
}

Write-Host ">>> XIJIU_API_BASE=$($env:XIJIU_API_BASE)"
Write-Host ">>> 安装 dev 依赖并执行 pytest"

$py = $null
foreach ($c in @("py", "python", "python3")) {
    try {
        & $c -c "import sys; print(sys.version)" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $py = $c; break }
    } catch { }
}
if (-not $py) {
    Write-Error "未找到 Python，请安装 Python 3 或将 pytest/httpx 装好后手动执行:`n  `$env:XIJIU_API_BASE='$($env:XIJIU_API_BASE)'; pytest tests/api/test_user_stories_smoke.py -v"
    exit 1
}

& $py -m pip install -q -r requirements-dev.txt
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location $Root
& $py -m pytest tests/api/test_user_stories_smoke.py -v --tb=short
$code = $LASTEXITCODE
Pop-Location

exit $code
