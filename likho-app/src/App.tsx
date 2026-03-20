import { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route } from "react-router";
import Welcome from "@/pages/landing/welcome";
import DownloadPage from "@/pages/landing/DownloadPage";
import Pricing from "@/pages/landing/Pricing";
import Contact from "@/pages/landing/Contact";
import Terms from "@/pages/landing/Terms";
import Privacy from "@/pages/landing/Privacy";
import Security from "@/pages/landing/Security";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";
import OnboardingWizard from "@/pages/onboarding/OnboardingWizard";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import FolderIndex from "@/pages/dashboard/FolderIndex";
import PageEditor from "@/pages/dashboard/PageEditor";
import SettingsPage from "@/pages/settings";
import SharedPageView from "@/pages/SharedPageView";
import GraphView from "@/pages/dashboard/GraphView";
import TempNotesDashboard from "@/pages/dashboard/TempNotesDashboard";
import { WorkspaceRagChat } from "@/pages/dashboard/WorkspaceRagChat";
import { AiChat } from "@/pages/dashboard/AiChat";
import SharedWithMe from "@/pages/dashboard/SharedWithMe";
import CalendarPage from "@/pages/dashboard/CalendarPage";
import { AuthGuard } from "@/components/shared/AuthGuard";
import AppTitleBar from "@/components/tauri/AppTitleBar";
import { isTauri } from "@/utils/platform";
import { TempNoteQuickCapture } from "@/components/dashboard/TempNoteQuickCapture";

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
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/security" element={<Security />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/onboarding" element={<OnboardingWizard />} />
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
        <Route path="graph" element={<GraphView />} />
        <Route path="temp-notes" element={<TempNotesDashboard />} />
        <Route path="ai-chat" element={<AiChat />} />
        <Route path="ai-chat-rag" element={<WorkspaceRagChat />} />
        <Route path="shared-with-me" element={<SharedWithMe />} />
        <Route path="calendar" element={<CalendarPage />} />
      </Route>
    </Routes>
  );

  if (showTitleBar) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <AppTitleBar />
        <div className="flex-1 min-h-0 overflow-auto">
          {routes}
        </div>
        <TempNoteQuickCapture />
      </div>
    );
  }

  // Browser: full-height container with scrolling enabled
  return (
    <div className="h-screen min-h-0 overflow-auto bg-background">
      {routes}
      <TempNoteQuickCapture />
    </div>
  );
}

export default App;
