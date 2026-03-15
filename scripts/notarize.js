// @TASK P4-T3 - macOS 공증 자동화 스크립트
// @SPEC Phase 4: 패키징 및 배포 - 코드 서명 및 공증

const { notarize } = require('@electron/notarize');
const path = require('path');

/**
 * electron-builder afterSign 훅
 * 빌드 후 자동으로 공증 수행
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // macOS만 공증
  if (electronPlatformName !== 'darwin') {
    console.log('⏭️  Notarization skipped (not macOS)');
    return;
  }

  // 필수 환경변수 확인
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('⚠️  Notarization skipped: Missing credentials');
    console.warn('   Required: APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID');
    return;
  }

  // 앱 경로
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`🔐 Notarizing ${appName}...`);
  console.log(`   App path: ${appPath}`);
  console.log(`   Apple ID: ${appleId}`);
  console.log(`   Team ID: ${teamId}`);

  try {
    await notarize({
      appPath,
      appleId,
      appleIdPassword,
      teamId,
      tool: 'notarytool', // notarytool 사용 (altool은 deprecated)
    });

    console.log('✅ Notarization successful!');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};
