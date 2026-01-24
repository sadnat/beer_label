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
      // Show verification message
      setVerificationSent(true);
      setVerificationMessage(result.message || 'Veuillez vérifier votre email pour activer votre compte.');
      setIsLoading(false);
    } else {
      // Registration successful, redirect to dashboard
      navigate('/dashboard', { replace: true });
    }
  };

  // Show verification success message
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
        <header className="p-4">
          <Link to="/" className="text-2xl font-bold text-amber-700 flex items-center gap-2">
            <span className="text-3xl">🍺</span>
            Beer Label Editor
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Vérifiez votre email
              </h1>
              <p className="text-gray-600 mb-6">
                {verificationMessage}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Consultez votre boîte de réception (et les spams) pour trouver le lien de vérification.
              </p>
              <Link
                to="/login"
                className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition"
              >
                Aller à la connexion
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex flex-col">
      <header className="p-4">
        <Link to="/" className="text-2xl font-bold text-amber-700 flex items-center gap-2">
          <span className="text-3xl">🍺</span>
          Beer Label Editor
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-8">
              Créer un compte
            </h1>
            <RegisterForm
              onSubmit={handleSubmit}
              error={error}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
