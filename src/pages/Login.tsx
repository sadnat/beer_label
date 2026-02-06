import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/Auth/LoginForm';

export function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page they were trying to visit
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    const loginError = await login(email, password);

    if (loginError) {
      setError(loginError);
      setIsLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mb-8">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Beer Label Editor
          </h2>
          <p className="text-amber-200/70 text-center max-w-sm text-lg mb-12">
            Concevez des etiquettes de biere professionnelles en quelques minutes.
          </p>

          {/* Features list */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', text: 'Editeur visuel intuitif' },
              { icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z', text: 'Export PDF haute resolution' },
              { icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', text: 'Templates professionnels' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-stone-50 to-amber-50 flex flex-col">
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-stone-800 group-hover:text-amber-600 transition-colors lg:hidden">Beer Label Editor</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-stone-800 mb-2">
                Bon retour parmi nous
              </h1>
              <p className="text-stone-500">
                Connectez-vous pour retrouver vos projets d'etiquettes.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100">
              <LoginForm
                onSubmit={handleSubmit}
                error={error}
                isLoading={isLoading}
              />
            </div>

            <p className="text-center text-stone-400 text-xs mt-8">
              En vous connectant, vous acceptez nos conditions d'utilisation.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
