@echo off
chcp 65001 >nul
echo ==============================================
echo  此刻地图项目自动git
echo  每10分钟检测一次
echo ==============================================
echo.

:loop
echo 【%time%】 检测代码变动...

:: 检查是否有文件改动
git diff --quiet
if %errorlevel% equ 0 (
    echo 无改动，跳过本次提交
) else (
    echo 检测到改动，开始自动提交并推送...
    git add .
    git commit -m "auto commit: 自动备份"
    git push
    echo 推送完成
)

echo.
echo 等待 10 分钟后重新检测...
echo ==============================================
timeout /t 600 /nobreak >nul
goto loop