Clabs Electron 앱을 macOS용으로 빌드하고 /Applications에 설치하라.

## 절차

1. 실행 중인 Clabs 앱 종료: `pkill -f "Clabs" 2>/dev/null || true`
2. Main 프로세스 빌드: `npm run build:main`
3. Renderer 빌드: `npm run build:renderer`
4. electron-builder로 macOS 패키징 (dir 타겟): `npx electron-builder --mac dir --config electron-builder.yml`
5. 빌드 결과 확인: `release/mac-arm64/Clabs.app` 존재 여부
6. 기존 앱 제거 후 복사: `rm -rf /Applications/Clabs.app && cp -R release/mac-arm64/Clabs.app /Applications/`
7. 설치 확인: `ls -la /Applications/Clabs.app`
8. 완료 메시지 출력

## 규칙
- 각 단계가 실패하면 즉시 중단하고 에러를 보고하라
- 빌드 전 node_modules 존재 여부를 확인하고, 없으면 `npm install` 실행
- 사용자가 "실행"도 요청한 경우에만 `open /Applications/Clabs.app` 실행
