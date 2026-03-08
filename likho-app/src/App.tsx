import "./App.css";
import { Routes, Route } from "react-router";
import Welcome from "@/pages/landing/welcome";
import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import NoteEditor from "@/pages/dashboard/NoteEditor";
import { AuthGuard } from "@/components/shared/AuthGuard";

function App() {

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/auth/sign-in" element={<SignIn />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
      <Route path="/dashboard" element={
        <AuthGuard>
          <DashboardLayout />
        </AuthGuard>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="note/:noteId" element={<NoteEditor />} />
      </Route>
    </Routes>
  );
}

export default App;
