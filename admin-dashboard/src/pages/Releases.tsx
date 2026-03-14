import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Rocket,
  Package,
  Upload,
  ExternalLink,
  ChevronRight,
  Terminal,
  Server,
  Link2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Copy,
  Monitor,
} from 'lucide-react';
import { useVersionStore } from '@/lib/store';
import { activeApi } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppVersion } from '@/types';

type PlatformKey = 'ios' | 'android' | 'desktop' | 'web';

const BUILD_STEPS = [
  {
    title: 'Build Tauri app',
    icon: Terminal,
    cmd: 'cd likho-app && bun run tauri build',
    detail: 'Outputs to src-tauri/target/release/bundle/ (e.g. .dmg, .msi, .AppImage)',
  },
  {
    title: 'Upload to S3',
    icon: Server,
    cmd: 'aws s3 cp path/to/installer.dmg s3://YOUR_BUCKET/releases/ --acl public-read',
    detail: 'Or use the upload tool below if your backend has S3 configured.',
  },
  {
    title: 'Register release',
    icon: Link2,
    detail: 'Paste the public URL below and click "Register release" to publish.',
  },
];

interface RegisterFormData {
  version: string;
  platform: PlatformKey;
  download_url: string;
  release_notes: string;
  min_required_version: string;
  force_update: boolean;
}

const defaultForm: RegisterFormData = {
  version: '',
  platform: 'desktop',
  download_url: '',
  release_notes: '',
  min_required_version: '',
  force_update: false,
};

export function ReleasesPage() {
  const { versions, isLoading, fetchVersions, createVersion } = useVersionStore();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>(defaultForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [presignedAvailable, setPresignedAvailable] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Check if presigned upload is available (backend may not have S3 configured)
  useEffect(() => {
    activeApi
      .getPresignedUploadUrl('test.txt')
      .then(() => setPresignedAvailable(true))
      .catch(() => setPresignedAvailable(false));
  }, []);

  const desktopVersions = versions.filter(
    (v) => v.platform === 'desktop' || v.platform === 'all'
  );
  const latestDesktop =
    desktopVersions.sort(
      (a, b) =>
        new Date(b.released_at || 0).getTime() -
        new Date(a.released_at || 0).getTime()
    )[0] ?? null;

  const recentVersions = [...versions]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || presignedAvailable !== true) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { upload_url, public_url } = await activeApi.getPresignedUploadUrl(
        file.name
      );
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      setFormData((prev) => ({ ...prev, download_url: public_url }));
      setShowRegisterModal(true);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createVersion({
        ...formData,
        released_at: new Date().toISOString(),
      });
      setFormData(defaultForm);
      setShowRegisterModal(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to create version');
    } finally {
      setCreating(false);
    }
  };

  const copyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Rocket className="w-7 h-7 text-blue-600" />
            Releases & App Updates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Build, upload, and manage desktop app versions and update policy
          </p>
        </div>
        <div className="flex items-center gap-2">
          {presignedAvailable === true && (
            <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading…' : 'Upload build to S3'}
              <input
                type="file"
                className="hidden"
                accept=".dmg,.msi,.exe,.AppImage,.deb,.rpm"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          )}
          <button
            onClick={() => {
              setFormData(defaultForm);
              setUploadError(null);
              setShowRegisterModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Package className="w-4 h-4" />
            Register release
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest desktop release */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            Current desktop release
          </h2>
          {isLoading ? (
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ) : latestDesktop ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900">
                  v{latestDesktop.version}
                </span>
                <Link
                  to="/versions"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  Edit <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {latestDesktop.download_url && (
                <a
                  href={latestDesktop.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{latestDesktop.download_url}</span>
                </a>
              )}
              {latestDesktop.force_update && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  Force update enabled
                </div>
              )}
              <p className="text-xs text-gray-500">
                Released {latestDesktop.released_at ? formatDateTime(latestDesktop.released_at) : 'N/A'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No desktop release yet. Build, upload to S3, then register below.
            </p>
          )}
        </div>

        {/* App update policy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Update policy
          </h2>
          {latestDesktop ? (
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <span className="font-medium text-gray-700">Min required version:</span>{' '}
                {latestDesktop.min_required_version || '—'}
              </li>
              <li>
                <span className="font-medium text-gray-700">Force update:</span>{' '}
                {latestDesktop.force_update ? 'Yes' : 'No'}
              </li>
              <li>
                <Link to="/versions" className="text-blue-600 hover:underline">
                  Change in Versions →
                </Link>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Set min required version and force update when you register a release.
            </p>
          )}
        </div>
      </div>

      {/* Build & S3 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          Build & upload
        </h2>
        <ul className="space-y-4">
          {BUILD_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{step.title}</p>
                  {step.cmd && (
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded truncate">
                        {step.cmd}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyCmd(step.cmd)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {step.detail && (
                    <p className="mt-1 text-xs text-gray-500">{step.detail}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {presignedAvailable === false && (
          <p className="mt-4 text-xs text-gray-500">
            Configure AWS (bucket, credentials) in the backend to enable direct upload from this dashboard.
          </p>
        )}
      </div>

      {/* Recent versions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            Recent versions
          </h2>
          <Link
            to="/versions"
            className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
          >
            Manage all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentVersions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-2 pr-4">Version</th>
                  <th className="pb-2 pr-4">Platform</th>
                  <th className="pb-2 pr-4">Download</th>
                  <th className="pb-2">Released</th>
                </tr>
              </thead>
              <tbody>
                {recentVersions.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      v{v.version}
                      {v.force_update && (
                        <span className="ml-2 text-xs text-red-600">Force update</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 capitalize text-gray-600">{v.platform}</td>
                    <td className="py-2 pr-4">
                      {v.download_url ? (
                        <a
                          href={v.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {v.released_at ? formatDateTime(v.released_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No versions yet. Register your first release above.</p>
        )}
      </div>

      {/* Register release modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Register release</h2>
              <button
                type="button"
                onClick={() => {
                  setShowRegisterModal(false);
                  setUploadError(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {uploadError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g. 0.1.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as PlatformKey,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Download URL *</label>
                <input
                  type="url"
                  required
                  value={formData.download_url}
                  onChange={(e) =>
                    setFormData({ ...formData, download_url: e.target.value })
                  }
                  placeholder="https://your-bucket.s3.region.amazonaws.com/releases/..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Release notes</label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, release_notes: e.target.value })
                  }
                  placeholder="What's new"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min required version
                </label>
                <input
                  type="text"
                  value={formData.min_required_version}
                  onChange={(e) =>
                    setFormData({ ...formData, min_required_version: e.target.value })
                  }
                  placeholder="e.g. 0.9.0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <label className="flex items-center gap-3 p-3 bg-red-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.force_update}
                  onChange={(e) =>
                    setFormData({ ...formData, force_update: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-red-700">Force update (require all users to update)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setUploadError(null);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2',
                    creating && 'opacity-70 cursor-not-allowed'
                  )}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    'Register release'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
