import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterForm } from '../components/Auth/RegisterForm';

export function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    const result = await register(email, password);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result.requiresVerification) {
      setVerificationSent(true);
      setVerificationMessage(result.message || 'Veuillez verifier votre email pour activer votre compte.');
      setIsLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // Show verification success message
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex flex-col">
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 3h16a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7H4a1 1 0 01-1-1V4a1 1 0 011-1zm4 4v12h8V7H8zm2 2h4v2h-4V9z"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-stone-800">Beer Label Editor</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8 text-center border border-stone-100">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-2">
                Verifiez votre email
              </h1>
              <p className="text-stone-600 mb-6">
                {verificationMessage}
              </p>
              <p className="text-sm text-stone-400 mb-6">
                Consultez votre boite de reception (et les spams) pour trouver le lien de verification.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/25"
              >
                Aller a la connexion
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            Rejoignez-nous
          </h2>
          <p className="text-amber-200/70 text-center max-w-sm text-lg mb-12">
            Creez votre compte et commencez a designer vos etiquettes des maintenant.
          </p>

          {/* Benefits */}
          <div className="space-y-4 w-full max-w-sm">
            {[
              { icon: 'M5 13l4 4L19 7', text: 'Gratuit pour commencer, sans carte bancaire' },
              { icon: 'M5 13l4 4L19 7', text: 'Sauvegarde automatique de vos projets' },
              { icon: 'M5 13l4 4L19 7', text: 'Export PDF pret pour l\'impression' },
              { icon: 'M5 13l4 4L19 7', text: '60+ polices Google et templates inclus' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/5 rounded-xl p-4 backdrop-blur-sm">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={benefit.icon} />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{benefit.text}</span>
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
                Creer votre compte
              </h1>
              <p className="text-stone-500">
                Commencez a creer des etiquettes de biere uniques et professionnelles.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100">
              <RegisterForm
                onSubmit={handleSubmit}
                error={error}
                isLoading={isLoading}
              />
            </div>

            <p className="text-center text-stone-400 text-xs mt-8">
              En creant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialite.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
