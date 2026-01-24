import { useState, useEffect } from 'react';
import { api, AdminUser, AdminUserDetails, Plan } from '../../services/api';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState<'all' | 'banned' | 'admin'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User details modal
  const [selectedUser, setSelectedUser] = useState<AdminUserDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Ban modal
  const [banModalUser, setBanModalUser] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  // Delete modal
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Plan change modal
  const [planModalUser, setPlanModalUser] = useState<AdminUserDetails | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search, filter]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data } = await api.getAdminPlans();
    if (data) {
      setPlans(data.plans);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    const filters: { is_banned?: boolean; role?: string } = {};
    if (filter === 'banned') filters.is_banned = true;
    if (filter === 'admin') filters.role = 'admin';

    const { data, error: apiError } = await api.getAdminUsers(page, 20, search, filters);
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleViewDetails = async (userId: string) => {
    setIsLoadingDetails(true);
    const { data, error: apiError } = await api.getAdminUserDetails(userId);
    if (data) {
      setSelectedUser(data.user);
    } else if (apiError) {
      alert(apiError);
    }
    setIsLoadingDetails(false);
  };

  const handleBan = async () => {
    if (!banModalUser) return;
    setIsBanning(true);
    const { error: apiError } = await api.banUser(banModalUser.id, banReason);
    if (apiError) {
      alert(apiError);
    } else {
      loadUsers();
      setBanModalUser(null);
      setBanReason('');
    }
    setIsBanning(false);
  };

  const handleUnban = async (userId: string) => {
    if (!confirm('Débannir cet utilisateur ?')) return;
    const { error: apiError } = await api.unbanUser(userId);
    if (apiError) {
      alert(apiError);
    } else {
      loadUsers();
      if (selectedUser?.id === userId) {
        handleViewDetails(userId);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    const { error: apiError } = await api.deleteUserAsAdmin(deleteModalUser.id);
    if (apiError) {
      alert(apiError);
    } else {
      loadUsers();
      setDeleteModalUser(null);
      if (selectedUser?.id === deleteModalUser.id) {
        setSelectedUser(null);
      }
    }
    setIsDeleting(false);
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    if (!confirm(`Changer le rôle en "${newRole}" ?`)) return;
    const { error: apiError } = await api.changeUserRole(userId, newRole);
    if (apiError) {
      alert(apiError);
    } else {
      loadUsers();
      if (selectedUser?.id === userId) {
        handleViewDetails(userId);
      }
    }
  };

  const handleChangePlan = async () => {
    if (!planModalUser || !selectedPlanId) return;
    setIsChangingPlan(true);
    const { error: apiError } = await api.changeUserPlan(planModalUser.id, selectedPlanId);
    if (apiError) {
      alert(apiError);
    } else {
      loadUsers();
      if (selectedUser?.id === planModalUser.id) {
        handleViewDetails(planModalUser.id);
      }
      setPlanModalUser(null);
      setSelectedPlanId('');
    }
    setIsChangingPlan(false);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
          <div className="flex gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Tous
            </button>
            <button
              onClick={() => { setFilter('banned'); setPage(1); }}
              className={`px-4 py-2 rounded-lg transition ${filter === 'banned' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Bannis
            </button>
            <button
              onClick={() => { setFilter('admin'); setPage(1); }}
              className={`px-4 py-2 rounded-lg transition ${filter === 'admin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">
            {error}
            <button onClick={loadUsers} className="ml-4 underline">Réessayer</button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Aucun utilisateur trouvé</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-medium">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="text-xs text-purple-600 font-medium">Admin</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.plan_name || 'Sans plan'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.projects_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_banned ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Banni
                        </span>
                      ) : user.email_verified ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                          Actif
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Non vérifié
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(user.id)}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition"
                          title="Voir détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {user.role !== 'admin' && (
                          <>
                            {user.is_banned ? (
                              <button
                                onClick={() => handleUnban(user.id)}
                                className="p-1.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded transition"
                                title="Débannir"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => setBanModalUser(user)}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                                title="Bannir"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteModalUser(user)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Supprimer"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pages > 1 && (
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {total} utilisateur{total > 1 ? 's' : ''} au total
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {page} / {pages}
                  </span>
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

      {/* User Details Modal */}
      {(selectedUser || isLoadingDetails) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            {isLoadingDetails ? (
              <div className="p-8 flex justify-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedUser && (
              <>
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold text-gray-800">Détails utilisateur</h2>
                  <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{selectedUser.email}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {selectedUser.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                        {selectedUser.is_banned ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Banni</span>
                        ) : selectedUser.email_verified ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Actif</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Non vérifié</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ban reason if applicable */}
                  {selectedUser.is_banned && selectedUser.ban_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-red-800">Raison du bannissement:</p>
                      <p className="text-sm text-red-700 mt-1">{selectedUser.ban_reason}</p>
                      <p className="text-xs text-red-500 mt-2">Banni le {formatDate(selectedUser.banned_at!)}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Inscription</p>
                      <p className="font-medium text-gray-800">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium text-gray-800">{selectedUser.subscription?.plan_name || 'Sans plan'}</p>
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Projets ({selectedUser.projects.length})</h4>
                    {selectedUser.projects.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-auto">
                        {selectedUser.projects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <span className="font-medium text-gray-700">{project.name}</span>
                            <span className="text-xs text-gray-500">{formatDate(project.updated_at)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun projet</p>
                    )}
                  </div>

                  {/* Actions */}
                  {selectedUser.role !== 'admin' && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <button
                        onClick={() => handleChangeRole(selectedUser.id, selectedUser.role === 'admin' ? 'user' : 'admin')}
                        className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition"
                      >
                        Promouvoir admin
                      </button>
                      <button
                        onClick={() => { setPlanModalUser(selectedUser); setSelectedPlanId(selectedUser.subscription?.plan_id || ''); }}
                        className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                      >
                        Changer le plan
                      </button>
                      {selectedUser.is_banned ? (
                        <button
                          onClick={() => handleUnban(selectedUser.id)}
                          className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition"
                        >
                          Débannir
                        </button>
                      ) : (
                        <button
                          onClick={() => { setBanModalUser(selectedUser); setSelectedUser(null); }}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                        >
                          Bannir
                        </button>
                      )}
                      <button
                        onClick={() => { setDeleteModalUser(selectedUser); setSelectedUser(null); }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Bannir l'utilisateur</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Vous allez bannir <strong>{banModalUser.email}</strong>. Cette action empêchera l'utilisateur de se connecter.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison (optionnel)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Raison du bannissement..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => { setBanModalUser(null); setBanReason(''); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleBan}
                disabled={isBanning}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isBanning ? 'Bannissement...' : 'Bannir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-red-600">Supprimer l'utilisateur</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                Vous allez supprimer définitivement <strong>{deleteModalUser.email}</strong> et tous ses projets. Cette action est irréversible.
              </p>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Changer le plan</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Changer le plan de <strong>{planModalUser.email}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau plan
                </label>
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${selectedPlanId === plan.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{plan.name}</p>
                        <p className="text-sm text-gray-500">
                          {plan.price_monthly === 0 ? 'Gratuit' : `${plan.price_monthly}€/mois`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => { setPlanModalUser(null); setSelectedPlanId(''); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePlan}
                disabled={isChangingPlan || !selectedPlanId}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition disabled:opacity-50"
              >
                {isChangingPlan ? 'Modification...' : 'Modifier le plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
