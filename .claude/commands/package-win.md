Clabs Electron 앱을 Windows용으로 빌드하라.

## 절차

1. 실행 중인 Clabs 앱 종료: `pkill -f "Clabs" 2>/dev/null || true`
2. Main 프로세스 빌드: `npm run build:main`
3. Renderer 빌드: `npm run build:renderer`
4. electron-builder로 Windows 패키징: `npx electron-builder --win dir --config electron-builder.yml`
5. 빌드 결과 확인: `release/win-unpacked/Clabs.exe` 존재 여부
6. 완료 메시지 출력 (빌드 경로 안내)

## 규칙
- 각 단계가 실패하면 즉시 중단하고 에러를 보고하라
- 빌드 전 node_modules 존재 여부를 확인하고, 없으면 `npm install` 실행
- macOS에서 크로스 빌드 시 Wine이 필요할 수 있음 — 에러 발생 시 안내하라
- Windows에서 실행 시 설치 경로는 사용자에게 확인 후 결정
