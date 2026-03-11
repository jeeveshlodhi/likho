import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { FeatureFlags } from '@/pages/FeatureFlags';
import { RemoteConfigPage } from '@/pages/RemoteConfig';
import { FeedbackPage } from '@/pages/Feedback';
import { VersionsPage } from '@/pages/Versions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="feature-flags" element={<FeatureFlags />} />
          <Route path="remote-config" element={<RemoteConfigPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="versions" element={<VersionsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
