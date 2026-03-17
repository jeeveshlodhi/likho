import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Rocket,
  Package,
  Upload,
  ExternalLink,
  ChevronRight,
  Terminal,
  Link2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Copy,
  Monitor,
  Server,
  Apple,
  Layers,
} from 'lucide-react';
import { useVersionStore } from '@/lib/store';
import { activeApi } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppVersion } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type OsKey = 'macos_arm' | 'macos_x64' | 'windows' | 'linux';

interface OsPlatform {
  key: OsKey;
  label: string;
  platform: AppVersion['platform'];
  accept: string;
  hint: string;
}

const OS_PLATFORMS: OsPlatform[] = [
  { key: 'macos_arm', label: 'macOS Apple Silicon', platform: 'macos', accept: '.dmg', hint: '.dmg (aarch64)' },
  { key: 'macos_x64', label: 'macOS Intel', platform: 'macos', accept: '.dmg', hint: '.dmg (x64)' },
  { key: 'windows', label: 'Windows x64', platform: 'windows', accept: '.msi,.exe', hint: '.msi or .exe' },
  { key: 'linux', label: 'Linux x64', platform: 'linux', accept: '.AppImage,.deb,.rpm', hint: '.AppImage / .deb' },
];

interface PlatformSlot {
  file: File | null;
  downloadUrl: string;
  uploadProgress: number; // 0-100, -1 = error
  uploading: boolean;
  uploadError: string | null;
}

type PlatformSlots = Record<OsKey, PlatformSlot>;

const emptySlot = (): PlatformSlot => ({
  file: null,
  downloadUrl: '',
  uploadProgress: 0,
  uploading: false,
  uploadError: null,
});

interface ReleaseFormData {
  version: string;
  release_notes: string;
  min_required_version: string;
  force_update: boolean;
  is_latest: boolean;
}

const defaultForm: ReleaseFormData = {
  version: '',
  release_notes: '',
  min_required_version: '',
  force_update: false,
  is_latest: true,
};

const BUILD_STEPS = [
  {
    title: 'Build Tauri app',
    icon: Terminal,
    cmd: 'cd likho-app && bun run tauri build',
    detail: 'Outputs to src-tauri/target/release/bundle/ (.dmg, .msi, .AppImage)',
  },
  {
    title: 'Upload to S3',
    icon: Server,
    cmd: 'aws s3 cp dist/likho-0.1.0.dmg s3://YOUR_BUCKET/releases/ --acl public-read',
    detail: 'Or use the Upload button below if ADMIN_API_KEY + S3 are configured.',
  },
  {
    title: 'Register release',
    icon: Link2,
    detail: 'Click "Create release", fill in the version, upload per-platform files, then publish.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ReleasesPage() {
  const { versions, isLoading, fetchVersions, createVersion } = useVersionStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ReleaseFormData>(defaultForm);
  const [slots, setSlots] = useState<PlatformSlots>(() =>
    Object.fromEntries(OS_PLATFORMS.map((p) => [p.key, emptySlot()])) as PlatformSlots
  );
  const [s3Configured, setS3Configured] = useState<boolean | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fileRefs = useRef<Record<OsKey, HTMLInputElement | null>>(
    Object.fromEntries(OS_PLATFORMS.map((p) => [p.key, null])) as Record<OsKey, HTMLInputElement | null>
  );

  useEffect(() => {
    fetchVersions();
    activeApi
      .getS3Status()
      .then((s) => setS3Configured(s.configured))
      .catch(() => setS3Configured(false));
  }, [fetchVersions]);

  const desktopVersions = versions.filter(
    (v) => v.platform === 'desktop' || v.platform === 'all' || v.platform === 'macos' || v.platform === 'windows' || v.platform === 'linux'
  );
  const latestDesktop =
    [...desktopVersions].sort(
      (a, b) => new Date(b.released_at || 0).getTime() - new Date(a.released_at || 0).getTime()
    )[0] ?? null;

  const recentVersions = [...versions]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  // ─── Slot handlers ──────────────────────────────────────────────────────────

  const updateSlot = (key: OsKey, patch: Partial<PlatformSlot>) => {
    setSlots((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleFileSelect = async (osKey: OsKey, file: File) => {
    updateSlot(osKey, { file, uploadError: null, downloadUrl: '', uploadProgress: 0 });

    if (!s3Configured) {
      // No S3 — user will paste URL manually
      return;
    }

    updateSlot(osKey, { uploading: true });
    try {
      const { upload_url, public_url } = await activeApi.getPresignedUploadUrl(file.name);
      await activeApi.uploadToS3(file, upload_url, (pct) =>
        updateSlot(osKey, { uploadProgress: pct })
      );
      updateSlot(osKey, { downloadUrl: public_url, uploading: false, uploadProgress: 100 });
    } catch (err) {
      updateSlot(osKey, {
        uploading: false,
        uploadProgress: -1,
        uploadError: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const handleFileChange = (osKey: OsKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(osKey, file);
    e.target.value = '';
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const toCreate = OS_PLATFORMS.filter((p) => slots[p.key].downloadUrl);
    if (toCreate.length === 0) {
      setCreateError('Provide at least one platform download URL.');
      return;
    }

    setCreating(true);
    try {
      await Promise.all(
        toCreate.map((p) =>
          createVersion({
            ...formData,
            platform: p.platform,
            download_url: slots[p.key].downloadUrl,
            released_at: new Date().toISOString(),
          })
        )
      );
      setShowModal(false);
      resetModal();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create release');
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setFormData(defaultForm);
    setCreateError(null);
    setSlots(Object.fromEntries(OS_PLATFORMS.map((p) => [p.key, emptySlot()])) as PlatformSlots);
  };

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

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
            Build, upload to S3, and publish multi-platform desktop releases
          </p>
        </div>
        <button
          onClick={() => { resetModal(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Package className="w-4 h-4" />
          Create release
        </button>
      </div>

      {/* Status row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest desktop */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            Current desktop release
          </h2>
          {isLoading ? (
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ) : latestDesktop ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-semibold text-gray-900">v{latestDesktop.version}</span>
                <Link
                  to="/versions"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  Manage <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {latestDesktop.is_latest && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Latest
                  </span>
                )}
                {latestDesktop.force_update && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Force update
                  </span>
                )}
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
              <p className="text-xs text-gray-500">
                Released {latestDesktop.released_at ? formatDateTime(latestDesktop.released_at) : 'N/A'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No desktop release yet.</p>
          )}
        </div>

        {/* S3 status + update policy */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Server className="w-5 h-5 text-gray-500" />
              S3 storage
            </h2>
            {s3Configured === null ? (
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
            ) : s3Configured ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Configured — direct upload available
              </div>
            ) : (
              <p className="text-sm text-amber-700">
                Not configured — set{' '}
                <code className="text-xs bg-amber-50 px-1 rounded">AWS_ACCESS_KEY_ID</code>,{' '}
                <code className="text-xs bg-amber-50 px-1 rounded">AWS_SECRET_ACCESS_KEY</code> and{' '}
                <code className="text-xs bg-amber-50 px-1 rounded">AWS_RELEASES_BUCKET</code> in the backend
                to enable direct uploads.
              </p>
            )}
          </div>
          {latestDesktop && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Update policy
              </h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  <span className="font-medium text-gray-700">Min required:</span>{' '}
                  {latestDesktop.min_required_version || '—'}
                </li>
                <li>
                  <span className="font-medium text-gray-700">Force update:</span>{' '}
                  {latestDesktop.force_update ? 'Yes' : 'No'}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Build & upload guide */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-gray-600" />
          Build &amp; upload guide
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
                        onClick={() => copyCmd(step.cmd!)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                        title="Copy"
                      >
                        {copiedCmd === step.cmd ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                  {step.detail && <p className="mt-1 text-xs text-gray-500">{step.detail}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Recent versions table */}
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
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
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
                  <tr key={v.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      v{v.version}
                      {v.is_latest && (
                        <span className="ml-2 text-xs text-green-600 font-normal">latest</span>
                      )}
                      {v.force_update && (
                        <span className="ml-2 text-xs text-red-600 font-normal">force</span>
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
          <p className="text-sm text-gray-500">No versions yet.</p>
        )}
      </div>

      {/* Create release modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">Create release</h2>
              <button
                type="button"
                onClick={() => { setShowModal(false); resetModal(); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {createError}
                </div>
              )}

              {/* Core fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version *</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g. 0.2.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min required version</label>
                  <input
                    type="text"
                    value={formData.min_required_version}
                    onChange={(e) => setFormData({ ...formData, min_required_version: e.target.value })}
                    placeholder="e.g. 0.1.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Release notes</label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                  placeholder="What's new in this release…"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_latest}
                    onChange={(e) => setFormData({ ...formData, is_latest: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Mark as latest</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.force_update}
                    onChange={(e) => setFormData({ ...formData, force_update: e.target.checked })}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-red-700">Force update</span>
                </label>
              </div>

              {/* Per-platform upload slots */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-500" />
                  Platform downloads
                  <span className="text-xs text-gray-400 font-normal">(upload at least one)</span>
                </h3>
                <div className="space-y-3">
                  {OS_PLATFORMS.map((os) => {
                    const slot = slots[os.key];
                    const isDone = !!slot.downloadUrl;
                    const isError = slot.uploadProgress === -1;

                    return (
                      <div
                        key={os.key}
                        className={cn(
                          'border rounded-lg p-3 transition-colors',
                          isDone ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* OS icon */}
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {os.key.startsWith('macos') ? (
                              <Apple className="w-4 h-4 text-gray-600" />
                            ) : os.key === 'windows' ? (
                              <Monitor className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Terminal className="w-4 h-4 text-orange-600" />
                            )}
                          </div>

                          {/* Label + file info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{os.label}</p>
                            <p className="text-xs text-gray-400">{os.hint}</p>
                          </div>

                          {/* Upload button or done badge */}
                          {isDone ? (
                            <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                              <CheckCircle2 className="w-4 h-4" /> Ready
                            </span>
                          ) : slot.uploading ? (
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {slot.uploadProgress > 0 ? `${slot.uploadProgress}%` : 'Uploading…'}
                            </span>
                          ) : (
                            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              {s3Configured ? 'Upload' : 'Choose'}
                              <input
                                type="file"
                                className="hidden"
                                accept={os.accept}
                                ref={(el) => { fileRefs.current[os.key] = el; }}
                                onChange={(e) => handleFileChange(os.key, e)}
                                disabled={slot.uploading}
                              />
                            </label>
                          )}
                        </div>

                        {/* Progress bar */}
                        {slot.uploading && slot.uploadProgress > 0 && (
                          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-200"
                              style={{ width: `${slot.uploadProgress}%` }}
                            />
                          </div>
                        )}

                        {/* Error */}
                        {isError && (
                          <p className="mt-1 text-xs text-red-600">{slot.uploadError}</p>
                        )}

                        {/* Manual URL input (always visible; pre-filled after S3 upload) */}
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="url"
                            value={slot.downloadUrl}
                            onChange={(e) => updateSlot(os.key, { downloadUrl: e.target.value })}
                            placeholder="https://… or paste S3 URL"
                            className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {slot.downloadUrl && (
                            <a
                              href={slot.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!s3Configured && (
                  <p className="mt-2 text-xs text-gray-400">
                    S3 not configured — upload files manually and paste public URLs above.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetModal(); }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || OS_PLATFORMS.every((p) => !slots[p.key].downloadUrl)}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2',
                    (creating || OS_PLATFORMS.every((p) => !slots[p.key].downloadUrl)) &&
                      'opacity-60 cursor-not-allowed'
                  )}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Publishing…
                    </>
                  ) : (
                    'Publish release'
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
