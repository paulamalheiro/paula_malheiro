import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { signIn, user, isConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona se já estiver autenticado
    if (user) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Verifique os dados informados.');
        } else {
          setErrorMessage(error.message || 'Erro ao realizar login.');
        }
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Voltar para o Site
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-3xl font-sans font-bold text-primary tracking-tight">
            Painel Administrativo
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Gerenciamento exclusivo da landing page de Paula Malheiro
          </p>
        </div>

        {!isConfigured && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-1">Aviso de Configuração Supabase:</strong>
              As variáveis de ambiente <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> precisam ser configuradas no arquivo <code>.env</code> com os dados do seu Supabase no Coolify / Hostinger.
            </div>
          </div>
        )}

        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                E-mail de Acesso
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="block w-full pl-10 pr-3 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/20 text-sm font-bold text-white bg-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Entrar no Painel'
                )}
              </button>
            </div>
          </form>

          {/* Atalho para Teste Local */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="bg-secondary/60 rounded-2xl p-4 text-xs space-y-2 border border-gray-200/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-700">⚡ Acesso de Teste Local:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@paulamalheiro.com.br');
                    setPassword('admin123');
                  }}
                  className="font-bold text-primary hover:text-accent underline transition-colors cursor-pointer"
                >
                  Preencher
                </button>
              </div>
              <div className="text-gray-500 font-mono text-[11px] space-y-0.5">
                <div>E-mail: <strong>admin@paulamalheiro.com.br</strong></div>
                <div>Senha: <strong>admin123</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          Paula Malheiro &copy; {new Date().getFullYear()} • Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};
