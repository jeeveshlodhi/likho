import { useEffect, useRef } from 'react';
import {
  Users,
  Activity,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useDashboardStore } from '@/lib/store';
import {
  formatNumber,
  formatRelativeTime,
  getFeedbackTypeColor,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

const statCards = [
  {
    name: 'Total Users',
    key: 'total_users' as const,
    icon: Users,
    color: 'blue',
  },
  {
    name: 'Active Today',
    key: 'active_today' as const,
    icon: Activity,
    color: 'green',
  },
  {
    name: 'Feedback Count',
    key: 'feedback_count' as const,
    icon: MessageSquare,
    color: 'purple',
  },
  {
    name: 'Errors (24h)',
    key: 'error_count_24h' as const,
    icon: AlertCircle,
    color: 'red',
  },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard() {
  const {
    stats,
    versionDistribution,
    recentFeedback,
    recentErrors,
    isLoading,
    lastUpdated,
    fetchDashboard,
  } = useDashboardStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchDashboard();

    // Set up polling every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchDashboard();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchDashboard]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your Likho beta metrics
          </p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Last updated */}
      {lastUpdated && (
        <p className="text-xs text-gray-400">
          Last updated: {formatRelativeTime(lastUpdated)}
        </p>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;

          return (
            <div
              key={card.name}
              className="p-6 bg-white border border-gray-200 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {card.name}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {isLoading ? (
                      <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      formatNumber(value)
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    card.color === 'blue' && 'bg-blue-50',
                    card.color === 'green' && 'bg-green-50',
                    card.color === 'purple' && 'bg-purple-50',
                    card.color === 'red' && 'bg-red-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      card.color === 'blue' && 'text-blue-600',
                      card.color === 'green' && 'text-green-600',
                      card.color === 'purple' && 'text-purple-600',
                      card.color === 'red' && 'text-red-600'
                    )}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Version Distribution Chart */}
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <h2 className="text-lg font-medium text-gray-900">
            App Version Distribution
          </h2>
          <div className="mt-6 h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse" />
              </div>
            ) : versionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={versionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="version"
                  >
                    {versionDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                    formatter={(value: number, _name: string, props: any) => [
                      `${value} users (${props.payload.percentage}%)`,
                      `v${props.payload.version}`,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No data available
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {versionDistribution.map((entry, index) => (
              <div key={entry.version} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">
                  v{entry.version} ({entry.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="p-6 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Feedback
            </h2>
            <a
              href="/feedback"
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-6 space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))
            ) : recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {feedback.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {feedback.content}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        <span>{feedback.user_email || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(feedback.created_at)}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap',
                        getFeedbackTypeColor(feedback.type)
                      )}
                    >
                      {feedback.type}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No feedback yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="p-6 bg-white border border-gray-200 rounded-xl">
        <h2 className="text-lg font-medium text-gray-900">Recent Errors</h2>
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-gray-50 rounded-lg animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : recentErrors.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentErrors.map((error) => (
                <div
                  key={error.id}
                  className="py-4 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        error.resolved ? 'bg-green-50' : 'bg-red-50'
                      )}
                    >
                      <AlertCircle
                        className={cn(
                          'w-4 h-4',
                          error.resolved ? 'text-green-600' : 'text-red-600'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {error.error_type}
                      </p>
                      <p className="text-sm text-gray-500">{error.message}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        {error.user_id && <span>User: {error.user_id}</span>}
                        {error.app_version && (
                          <>
                            <span>•</span>
                            <span>v{error.app_version}</span>
                          </>
                        )}
                        {error.platform && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{error.platform}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(error.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No errors in the last 24 hours 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
