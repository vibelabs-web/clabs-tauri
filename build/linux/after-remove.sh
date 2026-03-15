#!/bin/bash
# @TASK P4-T2 - Linux 제거 후 스크립트

set -e

DESKTOP_FILE="/usr/share/applications/clabs.desktop"

echo "Removing clabs..."

# 데스크톱 엔트리 제거
if [ -f "${DESKTOP_FILE}" ]; then
    rm -f "${DESKTOP_FILE}"
fi

# MIME 타입 업데이트
if command -v update-desktop-database > /dev/null 2>&1; then
    update-desktop-database /usr/share/applications
fi

# 아이콘 캐시 업데이트
if command -v gtk-update-icon-cache > /dev/null 2>&1; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor
fi

echo "clabs removed successfully!"
