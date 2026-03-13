import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Hammer, Briefcase, User as UserIcon, ShieldCheck, 
  ArrowRight, Mail, Lock, LogIn, Sparkles, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { signIn, demoSignIn, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<'worker' | 'employer' | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in and has profile, redirect
  React.useEffect(() => {
    if (user && profile) {
      const from = (location.state as any)?.from?.pathname || (profile.role === 'employer' ? '/dashboard/employer' : `/worker/${user.uid}`);
      navigate(from, { replace: true });
    }
  }, [user, profile, navigate, location]);

  const handleLogin = async () => {
    if (!role) {
      toast.error("Please select if you are a Worker or Employer first!");
      return;
    }

    setLoading(true);
    try {
      await signIn();
      toast.success("Welcome back!");
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // Silently handle user closing the popup
        return;
      }
      
      toast.error("Login failed. Please check your internet or try Demo Login.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!role) {
      toast.error("Please select if you are a Worker or Employer first!");
      return;
    }
    setLoading(true);
    try {
      await demoSignIn(role);
      toast.success(`Logged in as Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`);
    } catch (error) {
      console.error("Demo login error:", error);
      toast.error("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-3xl border-primary/20 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        <div className="text-center mb-8 relative">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Hammer className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Select your role to continue to Daksh-Bharat</p>
        </div>

        <div className="space-y-4 mb-4 relative">
          <button 
            onClick={() => setRole('worker')}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
              role === 'worker' 
                ? 'border-primary bg-primary/10 text-white' 
                : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl transition-colors ${role === 'worker' ? 'bg-primary text-white' : 'bg-white/5 text-gray-500'}`}>
                <UserIcon className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className={`font-bold ${role === 'worker' ? 'text-white' : 'text-gray-300'}`}>I am a Worker</p>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Find local jobs & verify skills</p>
              </div>
            </div>
            {role === 'worker' && <CheckCircle2 className="h-5 w-5 text-primary" />}
          </button>

          <button 
            onClick={() => setRole('employer')}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
              role === 'employer' 
                ? 'border-accent bg-accent/10 text-white' 
                : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl transition-colors ${role === 'employer' ? 'bg-accent text-white' : 'bg-white/5 text-gray-500'}`}>
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className={`font-bold ${role === 'employer' ? 'text-white' : 'text-gray-300'}`}>I am an Employer</p>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">Hire verified rural talent</p>
              </div>
            </div>
            {role === 'employer' && <CheckCircle2 className="h-5 w-5 text-accent" />}
          </button>
        </div>

        <div className="space-y-3 relative mb-8">
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl mb-4 text-center">
            <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">Recommended for Preview</p>
            <button 
              onClick={handleDemoLogin}
              disabled={loading || !role}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all ${
                !role 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'btn-saffron text-white shadow-lg shadow-primary/20'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Login as Demo {role ? (role.charAt(0).toUpperCase() + role.slice(1)) : ''}</span>
            </button>
            <p className="text-[9px] text-gray-500 mt-2 italic">Instant access without Google account</p>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-bg px-2 text-gray-600">OR</span></div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading || !role}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all border border-white/10 ${
              !role 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Sparkles className="h-5 w-5" />
              </motion.div>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-gray-500 text-xs">
            New to Daksh-Bharat?{' '}
            <button 
              onClick={() => navigate(role === 'employer' ? '/register/employer' : '/register/worker')}
              className="text-primary font-bold hover:underline"
            >
              Create an account
            </button>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
          <ShieldCheck className="h-3 w-3" />
          <span>Secure Multi-Factor Authentication</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
