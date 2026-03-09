import { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router";
import Welcome from "@/pages/landing/welcome";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import FolderIndex from "@/pages/dashboard/FolderIndex";
import PageEditor from "@/pages/dashboard/PageEditor";
import SettingsPage from "@/pages/settings";
import SharedPageView from "@/pages/SharedPageView";
import LinkManager from "@/pages/dashboard/LinkManager";
import TagManager from "@/pages/dashboard/TagManager";
import GraphView from "@/pages/dashboard/GraphView";
import TagView from "@/pages/dashboard/TagView";
import { AuthGuard } from "@/components/shared/AuthGuard";
import AppTitleBar from "@/components/tauri/AppTitleBar";
import { isTauri } from "@/utils/platform";

function App() {
  // Sync check + re-check after mount in case Tauri injects __TAURI__ after first paint
  const [showTitleBar, setShowTitleBar] = useState(() => isTauri());

  useEffect(() => {
    if (showTitleBar) return;
    const id = requestAnimationFrame(() => {
      if (isTauri()) setShowTitleBar(true);
    });
    return () => cancelAnimationFrame(id);
  }, [showTitleBar]);

  const routes = (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/shared/:token" element={<SharedPageView />} />
      <Route path="/dashboard" element={
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="folder/:folderId" element={<FolderIndex />} />
        <Route path="note/:noteId" element={<PageEditor />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/:section" element={<SettingsPage />} />
        <Route path="links" element={<LinkManager />} />
        <Route path="tags" element={<TagManager />} />
        <Route path="tag/:tagName" element={<TagView />} />
        <Route path="graph" element={<GraphView />} />
      </Route>
    </Routes>
  );

  if (showTitleBar) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <AppTitleBar />
        <div className="flex-1 min-h-0 overflow-hidden">
          {routes}
        </div>
      </div>
    );
  }

  // Browser: wrap in full-height container so dashboard sidebar (h-full) has a defined height
  return (
    <div className="h-screen min-h-0 overflow-hidden bg-background">
      {routes}
    </div>
  );
}

export default App;
