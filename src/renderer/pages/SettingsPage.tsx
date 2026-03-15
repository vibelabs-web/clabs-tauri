import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore, useThemeStore } from '@renderer/stores';
import { themeList } from '@shared/themes';
import type { CursorStyle } from '@shared/types';
import type { ThemeId } from '@shared/themes';

type SettingsTab = 'general' | 'terminal' | 'skillpack' | 'license' | 'about';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Zustand store에서 설정 가져오기
  const {
    fontSize,
    cursorStyle,
    autoUpdate,
    setFontSize,
    setCursorStyle,
    setAutoUpdate,
    loadFromConfig,
  } = useSettingsStore();

  // 테마 store
  const { currentThemeId, setTheme } = useThemeStore();

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadFromConfig();
  }, [loadFromConfig]);

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: '일반' },
    { id: 'terminal', label: '터미널' },
    { id: 'skillpack', label: '스킬팩' },
    { id: 'license', label: '라이선스' },
    { id: 'about', label: '정보' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 타이틀바 */}
      <header className="h-10 bg-bg-secondary border-b border-bg-tertiary drag-region flex items-center px-4">
        <button
          onClick={() => navigate(-1)}
          className="no-drag text-text-muted hover:text-text-primary mr-4"
        >
          ← 뒤로
        </button>
        <span className="text-sm font-medium">설정</span>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 탭 */}
        <aside className="w-48 bg-bg-secondary border-r border-bg-tertiary p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* 콘텐츠 */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-text-primary">일반 설정</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3 text-text-primary">테마 선택</label>
                  <div className="grid grid-cols-3 gap-3 max-w-lg">
                    {themeList.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setTheme(theme.id as ThemeId)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          currentThemeId === theme.id
                            ? 'border-accent bg-accent/10'
                            : 'border-bg-tertiary hover:border-bg-hover'
                        }`}
                      >
                        {/* 테마 미리보기 색상 */}
                        <div className="flex gap-1 mb-2">
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: theme.colors.bgPrimary }}
                            title="배경색"
                          />
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: theme.colors.accent }}
                            title="액센트색"
                          />
                          <div
                            className="w-5 h-5 rounded"
                            style={{ backgroundColor: theme.colors.textPrimary }}
                            title="텍스트색"
                          />
                        </div>
                        {/* 테마 이름 */}
                        <span className={`text-xs font-medium ${
                          currentThemeId === theme.id ? 'text-accent' : 'text-text-muted'
                        }`}>
                          {theme.name}
                        </span>
                        {/* 선택 표시 */}
                        {currentThemeId === theme.id && (
                          <div className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">터미널 설정</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    폰트 크기: {fontSize}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full max-w-xs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">커서 스타일</label>
                  <select
                    value={cursorStyle}
                    onChange={(e) => setCursorStyle(e.target.value as CursorStyle)}
                    className="w-full max-w-xs px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:border-accent"
                  >
                    <option value="block">블록</option>
                    <option value="underline">밑줄</option>
                    <option value="bar">바</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skillpack' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">스킬팩 설정</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">자동 업데이트</p>
                    <p className="text-sm text-text-muted">
                      새 버전 출시 시 자동으로 알림
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoUpdate(!autoUpdate)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      autoUpdate ? 'bg-accent' : 'bg-bg-tertiary'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        autoUpdate ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <p className="font-medium">스킬팩 버전</p>
                  <p className="text-sm text-text-muted">v1.8.0 (최신)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">라이선스</h2>

              <div className="p-4 bg-bg-secondary rounded-lg">
                <p className="font-medium text-accent">✓ 라이선스 활성화됨</p>
                <p className="text-sm text-text-muted mt-2">
                  이메일: user@example.com
                </p>
                <p className="text-sm text-text-muted">
                  업그레이드 만료: 2025-06-15
                </p>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">정보</h2>

              <div className="space-y-2">
                <p>
                  <span className="text-text-muted">버전:</span> 1.0.0
                </p>
                <p>
                  <span className="text-text-muted">Electron:</span> 28.0.0
                </p>
                <p>
                  <span className="text-text-muted">개발:</span> Claude Labs
                </p>
              </div>

              <div className="pt-4">
                <a
                  href="https://github.com/example/clabs"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
