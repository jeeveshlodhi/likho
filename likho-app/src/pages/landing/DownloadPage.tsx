import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Download, ArrowLeft, Monitor, Cpu, Shield, Sparkles } from 'lucide-react';
import { useDesktopDownload } from '@/hooks/useDesktopDownload';
import Navbar from '@/components/landing/Navbar';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const features = [
  {
    icon: Monitor,
    label: 'Native app',
    description: 'Mac, Windows & Linux',
  },
  {
    icon: Cpu,
    label: 'Local AI',
    description: 'Works offline',
  },
  {
    icon: Shield,
    label: 'Your data stays yours',
    description: 'Private by default',
  },
  {
    icon: Sparkles,
    label: 'Same workspace',
    description: 'Notes, Kanban, Canvas',
  },
];

export default function DownloadPage() {
  const release = useDesktopDownload();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, transparent 70%)',
        }}
      />
      <Navbar />

      <main className="relative max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Back link */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0 }}
          className="mb-10"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: '#6b7280' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        {/* Hero block */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="rounded-2xl overflow-hidden mb-12"
          style={{
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            backgroundColor: '#ffffff',
          }}
        >
          <div className="p-8 sm:p-10 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                backgroundColor: '#111827',
                boxShadow: '0 4px 14px rgba(17,24,39,0.25)',
              }}
            >
              <Download className="w-8 h-8 text-white" />
            </motion.div>
            <h1
              className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
              style={{ color: '#111827' }}
            >
              Tauro for Desktop
            </h1>
            <p
              className="text-lg max-w-md mx-auto mb-8"
              style={{ color: '#6b7280' }}
            >
              The full workspace on your machine. Notes, Kanban, and Canvas — with local AI that works offline.
            </p>

            {release?.download_url ? (
              <motion.a
                href={release.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold rounded-xl transition-all"
                style={{
                  backgroundColor: '#111827',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="w-5 h-5" />
                Download Tauro
              </motion.a>
            ) : (
              <div
                className="inline-block rounded-xl px-5 py-4 text-left max-w-md"
                style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                }}
              >
                <p className="text-sm">
                  The download link will appear here when a release is available. For local development, start the backend or set{' '}
                  <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-200 text-gray-800">VITE_DESKTOP_DOWNLOAD_URL</code> in .env.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-xl p-4 sm:p-5 flex items-start gap-3"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.8)',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#f3f4f6' }}
                >
                  <Icon className="w-5 h-5" style={{ color: '#374151' }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold" style={{ color: '#111827' }}>
                    {item.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                    {item.description}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>
    </div>
  );
}
