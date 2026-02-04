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
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-stone-900">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Beer Label Editor</span>
            </div>
            <nav className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
                >
                  Mon Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-amber-200 hover:text-white font-medium transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
                  >
                    Commencer
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-60 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-full text-amber-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Application gratuite et sans inscription obligatoire
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Créez des étiquettes de bière{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                professionnelles
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-amber-100/80 mb-10 max-w-2xl mx-auto">
              L'outil ultime pour les brasseurs artisanaux. Concevez, personnalisez et exportez 
              vos étiquettes en haute résolution, prêtes pour l'impression.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/editor"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-lg font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer une étiquette
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white text-lg font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-amber-500/30 hover:shadow-amber-400/40 hover:scale-105"
                  >
                    Commencer gratuitement
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-2xl transition-all duration-200 backdrop-blur-sm border border-white/20"
                  >
                    J'ai déjà un compte
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: '5+', label: 'Formats disponibles' },
              { value: '60+', label: 'Polices Google' },
              { value: '300', label: 'DPI export' },
              { value: '100%', label: 'Gratuit' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-amber-200/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 lg:py-32 bg-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-amber-200/70 text-lg max-w-2xl mx-auto">
              Des outils professionnels pour créer des étiquettes uniques qui reflètent 
              l'identité de votre brasserie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                ),
                title: 'Formats standards',
                description: 'Bouteilles 33cl, 75cl, canettes... Tous les formats professionnels prêts à utiliser.',
                color: 'amber',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                ),
                title: 'Design complet',
                description: 'Textes stylisés, images, formes, ombres, dégradés. Tout pour un rendu professionnel.',
                color: 'orange',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Import d\'images',
                description: 'Ajoutez vos logos, photos et illustrations directement depuis votre ordinateur.',
                color: 'yellow',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                ),
                title: 'QR Codes intégrés',
                description: 'Générez des QR codes personnalisables pour renvoyer vers votre site ou vos réseaux.',
                color: 'emerald',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Export PDF HD',
                description: 'Exportez en 300 DPI pour une qualité d\'impression professionnelle impeccable.',
                color: 'blue',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: 'Sauvegarde cloud',
                description: 'Vos projets sont sauvegardés automatiquement. Reprenez où vous en étiez.',
                color: 'purple',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-b from-stone-800 to-stone-800/50 rounded-2xl p-6 border border-stone-700/50 hover:border-amber-500/50 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-${feature.color}-500/20 text-${feature.color}-400 mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-stone-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-stone-900 to-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Simple comme 1, 2, 3
            </h2>
            <p className="text-amber-200/70 text-lg">
              Créez votre première étiquette en quelques minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                title: 'Choisissez un format',
                description: 'Sélectionnez le format adapté à votre bouteille ou canette parmi nos modèles.',
              },
              {
                step: '02',
                title: 'Personnalisez',
                description: 'Ajoutez textes, images, formes et couleurs pour créer votre design unique.',
              },
              {
                step: '03',
                title: 'Exportez',
                description: 'Téléchargez votre étiquette en PDF haute résolution, prête à imprimer.',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-bold text-amber-500/20 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-amber-200/70">{item.description}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 text-amber-500/30">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAtMThjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTE4IDBjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Prêt à créer votre première étiquette ?
          </h2>
          <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto">
            Rejoignez les brasseurs qui font confiance à Beer Label Editor pour leurs créations.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-amber-50 text-amber-600 text-lg font-semibold rounded-2xl transition-all duration-200 shadow-xl hover:scale-105"
            >
              Créer mon compte gratuit
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Beer Label Editor</span>
            </div>
            <p className="text-stone-500 text-sm">
              Application de création d'étiquettes de bière artisanale
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
