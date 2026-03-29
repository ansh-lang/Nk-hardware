import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithGoogle, loginWithEmail, resetPassword } from '../firebase';
import { Shield, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onLoginSuccess();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setError("Sign-in cancelled. Please try again.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled in your Firebase Console.");
      } else {
        setError("Login failed. Please try again.");
        console.error("Login failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onLoginSuccess();
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password.");
      } else {
        setError("Login failed. Please try again.");
        console.error("Email login failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address above to reset your password.");
      setResetMessage(null);
      return;
    }
    setError(null);
    setResetMessage(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
        console.error("Password reset failed:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 pt-32 pb-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-[440px] border border-zinc-200 my-auto relative"
      >
        {isAdminMode && (
          <button 
            onClick={() => { setIsAdminMode(false); setError(null); setResetMessage(null); }}
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <h1 className="text-3xl font-bold text-center text-[#1e293b] mb-2">
          {isAdminMode ? 'Admin Access' : 'Welcome Back'}
        </h1>
        <p className="text-center text-slate-500 mb-8">
          {isAdminMode ? 'Sign in to admin dashboard' : 'Sign in to your account'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm text-center mb-4">
            {resetMessage}
          </div>
        )}

        {!isAdminMode && (
          <>
            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-200 text-slate-700 py-2.5 px-4 rounded-lg hover:bg-zinc-50 transition-all font-medium text-[15px] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400">OR CONTINUE WITH EMAIL</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Email</label>
            <input 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#112240] focus:border-transparent text-[15px]"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="text-[13px] font-medium text-slate-700 mb-1.5 block">Password</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#112240] focus:border-transparent text-[15px]"
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="text-left">
            <button 
              type="button" 
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-[13px] text-amber-500 hover:text-amber-600 font-medium disabled:opacity-50"
            >
              Forgot password?
            </button>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#112240] text-white py-3 rounded-lg font-medium hover:bg-[#0a1526] transition-all text-[15px] mt-2 disabled:opacity-70 flex justify-center"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Sign In'}
          </button>
        </form>

        {!isAdminMode && (
          <>
            <p className="text-center text-[14px] text-slate-500 mt-6">
              Don't have an account? <button className="text-amber-500 font-medium hover:text-amber-600">Sign Up</button>
            </p>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-white px-3 text-slate-400">ADMIN?</span>
              </div>
            </div>

            <button 
              onClick={() => { setIsAdminMode(true); setError(null); setResetMessage(null); }}
              className="w-full flex items-center justify-center gap-2 bg-white border border-amber-200 text-amber-500 py-2.5 px-4 rounded-lg hover:bg-amber-50 transition-all font-medium text-[15px]"
            >
              <Shield size={18} />
              Admin Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
