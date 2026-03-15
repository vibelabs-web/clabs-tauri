import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LicensePage() {
  const navigate = useNavigate();
  const [licenseKey, setLicenseKey] = useState(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (index: number, value: string) => {
    // 숫자/영문 대문자만 허용, 4자리 제한
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    const newKey = [...licenseKey];
    newKey[index] = cleaned;
    setLicenseKey(newKey);

    // 4자리 입력 시 다음 칸으로 자동 이동
    if (cleaned.length === 4 && index < 3) {
      const nextInput = document.getElementById(`license-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleActivate = async () => {
    const fullKey = licenseKey.join('-');
    if (fullKey.replace(/-/g, '').length !== 16) {
      setError('라이선스 키를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.api.license.activate(fullKey);

      if (!result.isValid) {
        setError(result.error || '유효하지 않은 라이선스 키입니다.');
        return;
      }

      // 활성화 성공 - 프로젝트 선택 페이지로 이동
      navigate('/projects');
    } catch (err) {
      console.error('License activation error:', err);
      setError('라이선스 활성화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 타이틀바 */}
      <header className="h-10 bg-bg-secondary border-b border-bg-tertiary drag-region flex items-center justify-center">
        <span className="text-sm font-medium">clabs</span>
      </header>

      {/* 콘텐츠 */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">라이선스 인증</h1>
            <p className="text-text-muted">
              구매 시 받은 라이선스 키를 입력해주세요.
            </p>
          </div>

          {/* 라이선스 키 입력 */}
          <div className="flex gap-2 justify-center mb-6">
            {licenseKey.map((segment, index) => (
              <React.Fragment key={index}>
                <input
                  id={`license-${index}`}
                  type="text"
                  value={segment}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  className="w-20 h-12 text-center text-lg font-mono bg-bg-secondary border border-bg-tertiary rounded-lg focus:outline-none focus:border-accent"
                  placeholder="XXXX"
                  maxLength={4}
                />
                {index < 3 && <span className="text-text-muted self-center">-</span>}
              </React.Fragment>
            ))}
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-status-error text-sm text-center mb-4">{error}</p>
          )}

          {/* 활성화 버튼 */}
          <button
            onClick={handleActivate}
            disabled={isLoading}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-bg-primary font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? '인증 중...' : '라이선스 활성화'}
          </button>

          {/* 안내 링크 */}
          <div className="mt-6 text-center text-sm text-text-muted">
            <p>
              라이선스가 없으신가요?{' '}
              <a
                href="https://example.com/purchase"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                구매하기
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
