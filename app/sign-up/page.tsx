
'use client';

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    createUserWithEmailAndPassword, 
    updateProfile, 
    signInWithPopup,
    AuthError
} from "firebase/auth";
import { auth, googleProvider, facebookProvider, githubProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import axios from 'axios'; 
import { toast } from 'sonner';


const setAuthCookie = (token: string) => {
    document.cookie = `firebase_token=${token}; path=/; Secure; HttpOnly=false; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

export default function SignUp() {
    const router = useRouter();
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('✅ User already signed in, redirecting...');
                router.push("/dashboard");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(""); 
    };


    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!form.firstName || !form.lastName || !form.email || !form.password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
            
            await updateProfile(userCred.user, {
                displayName: `${form.firstName} ${form.lastName}`,
            });

            const user = userCred.user;
            const token = await user.getIdToken();

            console.log('🔗 Calling backend to create DB profile...');
            await axios.post('/api/user-create', {
                email: user.email,
                name: user.displayName,

            });

            console.log('✅ Database record created.');
            toast.success('Account created and profile saved!');

         
            setAuthCookie(token); 
            router.push("/dashboard");

        } catch (err: any) {
            console.error('❌ Sign up error:', err);
            
            let errorMessage = "Failed to create account. Please try again.";
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                errorMessage = `Profile creation failed: ${err.response.data.error}`;
            } else if (err.message) {
               
                errorMessage = err.message;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

   
    const handleSocialLogin = async (provider: any, providerName: string) => {
        setLoading(true);
        setError("");
        
        try {
            console.log(`🔐 Signing up with ${providerName}...`);
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            
            if (!user.displayName) {
                const name = user.email?.split('@')[0] || 'New User';
                await updateProfile(user, { displayName: name });
            }

            const token = await user.getIdToken();

            
            console.log('🔗 Calling backend to create DB profile (Social)...');
            await axios.post('/api/user-create', {
                email: user.email,
                name: user.displayName,
            });

            console.log('✅ Database record created (Social).');
            toast.success(`Signed up with ${providerName} and profile saved!`);
            
            setAuthCookie(token); 
            
            
            setTimeout(() => {
                router.push("/dashboard");
            }, 500);

        } catch (err: any) {
            console.error('❌ Social sign up error:', err.code, err.message);
            
            const authError = err as AuthError;
            let errorMessage = `Failed to sign up with ${providerName}.`;

            if (authError.code) {
                
                 switch (authError.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "Sign up cancelled.";
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = "An account already exists with this email using a different sign-in method.";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Popup was blocked. Please allow popups for this site.";
                        break;
                    default:
                        errorMessage = `Firebase error: ${authError.code}`;
                }
            } else if (axios.isAxiosError(err) && err.response?.data?.error) {
              
                errorMessage = `Profile creation failed: ${err.response.data.error}`;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
          className="min-h-screen flex items-center justify-center bg-gray-900 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
         
          <div className="absolute inset-0 z-0 opacity-40" 
              style={{ background: 'radial-gradient(circle at center, #0f172a 0%, #250a41 50%, #0f172a 100%)' }} />
          
          <motion.div
            className="relative z-10 w-full max-w-4xl p-8 rounded-3xl bg-[#0f172a]/90 backdrop-blur-md shadow-[0_0_40px_rgba(52,211,255,0.2)] border border-cyan-500/30 overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          >
            <h2 className="text-4xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              AI Healthmate Portal
            </h2>
            <p className="text-center text-gray-300 mb-8">
              Create an account to begin your secure consultations.
            </p>

           
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/50 border border-red-500/50">
                <p className="text-red-300 text-center text-sm">{error}</p>
              </div>
            )}

            {/* --- MAIN SIGN UP GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* LEFT: EMAIL SIGN UP FORM */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Register with Email</h3>
                
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <InputWithIcon 
                      type="text" name="firstName" placeholder="First Name" 
                      value={form.firstName} onChange={handleChange} Icon={User} 
                      disabled={loading}
                    />
                    <InputWithIcon 
                      type="text" name="lastName" placeholder="Last Name" 
                      value={form.lastName} onChange={handleChange} Icon={User} 
                      disabled={loading}
                    />
                  </div>

                  {/* Email & Password */}
                  <InputWithIcon 
                    type="email" name="email" placeholder="Email" 
                    value={form.email} onChange={handleChange} Icon={Mail} 
                    disabled={loading}
                  />
                  <InputWithIcon 
                    type="password" name="password" placeholder="Password" 
                    value={form.password} onChange={handleChange} Icon={Lock} 
                    disabled={loading}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold transition-all duration-300 shadow-xl mt-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Account"}
                  </button>
                </form>
              </motion.div>

              {/* RIGHT: SOCIAL LOGIN */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col gap-4 pt-4 lg:pt-0"
              >
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">Social Signup</h3>
                <p className="text-gray-500 text-sm mb-4">Register instantly with a social account.</p>

                {/* Social Buttons Stack */}
                <SocialButton
                  onClick={() => handleSocialLogin(googleProvider, 'google')}
                  disabled={loading}
                  icon={<FcGoogle size={24} />}
                  label="Sign Up with Google"
                  className="bg-gray-800/80 hover:bg-gray-700/80"
                />
                <SocialButton
                  onClick={() => handleSocialLogin(facebookProvider, 'facebook')}
                  disabled={loading}
                  icon={<FaFacebook size={24} className="text-blue-500" />}
                  label="Sign Up with Facebook"
                  className="bg-gray-800/80 hover:bg-gray-700/80"
                />
                <SocialButton
                  onClick={() => handleSocialLogin(githubProvider, 'github')}
                  disabled={loading}
                  icon={<FaGithub size={24} />}
                  label="Sign Up with GitHub"
                  className="bg-gray-800/80 hover:bg-gray-700/80"
                />
                
                {/* Login Link */}
                <p className="text-sm mt-8 text-center text-white/80">
                  Already a user?{" "}
                  <a href="/sign-in" className="text-cyan-400 hover:underline font-semibold cursor-pointer">
                    Sign In
                  </a>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
    );
}

// --- HELPER COMPONENTS ---

// Helper for Input fields with icons
interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
    Icon: React.ElementType;
}

const InputWithIcon: React.FC<InputWithIconProps> = ({ Icon, ...props }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
            {...props}
            required
            className="w-full px-4 pl-10 py-3 rounded-xl bg-gray-800/80 placeholder-gray-500 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300 disabled:opacity-50"
        />
    </div>
);

// Helper component for styled social buttons
interface SocialButtonProps {
    onClick: () => void;
    disabled: boolean;
    icon: React.ReactNode;
    label: string;
    className: string;
}

const SocialButton: React.FC<SocialButtonProps> = ({ onClick, disabled, icon, label, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center justify-start gap-4 px-4 py-3 text-white rounded-xl transition-all duration-300 shadow-md ${className} disabled:opacity-50 disabled:cursor-not-allowed w-full`}
    >
        {icon}
        <span className="font-medium text-sm">{label}</span>
    </button>
);
