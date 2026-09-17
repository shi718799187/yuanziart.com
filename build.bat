@echo off
rem 本文件以 GBK 保存 —— 中文版 cmd 默认按 GBK 解码，用 UTF-8 存会显示成乱码。
rem 也不要在这里加 chcp：批处理执行中改代码页会让 cmd 的解析位置错乱。
setlocal
where node >nul 2>nul
if %errorlevel%==0 (
  node "%~dp0build.js"
) else (
  echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org
  echo 安装后重新双击本文件，或在本目录执行：node build.js
  pause
)
