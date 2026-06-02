@echo off
set SRC=C:\Users\zheng\Desktop\此刻地图设计版\此刻地图成品\A1.0
set DST=D:\ProgramData\AndroidStudio\AndroidStudioProjects\MomentMap\app\src\main\assets

xcopy /E /Y "%SRC%\index.html" "%DST%\"
xcopy /E /Y "%SRC%\css\*" "%DST%\css\"
xcopy /E /Y "%SRC%\js\*" "%DST%\js\"
echo 同步完成！
pause
