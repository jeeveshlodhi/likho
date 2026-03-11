import { useEffect, useState } from 'react';
import {
  Search,
  X,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFeedbackStore } from '@/lib/store';
import {
  cn,
  formatDateTime,
  formatRelativeTime,
  getFeedbackTypeColor,
  getFeedbackStatusColor,
} from '@/lib/utils';
import type { Feedback, FeedbackType, FeedbackStatus } from '@/types';

const typeOptions: { value: FeedbackType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'praise', label: 'Praise' },
  { value: 'other', label: 'Other' },
];

const statusOptions: { value: FeedbackStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export function FeedbackPage() {
  const {
    items,
    total,
    page,
    pages,
    isLoading,
    selectedFeedback,
    fetchFeedback,
    updateFeedback,
    setSelectedFeedback,
  } = useFeedbackStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | ''>('');
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchFeedback({ type: typeFilter, status: statusFilter, page: 1 });
  }, [typeFilter, statusFilter, fetchFeedback]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      fetchFeedback({ type: typeFilter, status: statusFilter, page: newPage });
    }
  };

  const handleViewDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setShowDetailModal(true);
  };

  const handleStatusChange = async (status: FeedbackStatus) => {
    if (!selectedFeedback) return;
    try {
      await updateFeedback(selectedFeedback.id, {
        status,
        admin_notes: adminNotes,
        resolved_at: status === 'resolved' ? new Date().toISOString() : undefined,
      });
      setShowDetailModal(false);
    } catch (error) {
      alert('Failed to update feedback');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;
    try {
      await updateFeedback(selectedFeedback.id, { admin_notes: adminNotes });
    } catch (error) {
      alert('Failed to save notes');
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage user feedback and support requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FeedbackType | '')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as FeedbackStatus | '')
            }
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredItems.map((feedback) => (
              <div
                key={feedback.id}
                onClick={() => handleViewDetail(feedback)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {feedback.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                          {feedback.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full border',
                            getFeedbackTypeColor(feedback.type)
                          )}
                        >
                          {feedback.type}
                        </span>
                        <span
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded-full border',
                            getFeedbackStatusColor(feedback.status)
                          )}
                        >
                          {feedback.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {feedback.user_email || 'Anonymous'}
                      </span>
                      {feedback.app_version && (
                        <span>v{feedback.app_version}</span>
                      )}
                      {feedback.platform && (
                        <span className="capitalize">{feedback.platform}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(feedback.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No feedback found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or search query
            </p>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of{' '}
              {total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pages}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50">
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full border',
                      getFeedbackTypeColor(selectedFeedback.type)
                    )}
                  >
                    {selectedFeedback.type}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full border',
                      getFeedbackStatusColor(selectedFeedback.status)
                    )}
                  >
                    {selectedFeedback.status.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedFeedback.title}
                </h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {selectedFeedback.user_email || 'Anonymous User'}
                  </p>
                  <div className="mt-1 text-sm text-gray-500 space-x-3">
                    {selectedFeedback.app_version && (
                      <span>v{selectedFeedback.app_version}</span>
                    )}
                    {selectedFeedback.platform && (
                      <span className="capitalize">
                        {selectedFeedback.platform}
                      </span>
                    )}
                    <span>{formatDateTime(selectedFeedback.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Feedback Content
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedFeedback.content}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              {selectedFeedback.metadata && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Additional Metadata
                  </h3>
                  <pre className="p-4 bg-gray-100 rounded-lg text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(selectedFeedback.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  onBlur={handleSaveNotes}
                  placeholder="Add internal notes about this feedback..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                {selectedFeedback.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                )}
                {selectedFeedback.status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                  >
                    <Clock className="w-4 h-4" />
                    In Progress
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
