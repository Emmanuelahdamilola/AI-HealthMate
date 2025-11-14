'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  AuthError
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { Zap, Mail, Lock, Loader, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirectLoading, setRedirectLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleAuth = async () => {
      try {

        console.log('🔍 Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result?.user && mounted) {
          console.log('✅ Sign in successful (redirect):', result.user.email);
          toast.success('Sign in successful!');
          router.push("/dashboard");
          return;
        }
      } catch (err: any) {
        if (err.code && err.code !== 'auth/no-redirect-result' && mounted) {
          console.error('❌ Redirect result error:', err.code, err.message);
          setError(err.message || 'Sign in failed');
        }
      }


      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user && mounted) {
          console.log('✅ User already signed in, redirecting...');
          router.push("/dashboard");
        } else {
          setRedirectLoading(false);
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    };

    handleAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };


  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Signing in with email:', form.email);
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      
      console.log('✅ Email sign in successful:', userCredential.user.email);
      toast.success('Sign in successful!');
      

      await new Promise(resolve => setTimeout(resolve, 300));
      router.push("/dashboard");

    } catch (err: any) {
      console.error('❌ Sign in error:', err.code, err.message);
      
      const authError = err as AuthError;
      let errorMessage = "Sign in failed. Please try again.";

      switch (authError.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This account has been disabled.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/invalid-credential':
          errorMessage = "Invalid email or password.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };


  const handleSocialLogin = async (providerName: string) => {
    setLoading(true);
    setError("");
    
    let provider;
    if (providerName === 'google') {
      provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
    } else if (providerName === 'facebook') {
      provider = new FacebookAuthProvider();
    } else if (providerName === 'github') {
      provider = new GithubAuthProvider();
    }
    
    if (!provider) {
      setError("Invalid provider");
      setLoading(false);
      return;
    }

    try {
      console.log(`🔐 Attempting ${providerName} sign in...`);
      
      
      try {
        console.log('📱 Trying popup method...');
        const result = await signInWithPopup(auth, provider);
        
        console.log('✅ Social sign in successful (popup):', result.user.email);
        toast.success(`Signed in with ${providerName}!`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push("/dashboard");
        return;

      } catch (popupError: any) {
        console.warn('⚠️ Popup method failed:', popupError.code);
        
        
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log('🔄 Falling back to redirect method...');
          toast.info('Redirecting to sign in...');
          
         
          sessionStorage.setItem('pendingProvider', providerName);
          
          
          await signInWithRedirect(auth, provider);
         
          return;
        }
        
      
        throw popupError;
      }

    } catch (err: any) {
      console.error('❌ Social sign in error:', err.code, err.message);
      
      const authError = err as AuthError;
      let errorMessage = `Failed to sign in with ${providerName}.`;

      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = "Sign in was cancelled. Please try again.";
          break;
        case 'auth/popup-blocked':
          errorMessage = "Popup was blocked. Please allow popups or try again.";
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = "An account with this email already exists. Try signing in with your original method.";
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = "Please complete the current sign-in first.";
          break;
        case 'auth/unauthorized-domain':
          errorMessage = "This domain is not authorized. Please contact support.";
          break;
        case 'auth/network-request-failed':
          errorMessage = "Network error. Please check your connection.";
          break;
        case 'auth/internal-error':
          errorMessage = "Internal error. Please try again.";
          break;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Show loading state while checking redirect
  if (redirectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-900"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Gradient Layer */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{ background: 'radial-gradient(circle at center, #0f172a 0%, #250a41 50%, #0f172a 100%)' }} />
      
      <motion.div
        className="relative z-10 w-full max-w-xl p-8 rounded-3xl bg-[#0f172a]/90 backdrop-blur-md shadow-[0_0_40px_rgba(52,211,255,0.2)] border border-cyan-500/30 overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      >
        <h2 className="text-4xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          AI HealthMate
        </h2>
        <p className="text-center text-gray-300 mb-8">
          Access your secure medical consultation.
        </p>

        {/* ERROR DISPLAY */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-900/50 border border-red-500/50"
          >
            <p className="text-red-300 text-center text-sm">{error}</p>
          </motion.div>
        )}

        {/* LOADING DISPLAY */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-indigo-900/50 border border-indigo-500/50 flex items-center justify-center gap-2"
          >
            <Loader className="w-4 h-4 animate-spin text-cyan-300" />
            <p className="text-cyan-300 text-center text-sm">Processing...</p>
          </motion.div>
        )}

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: EMAIL LOGIN */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Email & Password</h3>
            <form onSubmit={handleEmailSignIn} className="space-y-5">
              
              {/* Email Input */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-4 pl-10 py-3 rounded-xl bg-gray-800/80 placeholder-gray-500 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full px-4 pl-10 py-3 rounded-xl bg-gray-800/80 placeholder-gray-500 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300 disabled:opacity-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold transition-all duration-300 shadow-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In"}
              </button>
            </form>
          </motion.div>

          {/* RIGHT: SOCIAL LOGIN */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col gap-4"
          >
            <h3 className="text-lg font-semibold text-cyan-400 mb-1">Social Accounts</h3>
            <p className="text-gray-500 text-sm">One-click access</p>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3 mt-2">
              <SocialButton
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                icon={<FcGoogle size={22} />}
                label="Sign In with Google"
                className="bg-gray-700/80 hover:bg-gray-600/80"
              />
              <SocialButton
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
                icon={<FaFacebook size={22} className="text-blue-500" />}
                label="Sign In with Facebook"
                className="bg-gray-700/80 hover:bg-gray-600/80"
              />
              <SocialButton
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
                icon={<FaGithub size={22} />}
                label="Sign In with GitHub"
                className="bg-gray-700/80 hover:bg-gray-600/80"
              />
            </div>
            
            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-900/80 px-2 text-gray-500">OR</span>
              </div>
            </div>

            <p className="text-sm text-center text-white/80">
              Don't have an account?{" "}
              <a href="/sign-up" className="text-cyan-400 hover:underline font-semibold">
                Register Now
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}


const SocialButton: React.FC<{ 
  onClick: () => void; 
  disabled: boolean; 
  icon: React.ReactNode; 
  label: string; 
  className: string 
}> = ({ onClick, disabled, icon, label, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-4 px-4 py-3 text-white rounded-xl transition-all duration-300 shadow-md ${className} disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
  >
    {icon}
    <span className="font-medium text-sm">{label}</span>
  </button>
);