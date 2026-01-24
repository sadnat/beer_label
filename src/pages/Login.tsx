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
              Connexion
            </h1>
            <LoginForm
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
