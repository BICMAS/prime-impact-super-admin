import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { login } from '@/api/auth';
import { saveAuth } from '@/utils/auth';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await login(email, password);
      saveAuth(data.accessToken, data.refreshToken);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    // Simulate API delay
    setTimeout(() => {
      setIsResetting(false);
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setShowForgotModal(false);
        setResetEmail('');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black/90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-primary-dark/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 flex flex-col md:flex-row">
        <div className="p-8 w-full">
          <div className="text-center mb-8">
            <img src="/img/prime-impact-logo.png" alt="Prime Impact Logo" className="mx-auto h-24 mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-brand-primary tracking-tight">Prime Impact</h1>
            <p className="text-sm text-gray-500 mt-2">Super Admin Portal Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

           {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all outline-none"
                  placeholder="admin@primeimpact.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold py-2.5 rounded-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/30 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Login'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-gray-400 hover:text-brand-primary transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
                <button 
                  onClick={() => setShowForgotModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              {!resetSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:bg-white transition-all outline-none"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isResetting}
                    className="w-full bg-brand-accent hover:bg-brand-accent-dark text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-70"
                  >
                    {isResetting ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="text-green-600" size={24} />
                  </div>
                  <h4 className="text-gray-800 font-bold mb-1">Check your email</h4>
                  <p className="text-sm text-gray-500">
                    We've sent a password reset link to <span className="font-medium text-gray-800">{resetEmail}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;