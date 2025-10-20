"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import {
  auth,
  googleProvider,
  facebookProvider,
  githubProvider,
} from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaGithub } from "react-icons/fa";

export default function SignUp() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      await updateProfile(userCred.user, {
        displayName: `${form.firstName} ${form.lastName}`,
      });
      const token = await userCred.user.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  const handleSocialLogin = async (provider: any) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      document.cookie = `token=${token}; path=/`;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign up with provider.");
    }
  };

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#020617] via-[#050d25] to-[#0a0f2c] p-6 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Glowing Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.05),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.07),transparent)]" />

      {/* Card */}
      <motion.div
        className="w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] relative z-10"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
          Create Account
        </h2>
        <p className="text-center text-gray-400 mb-6">
          Sign up to experience next-gen healthcare with AI.
        </p>

        {error && (
          <p className="text-red-400 text-center mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#10163d]/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#10163d]/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#10163d]/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-[#10163d]/60 border border-white/10 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 transition-all"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-blue-500/20"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-4">Or sign up with</p>
          <div className="flex flex-col sm:flex-row sm:gap-4 gap-3 justify-center">
            <button
              onClick={() => handleSocialLogin(googleProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl transition-all duration-300 shadow-sm border border-white/10 backdrop-blur-md"
            >
              <FcGoogle size={20} /> Google
            </button>
            <button
              onClick={() => handleSocialLogin(facebookProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl transition-all duration-300 shadow-sm border border-white/10 backdrop-blur-md"
            >
              <FaFacebook size={20} /> Facebook
            </button>
            <button
              onClick={() => handleSocialLogin(githubProvider)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl transition-all duration-300 shadow-sm border border-white/10 backdrop-blur-md"
            >
              <FaGithub size={20} /> GitHub
            </button>
          </div>
        </div>

        <p className="text-sm mt-6 text-center text-gray-400">
          Already have an account?{" "}
          <a
            href="/sign-in"
            className="text-cyan-400 hover:text-indigo-400 transition-colors"
          >
            Sign In
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
