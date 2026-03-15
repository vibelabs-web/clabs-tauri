import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import { useThemeStore } from './stores/theme';

function App() {
  const { loadFromConfig } = useThemeStore();

  // 앱 시작 시 저장된 테마 로드
  useEffect(() => {
    loadFromConfig();
  }, [loadFromConfig]);

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
