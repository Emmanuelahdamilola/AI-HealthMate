"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider, githubProvider } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";

export default function SignIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const token = await userCredential.user.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  const handleSocialLogin = async (provider: any) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to sign in with provider. Please try again.");
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

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-purple-400 backdrop-blur-sm"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-all duration-300 shadow-lg cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/80 mb-4">Or sign up with</p>
          <div className="flex flex-col sm:flex-row sm:gap-4 gap-3 justify-center">
            <button
              onClick={() => handleSocialLogin(googleProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 transition-all duration-300 shadow cursor-pointer w-full sm:w-auto"
            >
              <FcGoogle size={20} /> Google
            </button>
            <button
              onClick={() => handleSocialLogin(facebookProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 transition-all duration-300 shadow cursor-pointer w-full sm:w-auto"
            >
              <FaFacebook size={20} /> Facebook
            </button>
            <button
              onClick={() => handleSocialLogin(githubProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/30 text-white rounded-xl hover:bg-white/40 transition-all duration-300 shadow cursor-pointer w-full sm:w-auto"
            >
              <FaGithub size={20} /> GitHub
            </button>
          </div>
        </div>

        <p className="text-sm mt-6 text-center text-white/80">
          Don’t have an account?{" "}
          <a href="/sign-up" className="text-purple-300 hover:underline cursor-pointer">
            Sign Up
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
