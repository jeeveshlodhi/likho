import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router';
import { ArrowRight, Sparkles, FileText, LayoutGrid, Palette } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router';

const TauriWelcome = () => {
  const navigate = useNavigate();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const { isAuthenticated, accessToken, isGuest } = useAuthStore();

  // Already logged in (or guest) — skip welcome screen entirely
  if ((isAuthenticated && accessToken) || isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent rounded-full" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-2xl mx-auto px-8 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <span className="text-3xl font-bold text-foreground">Likho</span>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>A workspace that starts ready</span>
        </motion.div>

        {/* Tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight"
        >
          Think, plan, and create{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            in one place
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto"
        >
          Notes, Kanban boards, and visual canvases — with templates so you start working instantly.
        </motion.p>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center gap-6 mb-10"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground">Notes</span>
          </div>
          <div className="w-8 h-px bg-border/50" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs text-muted-foreground">Kanban</span>
          </div>
          <div className="w-8 h-px bg-border/50" />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Palette className="w-6 h-6 text-pink-400" />
            </div>
            <span className="text-xs text-muted-foreground">Canvas</span>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/auth/sign-up"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-foreground text-background text-base font-medium rounded-xl hover:opacity-90 transition-all hover:gap-3 shadow-lg"
          >
            Create account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/auth/sign-in"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-foreground border border-border/50 rounded-xl hover:bg-accent transition-colors"
          >
            Sign in
          </Link>
        </motion.div>

        {/* Guest Option */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          onClick={handleGuestAccess}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Or continue as guest →
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TauriWelcome;
