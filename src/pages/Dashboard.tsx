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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-amber-700 flex items-center gap-2">
            <span className="text-3xl">🍺</span>
            Beer Label Editor
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mes projets</h1>
          <Link
            to="/editor"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle étiquette
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
            <button onClick={loadProjects} className="ml-4 underline">
              Réessayer
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun projet pour le moment
            </h2>
            <p className="text-gray-500 mb-6">
              Créez votre première étiquette de bière !
            </p>
            <Link
              to="/editor"
              className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition"
            >
              Créer ma première étiquette
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group"
              >
                {/* Thumbnail */}
                <Link to={`/editor/${project.id}`} className="block">
                  <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🏷️</div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link to={`/editor/${project.id}`}>
                    <h3 className="font-semibold text-gray-800 truncate group-hover:text-amber-600 transition">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {project.format_width} x {project.format_height} mm
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Modifié le {formatDate(project.updated_at)}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/editor/${project.id}`}
                      className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg text-center transition"
                    >
                      Ouvrir
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      disabled={deletingId === project.id}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {deletingId === project.id ? '...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
