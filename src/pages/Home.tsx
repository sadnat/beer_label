import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export function HomePage() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.body.classList.add('overflow-auto-body');
    return () => {
      document.body.classList.remove('overflow-auto-body');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-amber-700 flex items-center gap-2">
          <span className="text-3xl">🍺</span>
          Beer Label Editor
        </div>
        <nav className="flex gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition"
            >
              Mon Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-6 py-2 text-amber-700 hover:text-amber-800 font-semibold transition"
              >
                Connexion
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Créez vos étiquettes de bière<br />
            <span className="text-amber-600">professionnelles</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Concevez des étiquettes personnalisées pour vos bières artisanales.
            Exportez en PDF haute résolution, prêt pour l'impression.
          </p>
          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/editor"
                className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
              >
                Créer une étiquette
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
                >
                  Commencer gratuitement
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white hover:bg-gray-50 text-amber-600 text-lg font-semibold rounded-lg transition shadow-lg hover:shadow-xl border border-amber-200"
                >
                  J'ai déjà un compte
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📐</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Formats standards
            </h3>
            <p className="text-gray-600">
              5 formats prédéfinis pour bouteilles et canettes.
              Dimensions professionnelles conformes aux standards.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Design complet
            </h3>
            <p className="text-gray-600">
              Textes, images, formes, 60+ polices Google.
              Personnalisez chaque détail de votre étiquette.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Export haute qualité
            </h3>
            <p className="text-gray-600">
              Export PDF 300 DPI prêt pour l'impression.
              Impression multiple sur feuille A4.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-amber-500 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à créer votre première étiquette ?
          </h2>
          <p className="text-amber-100 mb-8 text-lg">
            Inscription gratuite, sans carte bancaire.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-block px-8 py-4 bg-white text-amber-600 text-lg font-semibold rounded-lg transition hover:bg-amber-50 shadow-lg"
            >
              Créer mon compte gratuit
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        <p>Beer Label Editor - Application de création d'étiquettes de bière</p>
      </footer>
    </div>
  );
}
