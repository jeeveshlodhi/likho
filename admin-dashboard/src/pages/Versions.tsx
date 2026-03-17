import { useEffect, useState } from 'react';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Smartphone,
  Monitor,
  Globe,
  Terminal,
  Apple,
  Star,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useVersionStore } from '@/lib/store';
import { activeApi } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppVersion } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlatformValue = AppVersion['platform'];

interface VersionFormData {
  version: string;
  platform: PlatformValue;
  release_notes: string;
  release_summary: string;
  force_update: boolean;
  is_latest: boolean;
  min_required_version: string;
  download_url: string;
  build_number: string;
}

const platformMeta: Record<string, { label: string; icon: React.ReactNode }> = {
  ios: { label: 'iOS', icon: <Smartphone className="w-4 h-4" /> },
  android: { label: 'Android', icon: <Smartphone className="w-4 h-4" /> },
  desktop: { label: 'Desktop', icon: <Monitor className="w-4 h-4" /> },
  all: { label: 'All desktop', icon: <Monitor className="w-4 h-4" /> },
  macos: { label: 'macOS', icon: <Apple className="w-4 h-4" /> },
  windows: { label: 'Windows', icon: <Monitor className="w-4 h-4 text-blue-600" /> },
  linux: { label: 'Linux', icon: <Terminal className="w-4 h-4 text-orange-500" /> },
  web: { label: 'Web', icon: <Globe className="w-4 h-4" /> },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function VersionsPage() {
  const { versions, isLoading, fetchVersions, createVersion, updateVersion, deleteVersion } =
    useVersionStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('');
  const [togglingLatest, setTogglingLatest] = useState<string | null>(null);

  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    platform: 'all',
    release_notes: '',
    release_summary: '',
    force_update: false,
    is_latest: false,
    min_required_version: '',
    download_url: '',
    build_number: '',
  });

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const displayed = filterPlatform
    ? versions.filter((v) => v.platform === filterPlatform)
    : versions;

  const groupedVersions = displayed.reduce((acc, version) => {
    if (!acc[version.platform]) acc[version.platform] = [];
    acc[version.platform].push(version);
    return acc;
  }, {} as Record<string, AppVersion[]>);

  const platformOptions = Array.from(new Set(versions.map((v) => v.platform)));

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await createVersion({
        ...formData,
        build_number: formData.build_number ? Number(formData.build_number) : undefined,
        released_at: new Date().toISOString(),
      });
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create version');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;
    setFormError(null);
    setSaving(true);
    try {
      await updateVersion(editingVersion.id, {
        ...formData,
        build_number: formData.build_number ? Number(formData.build_number) : undefined,
      });
      setEditingVersion(null);
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update version');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this version? This cannot be undone.')) return;
    try {
      await deleteVersion(id);
    } catch {
      alert('Failed to delete version');
    }
  };

  const handleToggleLatest = async (version: AppVersion) => {
    setTogglingLatest(version.id);
    try {
      await updateVersion(version.id, { is_latest: !version.is_latest });
    } catch {
      alert('Failed to update version');
    } finally {
      setTogglingLatest(null);
    }
  };

  const startEdit = (version: AppVersion) => {
    setEditingVersion(version);
    setFormData({
      version: version.version,
      platform: version.platform,
      release_notes: version.release_notes || '',
      release_summary: version.release_summary || '',
      force_update: version.force_update,
      is_latest: version.is_latest,
      min_required_version: version.min_required_version || '',
      download_url: version.download_url || '',
      build_number: version.build_number ? String(version.build_number) : '',
    });
  };

  const resetForm = () => {
    setFormData({
      version: '',
      platform: 'all',
      release_notes: '',
      release_summary: '',
      force_update: false,
      is_latest: false,
      min_required_version: '',
      download_url: '',
      build_number: '',
    });
    setFormError(null);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingVersion(null);
    resetForm();
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">App Versions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage releases, update policy, and per-platform download URLs
          </p>
        </div>
        <div className="flex items-center gap-2">
          {platformOptions.length > 1 && (
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All platforms</option>
              {platformOptions.map((p) => (
                <option key={p} value={p}>
                  {platformMeta[p]?.label ?? p}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add version
          </button>
        </div>
      </div>

      {/* Version grid */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedVersions).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedVersions).map(([platform, pvs]) => (
            <div key={platform}>
              <h2 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                {platformMeta[platform]?.icon}
                {platformMeta[platform]?.label ?? platform}
                <span className="text-xs text-gray-400 font-normal">({pvs.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...pvs]
                  .sort(
                    (a, b) =>
                      new Date(b.released_at || 0).getTime() -
                      new Date(a.released_at || 0).getTime()
                  )
                  .map((version) => (
                    <div
                      key={version.id}
                      className={cn(
                        'p-4 border rounded-xl transition-shadow hover:shadow-md',
                        version.force_update
                          ? 'border-red-200 bg-red-50/30'
                          : version.is_latest
                          ? 'border-blue-200 bg-blue-50/20'
                          : 'border-gray-200 bg-white'
                      )}
                    >
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                              version.force_update
                                ? 'bg-red-100'
                                : version.is_latest
                                ? 'bg-blue-100'
                                : 'bg-gray-100'
                            )}
                          >
                            <Package
                              className={cn(
                                'w-4 h-4',
                                version.force_update
                                  ? 'text-red-600'
                                  : version.is_latest
                                  ? 'text-blue-600'
                                  : 'text-gray-500'
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-gray-900 text-sm">
                                v{version.version}
                              </h3>
                              {version.is_latest && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  latest
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {version.released_at ? formatDateTime(version.released_at) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleToggleLatest(version)}
                            disabled={togglingLatest === version.id}
                            title={version.is_latest ? 'Unmark as latest' : 'Mark as latest'}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              version.is_latest
                                ? 'text-blue-500 hover:bg-blue-50'
                                : 'text-gray-300 hover:text-yellow-500 hover:bg-yellow-50'
                            )}
                          >
                            {togglingLatest === version.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Star className="w-3.5 h-3.5" fill={version.is_latest ? 'currentColor' : 'none'} />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(version)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(version.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Release notes */}
                      {version.release_notes && (
                        <p className="mt-2.5 text-xs text-gray-600 line-clamp-2">
                          {version.release_notes}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {version.force_update && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs text-red-600 bg-red-50 rounded-full border border-red-100">
                            <AlertTriangle className="w-3 h-3" /> Force update
                          </span>
                        )}
                        {version.min_required_version && (
                          <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                            min v{version.min_required_version}
                          </span>
                        )}
                        {version.build_number && (
                          <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                            build {version.build_number}
                          </span>
                        )}
                        {formatBytes(version.file_size) && (
                          <span className="px-2 py-0.5 text-xs text-gray-500 bg-gray-50 rounded-full border border-gray-100">
                            {formatBytes(version.file_size)}
                          </span>
                        )}
                      </div>

                      {/* Download link */}
                      {version.download_url && (
                        <a
                          href={version.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{version.download_url}</span>
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900">No versions yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first app version to get started.</p>
        </div>
      )}

      {/* Add / Edit modal */}
      {(showAddModal || editingVersion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingVersion ? 'Edit version' : 'Add version'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingVersion ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex gap-2 items-start">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {formError}
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
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value as PlatformValue })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All desktop</option>
                    <option value="macos">macOS</option>
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Download URL</label>
                <input
                  type="url"
                  value={formData.download_url}
                  onChange={(e) => setFormData({ ...formData, download_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Release notes</label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                  placeholder="What's new?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Release summary <span className="text-gray-400 font-normal">(optional short description)</span>
                </label>
                <input
                  type="text"
                  value={formData.release_summary}
                  onChange={(e) => setFormData({ ...formData, release_summary: e.target.value })}
                  placeholder="One-line summary…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min required version</label>
                  <input
                    type="text"
                    value={formData.min_required_version}
                    onChange={(e) => setFormData({ ...formData, min_required_version: e.target.value })}
                    placeholder="0.9.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Build number</label>
                  <input
                    type="number"
                    value={formData.build_number}
                    onChange={(e) => setFormData({ ...formData, build_number: e.target.value })}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-5 pt-1">
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

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2',
                    saving && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : editingVersion ? (
                    'Save changes'
                  ) : (
                    'Create version'
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
