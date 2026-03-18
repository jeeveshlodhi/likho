import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router';
import { ArrowRight, Sparkles, FileText, LayoutGrid, Palette, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router';

const TauriWelcome = () => {
  const navigate = useNavigate();
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const { isAuthenticated, accessToken, isGuest } = useAuthStore();

  if ((isAuthenticated && accessToken) || isGuest) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate('/dashboard');
  };

  const features = [
    { Icon: FileText,   label: 'Notes',   color: '#6366f1', bg: '#eef2ff' },
    { Icon: LayoutGrid, label: 'Kanban',  color: '#8b5cf6', bg: '#f5f3ff' },
    { Icon: Palette,    label: 'Canvas',  color: '#ec4899', bg: '#fdf2f8' },
    { Icon: Zap,        label: 'AI',      color: '#f59e0b', bg: '#fffbeb' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      {/* Radial fade over dots */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.88) 42%, rgba(255,255,255,0.25) 78%, transparent 100%)',
        }}
      />
      {/* Top indigo glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 'min(600px, 100vw)',
          height: '220px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)',
        }}
      />

      {/* ── Main card ── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full px-4 sm:px-8 py-8"
        style={{ maxWidth: '480px' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.07, duration: 0.35 }}
          className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
        >
          <div
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <span className="text-white text-lg sm:text-xl font-black tracking-tight">L</span>
          </div>
          <span
            className="font-black tracking-[-0.03em]"
            style={{ fontSize: 'clamp(1.3rem, 5vw, 1.6rem)', color: '#09090b' }}
          >
            Likho
          </span>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.14, duration: 0.35 }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium"
            style={{
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#4f46e5',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>A workspace that starts ready</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center font-black tracking-[-0.04em] leading-[0.92] mb-4 sm:mb-5"
          style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)' }}
        >
          <span style={{ color: '#a1a1aa', display: 'block', fontWeight: 800 }}>
            Think, plan, and
          </span>
          <span
            style={{
              display: 'block',
              fontWeight: 900,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            create in one place.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27, duration: 0.35 }}
          className="text-center mb-6 sm:mb-8 mx-auto px-2"
          style={{
            fontSize: 'clamp(0.8rem, 3vw, 1rem)',
            color: '#71717a',
            lineHeight: 1.65,
            maxWidth: '34ch',
          }}
        >
          Notes, Kanban boards, and visual canvases — with templates so you start working instantly.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.35 }}
          className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-7 sm:mb-9"
        >
          {features.map(({ Icon, label, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: bg,
                border: `1px solid ${color}30`,
              }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              <span className="text-xs font-semibold" style={{ color }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.41, duration: 0.35 }}
          className="flex flex-col gap-2.5 sm:flex-row sm:gap-3"
        >
          <Link
            to="/auth/sign-up"
            className="group flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98] flex-1"
            style={{
              backgroundColor: '#09090b',
              color: '#fafafa',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            Create account
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
          </Link>
          <Link
            to="/auth/sign-in"
            className="flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-all active:scale-[0.98] flex-1 sm:flex-none sm:px-6"
            style={{
              color: '#3f3f46',
              border: '1px solid #e4e4e7',
              backgroundColor: '#ffffff',
              fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fafafa';
              e.currentTarget.style.borderColor = '#d4d4d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e4e4e7';
            }}
          >
            Sign in
          </Link>
        </motion.div>

        {/* Guest option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52, duration: 0.35 }}
          className="mt-5 text-center"
        >
          <button
            onClick={handleGuestAccess}
            className="text-xs sm:text-sm transition-colors"
            style={{ color: '#a1a1aa' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#3f3f46')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          >
            Continue as guest →
          </button>
        </motion.div>

        {/* Footer trust note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.35 }}
          className="mt-6 sm:mt-8 text-center text-xs"
          style={{ color: '#d4d4d8' }}
        >
          Free forever · No credit card needed
        </motion.p>
      </motion.div>
    </div>
  );
};

export default TauriWelcome;
