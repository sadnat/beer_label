import { useState, useEffect } from 'react';
import { api, AuditLogEntry } from '../../services/api';

export function AdminAudit() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadAuditLog();
  }, [page, actionFilter]);

  const loadAuditLog = async () => {
    setIsLoading(true);
    setError(null);

    const filters: { action?: string } = {};
    if (actionFilter) filters.action = actionFilter;

    const { data, error: apiError } = await api.getAuditLog(page, 50, filters);
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setEntries(data.entries);
      setTotal(data.total);
      setPages(data.pages);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionLabel = (action: string): { label: string; color: string } => {
    const actions: Record<string, { label: string; color: string }> = {
      ban_user: { label: 'Bannissement', color: 'bg-red-100 text-red-700' },
      unban_user: { label: 'Débannissement', color: 'bg-green-100 text-green-700' },
      delete_user: { label: 'Suppression utilisateur', color: 'bg-red-100 text-red-700' },
      change_role: { label: 'Changement de rôle', color: 'bg-purple-100 text-purple-700' },
      change_plan: { label: 'Changement de plan', color: 'bg-blue-100 text-blue-700' },
    };
    return actions[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
  };

  const uniqueActions = [...new Set(entries.map(e => e.action))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par action</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Toutes les actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>{getActionLabel(action).label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {total} entrée{total > 1 ? 's' : ''} au total
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">
            {error}
            <button onClick={loadAuditLog} className="ml-4 underline">Réessayer</button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Aucune entrée dans le journal</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry) => {
                  const actionInfo = getActionLabel(entry.action);
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-800">{entry.admin_email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {entry.details && (
                          <div className="text-sm text-gray-600 max-w-xs">
                            {'email' in entry.details && (
                              <p><span className="text-gray-400">Email:</span> {String(entry.details.email)}</p>
                            )}
                            {'reason' in entry.details && (
                              <p><span className="text-gray-400">Raison:</span> {String(entry.details.reason)}</p>
                            )}
                            {'oldRole' in entry.details && 'newRole' in entry.details && (
                              <p>
                                <span className="text-gray-400">Rôle:</span>{' '}
                                {String(entry.details.oldRole)} → {String(entry.details.newRole)}
                              </p>
                            )}
                            {'oldPlan' in entry.details && 'newPlan' in entry.details && (
                              <p>
                                <span className="text-gray-400">Plan:</span>{' '}
                                {String(entry.details.oldPlan)} → {String(entry.details.newPlan)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {entry.ip_address || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} / {pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setPage(Math.min(pages, page + 1))}
                    disabled={page === pages}
                    className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
