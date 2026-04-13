@echo off
chcp 65001 >nul
:: Ralph 循环启动脚本 (Windows 版本)
:: 用法: ralph.cmd [max_iterations]
:: 默认最大迭代次数: 10

set MAX_ITERATIONS=%1
if "%MAX_ITERATIONS%"=="" set MAX_ITERATIONS=10

echo ========================================
echo  Ralph 循环启动
echo  最大迭代次数: %MAX_ITERATIONS%
echo ========================================
echo.
echo 请按以下步骤操作:
echo.
echo 1. 确保 prd.json 和 prompt.md 已准备好
echo 2. 将 prompt.md 内容复制到 AI 对话框
echo 3. AI 会自动读取 prd.json 和 progress.txt
echo 4. 重复执行直到所有任务完成或达到迭代上限
echo.
echo 监控命令:
echo   type prd.json ^| findstr passes
echo   type progress.txt
echo   git log --oneline -5
echo.
echo 完成后 AI 会回复: "全部完成"
echo ========================================

:: 检查必要文件
if not exist "prd.json" (
    echo [错误] prd.json 不存在!
    exit /b 1
)

if not exist "prompt.md" (
    echo [错误] prompt.md 不存在!
    exit /b 1
)

if not exist "progress.txt" (
    echo [提示] 创建 progress.txt...
    echo # 经验日志 > progress.txt
)

echo.
echo [检查通过] 文件结构就绪
echo.
echo 当前任务状态:
:: 简单的状态显示 (如果安装了 jq 会更好)
type prd.json | findstr "\"id\"\":\"\":\"passes\"" 2>nul || echo 请手动检查 prd.json 中的任务状态

echo.
echo 现在可以将 prompt.md 发给 AI 开始循环了!
pause
