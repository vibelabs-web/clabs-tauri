#!/bin/bash
# @TASK P4-T2 - Linux 설치 후 스크립트

set -e

# 앱 경로
APP_DIR="/opt/clabs"
DESKTOP_FILE="/usr/share/applications/clabs.desktop"

echo "Installing clabs..."

# 데스크톱 엔트리 생성
cat > "${DESKTOP_FILE}" << EOF
[Desktop Entry]
Name=clabs
Comment=Claude Labs Skillpack GUI - AI 개발 파트너
Exec=${APP_DIR}/clabs %U
Icon=clabs
Terminal=false
Type=Application
Categories=Development;Utility;
MimeType=x-scheme-handler/clabs;
Keywords=AI;Claude;Development;Skills;
StartupWMClass=clabs
EOF

# 권한 설정
chmod +x "${APP_DIR}/clabs"
chmod 644 "${DESKTOP_FILE}"

# MIME 타입 업데이트
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# 아이콘 캐시 업데이트
if command -v gtk-update-icon-cache > /dev/null 2>&1; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor
fi

echo "clabs installed successfully!"
