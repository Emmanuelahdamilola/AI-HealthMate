"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  signInWithEmailAndPassword, 
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for redirect result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        setError("Sign in failed. Please try again.");
        console.error(err);
      });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: string) => {
    setLoading(true);
    setError("");
    
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'facebook') provider = new FacebookAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();
    
    try {
      await signInWithRedirect(auth, provider!);
      // User will be redirected, then brought back
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl bg-white/20 backdrop-blur-lg shadow-2xl border border-white/30"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-lg">
          Welcome Back!
        </h2>
        <p className="text-center text-white/80 mb-6">
          Sign in to your account to continue your journey with us.
        </p>

        {error && (
          <p className="text-red-400 text-center mb-4 font-medium">{error}</p>
        )}

        {loading && (
          <p className="text-yellow-300 text-center mb-4">Redirecting...</p>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold transition-all duration-300 shadow-lg"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/80 mb-4">Or sign in with</p>
          <div className="flex flex-col sm:flex-row sm:gap-4 gap-3 justify-center">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 disabled:bg-white/20 transition-all duration-300 shadow w-full sm:w-auto"
            >
              <FcGoogle size={20} /> Google
            </button>
            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 disabled:bg-white/20 transition-all duration-300 shadow w-full sm:w-auto"
            >
              <FaFacebook size={20} /> Facebook
            </button>
            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 disabled:bg-white/20 transition-all duration-300 shadow w-full sm:w-auto"
            >
              <FaGithub size={20} /> GitHub
            </button>
          </div>
        </div>

        <p className="text-sm mt-6 text-center text-white/80">
          Don't have an account?{" "}
          <a href="/sign-up" className="text-purple-300 hover:underline">
            Sign Up
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}