import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { useFeatureFlagStore } from '@/lib/store';
import { cn, formatDateTime } from '@/lib/utils';

interface FlagFormData {
  key: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
}

export function FeatureFlags() {
  const { flags, isLoading, fetchFlags, updateFlag, createFlag, deleteFlag } =
    useFeatureFlagStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<string | null>(null);
  const [formData, setFormData] = useState<FlagFormData>({
    key: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
  });

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const filteredFlags = flags.filter(
    (flag) =>
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggle = async (flag: (typeof flags)[0]) => {
    try {
      await updateFlag(flag.id, { enabled: !flag.enabled });
    } catch (error) {
      alert('Failed to update feature flag');
    }
  };

  const handleRolloutChange = async (
    flag: (typeof flags)[0],
    value: number
  ) => {
    try {
      await updateFlag(flag.id, { rollout_percentage: value });
      setEditingFlag(null);
    } catch (error) {
      alert('Failed to update rollout percentage');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFlag(formData);
      setShowAddModal(false);
      setFormData({
        key: '',
        description: '',
        enabled: false,
        rollout_percentage: 0,
      });
    } catch (error) {
      alert('Failed to create feature flag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    try {
      await deleteFlag(id);
    } catch (error) {
      alert('Failed to delete feature flag');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Feature Flags
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage feature rollouts and experiments
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Flag
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search flags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rollout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredFlags.length > 0 ? (
                filteredFlags.map((flag) => (
                  <tr
                    key={flag.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {flag.key}
                        </p>
                        {flag.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {flag.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(flag)}
                        className={cn(
                          'flex items-center gap-2 text-sm font-medium',
                          flag.enabled ? 'text-green-600' : 'text-gray-500'
                        )}
                      >
                        {flag.enabled ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {editingFlag === flag.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            defaultValue={flag.rollout_percentage}
                            onBlur={(e) =>
                              handleRolloutChange(
                                flag,
                                parseInt(e.target.value) || 0
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRolloutChange(
                                  flag,
                                  parseInt(e.currentTarget.value) || 0
                                );
                              }
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingFlag(flag.id)}
                          className="text-sm text-gray-700 hover:text-blue-600"
                        >
                          {flag.rollout_percentage}%
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(flag.updated_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(flag.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchQuery
                      ? 'No flags match your search'
                      : 'No feature flags yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Flag Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Feature Flag
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key *
                </label>
                <input
                  type="text"
                  required
                  value={formData.key}
                  onChange={(e) =>
                    setFormData({ ...formData, key: e.target.value })
                  }
                  placeholder="e.g., new_feature_v2"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What does this flag control?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollout Percentage
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.rollout_percentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rollout_percentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.enabled}
                  onChange={(e) =>
                    setFormData({ ...formData, enabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="enabled"
                  className="text-sm font-medium text-gray-700"
                >
                  Enable immediately
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Create Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
