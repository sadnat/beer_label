import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, ProjectSummary } from '../services/api';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Settings modal state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'password' | 'delete'>('password');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: apiError } = await api.getProjects();
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setProjects(data.projects);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le projet "${name}" ?`)) {
      return;
    }

    setDeletingId(id);
    const { error: deleteError } = await api.deleteProject(id);
    if (deleteError) {
      alert(`Erreur: ${deleteError}`);
    } else {
      setProjects(projects.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsChangingPassword(true);
    const { error: apiError } = await api.changePassword(currentPassword, newPassword);

    if (apiError) {
      setPasswordError(apiError);
    } else {
      setPasswordSuccess('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }

    setDeleteError(null);
    setIsDeletingAccount(true);

    const { error: apiError } = await api.deleteAccount();

    if (apiError) {
      setDeleteError(apiError);
      setIsDeletingAccount(false);
    } else {
      await logout();
      navigate('/');
    }
  };

  const openSettings = () => {
    setShowSettings(true);
    setSettingsTab('password');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(null);
    setDeleteConfirmText('');
    setDeleteError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-stone-800 hidden sm:block">Beer Label Editor</span>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={openSettings}
                className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                title="Paramètres"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-stone-200">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-stone-600 max-w-[150px] truncate">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 mb-2">
            {getGreeting()}, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-stone-500">
            Gérez vos projets d'étiquettes et créez-en de nouveaux.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-800">{projects.length}</div>
            <div className="text-sm text-stone-500">Projets créés</div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-800">Actif</div>
            <div className="text-sm text-stone-500">Statut du compte</div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-800">5</div>
            <div className="text-sm text-stone-500">Formats disponibles</div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-800">60+</div>
            <div className="text-sm text-stone-500">Polices Google</div>
          </div>
        </div>

        {/* Projects Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-stone-800">Mes projets</h2>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-white rounded-lg p-1 border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle étiquette
            </Link>
          </div>
        </div>

        {/* Projects Grid/List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-stone-500">Chargement de vos projets...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadProjects} className="font-medium hover:underline">
              Réessayer
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100">
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-stone-800 mb-2">
              Aucun projet pour le moment
            </h2>
            <p className="text-stone-500 mb-8 max-w-md mx-auto">
              Créez votre première étiquette de bière et donnez vie à vos créations artisanales !
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer ma première étiquette
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-xl hover:border-amber-200 transition-all duration-300"
              >
                <Link to={`/editor/${project.id}`} className="block">
                  <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-stone-200 rounded-2xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/editor/${project.id}`}>
                    <h3 className="font-semibold text-stone-800 truncate group-hover:text-amber-600 transition-colors">
                      {project.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2 text-sm text-stone-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                    </svg>
                    {project.format_width} x {project.format_height} mm
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDate(project.updated_at)}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/editor/${project.id}`}
                      className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl text-center transition-colors"
                    >
                      Ouvrir
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      disabled={deletingId === project.id}
                      className="px-4 py-2 bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-600 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                    >
                      {deletingId === project.id ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors ${
                  index !== projects.length - 1 ? 'border-b border-stone-100' : ''
                }`}
              >
                <div className="w-16 h-12 bg-stone-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/editor/${project.id}`} className="font-medium text-stone-800 hover:text-amber-600 transition-colors truncate block">
                    {project.name}
                  </Link>
                  <div className="text-sm text-stone-500">
                    {project.format_width} x {project.format_height} mm · {formatDate(project.updated_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/editor/${project.id}`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Ouvrir
                  </Link>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    disabled={deletingId === project.id}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === project.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h2 className="text-xl font-bold text-stone-800">Paramètres du compte</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100">
              <button
                onClick={() => setSettingsTab('password')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  settingsTab === 'password'
                    ? 'text-amber-600 border-b-2 border-amber-500 -mb-px'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Mot de passe
              </button>
              <button
                onClick={() => setSettingsTab('delete')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  settingsTab === 'delete'
                    ? 'text-red-600 border-b-2 border-red-500 -mb-px'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                Supprimer le compte
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {settingsTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                      required
                      minLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-shadow"
                      required
                      minLength={8}
                    />
                  </div>

                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                      {passwordSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                </form>
              )}

              {settingsTab === 'delete' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h3 className="text-red-800 font-semibold">Attention !</h3>
                        <p className="text-red-700 text-sm mt-1">
                          Cette action est irréversible. Tous vos projets seront définitivement supprimés.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      Tapez <span className="font-bold text-red-600">SUPPRIMER</span> pour confirmer
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-shadow"
                      placeholder="SUPPRIMER"
                    />
                  </div>

                  {deleteError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      {deleteError}
                    </div>
                  )}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmText !== 'SUPPRIMER'}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAccount ? 'Suppression...' : 'Supprimer mon compte définitivement'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
