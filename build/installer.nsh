; Clabs NSIS Custom Installer Script
; Auto-uninstall previous versions before installation

!macro customInit
  ; Check for previous installation in registry
  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${APP_PACKAGE_NAME}}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO "Clabs의 이전 버전이 발견되었습니다.$\n$\n자동으로 제거하고 새 버전을 설치하시겠습니까?" IDYES uninst IDNO abort
    abort:
      Abort
    uninst:
      ; Extract uninstaller path (remove quotes if present)
      StrCpy $1 $0 "" 1
      StrCpy $1 $1 -1

      ; Run uninstaller silently
      ExecWait '"$1" /S _?=$INSTDIR' $2

      ; If uninstaller was in install dir, it's deleted now, so remove dir
      RMDir /r "$INSTDIR"

      ; Clean up registry if uninstaller failed to do so
      DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${APP_PACKAGE_NAME}}"
  ${EndIf}

  ; Also check in HKLM (for per-machine installations)
  ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${APP_PACKAGE_NAME}}" "UninstallString"
  ${If} $0 != ""
    MessageBox MB_YESNO "Clabs의 이전 버전(시스템 전역)이 발견되었습니다.$\n$\n관리자 권한으로 제거하고 새 버전을 설치하시겠습니까?" IDYES uninst2 IDNO abort2
    abort2:
      Abort
    uninst2:
      StrCpy $1 $0 "" 1
      StrCpy $1 $1 -1
      ExecWait '"$1" /S _?=$INSTDIR' $2
      RMDir /r "$INSTDIR"
      DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\{${APP_PACKAGE_NAME}}"
  ${EndIf}

  ; Check for legacy installation paths and clean up
  IfFileExists "$LOCALAPPDATA\Programs\Clabs\*.*" 0 +3
    RMDir /r "$LOCALAPPDATA\Programs\Clabs"

  IfFileExists "$PROGRAMFILES\Clabs\*.*" 0 +3
    RMDir /r "$PROGRAMFILES\Clabs"
!macroend

!macro customInstall
  ; Create .claude directory in user profile if not exists
  CreateDirectory "$PROFILE\.claude"
  CreateDirectory "$PROFILE\.claude\skills"
  CreateDirectory "$PROFILE\.claude\agents"
  CreateDirectory "$PROFILE\.claude\commands"
  CreateDirectory "$PROFILE\.claude\constitutions"

  ; Log installation for debugging
  FileOpen $0 "$INSTDIR\install.log" w
  FileWrite $0 "Clabs Installation Log$\r$\n"
  FileWrite $0 "Install Dir: $INSTDIR$\r$\n"
  FileWrite $0 "Profile: $PROFILE$\r$\n"
  FileWrite $0 "Time: $\r$\n"
  FileClose $0
!macroend

!macro customUnInit
  ; Custom uninstall initialization - nothing special needed
!macroend

!macro customUnInstall
  ; Clean up .claude directory settings created by app (but preserve user skills)
  ; Only remove app-specific data, not user-created content

  ; Remove installation log
  Delete "$INSTDIR\install.log"

  ; Clean up any cached data
  RMDir /r "$LOCALAPPDATA\Clabs"

  ; Note: We intentionally do NOT delete $PROFILE\.claude
  ; as users may have their own skills and configurations there
!macroend
