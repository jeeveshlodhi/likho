import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
} from 'lucide-react';
import { useRemoteConfigStore } from '@/lib/store';
import { cn, formatDateTime } from '@/lib/utils';
import type { RemoteConfig } from '@/types';

interface ConfigFormData {
  key: string;
  value: string;
  value_type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
}

export function RemoteConfigPage() {
  const {
    configs,
    isLoading,
    fetchConfigs,
    updateConfig,
    createConfig,
    deleteConfig,
  } = useRemoteConfigStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState<ConfigFormData>({
    key: '',
    value: '',
    value_type: 'string',
    description: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const filteredConfigs = configs.filter(
    (config) =>
      config.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (config: RemoteConfig) => {
    setEditingId(config.id);
    setEditValue(String(config.value));
  };

  const handleSaveEdit = async (config: RemoteConfig) => {
    try {
      let parsedValue: string | number | boolean = editValue;

      // Parse value based on type
      switch (config.value_type) {
        case 'number':
          parsedValue = parseFloat(editValue);
          if (isNaN(parsedValue)) {
            alert('Invalid number');
            return;
          }
          break;
        case 'boolean':
          parsedValue = editValue.toLowerCase() === 'true';
          break;
        case 'json':
          try {
            JSON.parse(editValue);
          } catch {
            alert('Invalid JSON');
            return;
          }
          break;
      }

      await updateConfig(config.id, { value: parsedValue });
      setEditingId(null);
    } catch (error) {
      alert('Failed to update config');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedValue: string | number | boolean = formData.value;

      switch (formData.value_type) {
        case 'number':
          parsedValue = parseFloat(formData.value);
          if (isNaN(parsedValue)) {
            alert('Invalid number');
            return;
          }
          break;
        case 'boolean':
          parsedValue = formData.value.toLowerCase() === 'true';
          break;
      }

      await createConfig({
        ...formData,
        value: parsedValue,
      });

      setShowAddModal(false);
      setFormData({
        key: '',
        value: '',
        value_type: 'string',
        description: '',
      });
    } catch (error) {
      alert('Failed to create config');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this config?')) return;
    try {
      await deleteConfig(id);
    } catch (error) {
      alert('Failed to delete config');
    }
  };

  const getValueTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      json: 'bg-orange-100 text-orange-800',
    };
    return (
      <span
        className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          colors[type] || colors.string
        )}
      >
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Remote Config
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage app configuration values
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Config
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search config keys..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Config Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white border border-gray-200 rounded-xl animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredConfigs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredConfigs.map((config) => (
            <div
              key={config.id}
              className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm text-gray-600">
                      {config.key}
                    </span>
                    {getValueTypeBadge(config.value_type)}
                  </div>

                  {editingId === config.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(config)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 block px-3 py-1.5 text-sm bg-gray-100 rounded-lg truncate">
                        {String(config.value)}
                      </code>
                      <button
                        onClick={() => handleStartEdit(config)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {config.description && (
                    <p className="mt-2 text-xs text-gray-500">
                      {config.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Updated {formatDateTime(config.updated_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No config values yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first remote config value to get started
          </p>
        </div>
      )}

      {/* Add Config Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Config Value
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
                  placeholder="e.g., max_upload_size"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.value_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value_type: e.target.value as ConfigFormData['value_type'],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value *
                </label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder={
                    formData.value_type === 'boolean'
                      ? 'true or false'
                      : 'Enter value...'
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.value_type === 'json' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Enter valid JSON (e.g., {"{"}key: "value"{"}"})
                  </p>
                )}
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
                  placeholder="What does this config control?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                  Create Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
