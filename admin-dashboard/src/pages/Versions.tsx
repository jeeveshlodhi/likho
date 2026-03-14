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
} from 'lucide-react';
import { useVersionStore } from '@/lib/store';
import { cn, formatDateTime } from '@/lib/utils';
import type { AppVersion } from '@/types';

interface VersionFormData {
  version: string;
  platform: 'ios' | 'android' | 'desktop' | 'web' | 'all';
  release_notes: string;
  force_update: boolean;
  min_required_version: string;
  download_url: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  ios: <Smartphone className="w-4 h-4" />,
  android: <Smartphone className="w-4 h-4" />,
  desktop: <Monitor className="w-4 h-4" />,
  web: <Globe className="w-4 h-4" />,
};

export function VersionsPage() {
  const {
    versions,
    isLoading,
    fetchVersions,
    createVersion,
    updateVersion,
    deleteVersion,
  } = useVersionStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVersion, setEditingVersion] = useState<AppVersion | null>(null);
  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    platform: 'web',
    release_notes: '',
    force_update: false,
    min_required_version: '',
    download_url: '',
  });

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVersion({
        ...formData,
        released_at: new Date().toISOString(),
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      alert('Failed to create version');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVersion) return;
    try {
      await updateVersion(editingVersion.id, formData);
      setEditingVersion(null);
      resetForm();
    } catch (error) {
      alert('Failed to update version');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this version?')) return;
    try {
      await deleteVersion(id);
    } catch (error) {
      alert('Failed to delete version');
    }
  };

  const startEdit = (version: AppVersion) => {
    setEditingVersion(version);
    setFormData({
      version: version.version,
      platform: version.platform,
      release_notes: version.release_notes || '',
      force_update: version.force_update,
      min_required_version: version.min_required_version || '',
      download_url: version.download_url || '',
    });
  };

  const resetForm = () => {
    setFormData({
      version: '',
      platform: 'web',
      release_notes: '',
      force_update: false,
      min_required_version: '',
      download_url: '',
    });
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingVersion(null);
    resetForm();
  };

  // Group versions by platform
  const groupedVersions = versions.reduce((acc, version) => {
    if (!acc[version.platform]) {
      acc[version.platform] = [];
    }
    acc[version.platform].push(version);
    return acc;
  }, {} as Record<string, AppVersion[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            App Versions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage app releases and version requirements
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Version
        </button>
      </div>

      {/* Versions by Platform */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-40 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedVersions).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedVersions).map(([platform, platformVersions]) => (
            <div key={platform}>
              <h2 className="text-lg font-medium text-gray-900 mb-4 capitalize flex items-center gap-2">
                {platformIcons[platform]}
                {platform}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformVersions
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
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              version.force_update
                                ? 'bg-red-100'
                                : 'bg-blue-100'
                            )}
                          >
                            <Package
                              className={cn(
                                'w-5 h-5',
                                version.force_update
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                              )}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              v{version.version}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Released{' '}
                              {version.released_at
                                ? formatDateTime(version.released_at)
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(version)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(version.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {version.release_notes && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {version.release_notes}
                        </p>
                      )}

                      <div className="mt-4 space-y-2">
                        {version.force_update && (
                          <div className="flex items-center gap-2 text-xs text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Force update required</span>
                          </div>
                        )}
                        {version.min_required_version && (
                          <p className="text-xs text-gray-500">
                            Min required: v{version.min_required_version}
                          </p>
                        )}
                        {version.download_url && (
                          <a
                            href={version.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline block truncate"
                          >
                            Download link →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No versions yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first app version to get started
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingVersion) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingVersion ? 'Edit Version' : 'Add Version'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={editingVersion ? handleUpdate : handleCreate}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    placeholder="e.g., 1.0.0"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        platform: e.target.value as VersionFormData['platform'],
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="all">All (single desktop URL)</option>
                    <option value="web">Web</option>
                    <option value="ios">iOS</option>
                    <option value="android">Android</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Release Notes
                </label>
                <textarea
                  value={formData.release_notes}
                  onChange={(e) =>
                    setFormData({ ...formData, release_notes: e.target.value })
                  }
                  placeholder="What's new in this version?"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Download URL
                </label>
                <input
                  type="url"
                  value={formData.download_url}
                  onChange={(e) =>
                    setFormData({ ...formData, download_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Required Version
                </label>
                <input
                  type="text"
                  value={formData.min_required_version}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_required_version: e.target.value,
                    })
                  }
                  placeholder="e.g., 0.9.0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Users on versions older than this will be forced to update
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <input
                  type="checkbox"
                  id="force_update"
                  checked={formData.force_update}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      force_update: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <label
                    htmlFor="force_update"
                    className="text-sm font-medium text-red-700"
                  >
                    Force Update
                  </label>
                  <p className="text-xs text-red-600">
                    Require all users to update to this version
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingVersion ? 'Save Changes' : 'Create Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
