"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import Header from "./(routes)/dashboard/_components/Header";
import Image from "next/image";
import { 
    Mic, Zap, Shield, Brain, Heart, ArrowRight, Activity, BarChart3, Lock, 
    Stethoscope, Users, User, Languages, LogOut, X, Menu, Clock, Trash2 
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const context = useContext(UserDetailContext);

  const handleStartSession = () => {
    if (context?.user) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5
      } 
    },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#020617] via-[#050d25] to-[#0a0f2c] text-white overflow-hidden">

      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050B1A] to-[#0C142C] text-white pt-28 pb-24 px-6 flex flex-col md:flex-row items-center justify-between min-h-[calc(100vh-6rem)]">
        {/* Decorative Grid Overlay (Subtle) */}

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
              style={{ backgroundSize: '300px' }}>

          <div className="w-full h-full bg-repeat" style={{ backgroundImage: 'radial-gradient(#0c142c 1px, transparent 0)', backgroundSize: '20px 20px', opacity: 0.3 }}></div>
        </div>

        {/* Left: Text Content */}
        <div className="max-w-xl text-center md:text-left space-y-6 z-10 p-4 md:p-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
              Your AI-Powered Health Companion
            </span>{" "}
            for Smarter Well-being
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-gray-300 text-lg"
          >
            Experience intuitive healthcare assistance with AI Healthmate. Speak your
            symptoms, receive instant insights, and connect with professionals seamlessly.
          </motion.p>

          <motion.button
            onClick={handleStartSession} 
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 px-10 py-5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-700 font-bold text-white text-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group"
          >
            Start Your Health Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Right: AI Robot + Circuit */}
        <div className="relative mt-16 md:mt-0 flex justify-center items-center md:w-1/2 min-h-[300px]">
          {/* Animated Cyber Ring behind Robot */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, duration: 1, type: "spring", stiffness: 50 }}
            className="absolute w-96 h-96 border-4 border-cyan-500/40 rounded-full animate-spin-slow-reverse -z-10"
          ></motion.div>
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 1, type: "spring", stiffness: 50 }}
            className="absolute w-72 h-72 border-4 border-indigo-500/40 rounded-full animate-spin-slow -z-10"
          ></motion.div>

          {/* AI Robot - NOTE: Ensure /ai-robot.png exists in your public folder! */}
          <motion.img
            initial={{ opacity: 0, y: 80, rotateY: 90 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: 0.8, duration: 0.8, type: "spring", stiffness: 80 }}
            src="/ai-robot.png" 
            alt="AI HealthMate Robot"
            className="relative z-10 w-[480px] drop-shadow-[0_0_80px_rgba(79,70,229,0.5)] animate-float"
          />
        </div>

        {/* Background Soft Glow - Larger for impact */}
        <div className="absolute inset-0 -z-20 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl opacity-80" />
      </section>

      {/* ===== WHY CHOOSE SECTION (ICONS USED INSTEAD OF PLACEHOLDERS) ===== */}
      <section className="py-20 px-6 bg-[#0b102d]/60 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400"
        >
          Why Choose <span className="drop-shadow-lg">AI HealthMate?</span>
        </motion.h2>

        <motion.div 
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            {
              icon: Zap, // Smart Integration
              title: "Smart Integration",
              text: "Connect seamlessly with modern healthcare systems and APIs.",
            },
            {
              icon: Brain, // Cutting-edge AI
              title: "Cutting-edge AI",
              text: "Uses state-of-the-art models for speech and symptom recognition.",
            },
            {
              icon: Stethoscope, // Reliable Insights
              title: "Reliable Insights",
              text: "Backed by medical data and WHO standards for consistency.",
            },
            {
              icon: Lock, // Privacy First
              title: "Privacy First",
              text: "All health interactions are end-to-end encrypted and secured.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="p-8 bg-[#0f1538]/80 rounded-2xl shadow-xl border border-cyan-700/30 hover:shadow-cyan-500/20 hover:scale-[1.02] transition-transform duration-300 flex flex-col items-center"
            >
              {/* Use the Lucide Icon component */}
              <item.icon className="w-16 h-16 text-cyan-400 mb-6 p-2 rounded-full bg-cyan-900/40" strokeWidth={1.5} />
              <h3 className="text-2xl font-semibold mb-3 text-cyan-400">
                {item.title}
              </h3>
              <p className="text-gray-300 text-center">{item.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS (ICONS USED INSTEAD OF PLACEHOLDERS) ===== */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-[#0b102d] to-[#050a1f]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
        >
          How <span className="drop-shadow-lg">AI HealthMate</span> Works
        </motion.h2>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            {
              num: "01",
              icon: Mic,
              title: "Speak Your Mind",
              text: "Clearly articulate your symptoms and concerns through our secure voice interface.",
            },
            {
              num: "02",
              icon: Brain,
              title: "AI Analysis",
              text: "Our intelligent algorithms process your input, cross-referencing vast medical knowledge.",
            },
            {
              num: "03",
              icon: Zap,
              title: "Receive Guidance",
              text: "Get actionable health insights, potential recommendations, or connect with a doctor.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="p-8 bg-[#10163d]/80 rounded-2xl shadow-xl border border-indigo-700/30 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-transform duration-300 flex flex-col items-center"
            >
              <div className="relative mb-6">
                <span className="absolute -top-4 -left-4 text-5xl font-bold text-indigo-500 opacity-20">{step.num}</span>
                <step.icon className="w-16 h-16 text-indigo-400 p-2 rounded-full bg-indigo-900/40" strokeWidth={1.5} />
              </div>
              <h4 className="text-2xl font-semibold mb-3 text-cyan-400">
                {step.title}
              </h4>
              <p className="text-gray-300 text-center">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== SERVICES SECTION (ICONS USED INSTEAD OF IMAGE COMPONENTS) ===== */}
      <section className="py-24 px-6 text-center bg-[#070c2b]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400"
        >
          Explore Our <span className="drop-shadow-lg">AI Services</span>
        </motion.h2>

        <motion.div 
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            {
              icon: Activity, // AI Symptom Checker - replaced img and using icon
              title: "AI Symptom Checker",
              desc: "Get instant analysis and guidance from our AI health assistant, powered by comprehensive medical data.",
            },
            {
              icon: Mic, // Voice Consultation - replaced img and using icon
              title: "Voice Consultation",
              desc: "Engage in natural conversations with AI to receive insights and seamlessly connect with medical doctors.",
            },
            {
              icon: BarChart3, // Health Data Dashboard - replaced img and using icon
              title: "Personalized Health Dashboard",
              desc: "Track your health records, view AI-driven summaries, and receive proactive health predictions.",
            },
          ].map((service, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-[#10163d]/80 rounded-2xl shadow-xl border border-cyan-700/30 overflow-hidden hover:shadow-cyan-500/20 hover:-translate-y-2 transition-transform duration-300"
            >
              {/* 🚨 FIX: Replaced Image component with Icon for robustness and better visual consistency. */}
              <div className="w-full h-40 bg-cyan-800/30 flex items-center justify-center p-6 border-b border-cyan-700/50">
                  <service.icon className="w-20 h-20 text-cyan-400 p-2 rounded-full bg-cyan-600/20" strokeWidth={1.5} />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold text-cyan-400 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-300 text-sm">{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== TESTIMONIALS (ICONS ADDED FOR CONTEXT) ===== */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#0a0f2c] to-[#030615] text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.5 }}
          className="text-4xl md:text-5xl font-extrabold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400"
        >
          What Our Users <span className="drop-shadow-lg">Are Saying</span>
        </motion.h2>
        
        <motion.div 
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            {
              name: "Dr. Anya Sharma",
              text: "AI HealthMate has revolutionized my patient interactions. The insights are incredibly helpful, and the system is intuitive.",
              icon: Stethoscope, // Doctor
            },
            {
              name: "Emmanuel Obi",
              text: "The voice recognition is phenomenal! I can speak naturally about my symptoms, and AI HealthMate understands perfectly.",
              icon: Users, // General User
            },
            {
              name: "Sophia Martinez",
              text: "Knowing my health data is secure and accessible, with AI assistance, gives me immense peace of mind.",
              icon: Shield, // Security/Peace of Mind
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="bg-[#0f1538]/70 p-8 rounded-2xl shadow-xl border border-indigo-700/30 hover:shadow-indigo-500/20 hover:scale-[1.02] transition-transform duration-300 flex flex-col justify-between"
            >
              <t.icon className="w-8 h-8 text-indigo-400 mb-4 mx-auto" />
              <p className="text-gray-300 italic mb-6 leading-relaxed">“{t.text}”</p>
              <h4 className="text-cyan-400 font-bold text-lg">{t.name}</h4>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ===== CTA SECTION (REMOVED FAILING SVG URL) ===== */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-center relative overflow-hidden">
        {/* Animated particles for cyber effect (REMOVED FAILING SVG URL) */}
        {/* 🚨 FIX: Removed `url("/cyber-particles.svg")` reference that might be missing */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
              style={{ backgroundSize: 'contain' }}></div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-extrabold mb-8 relative z-10 text-white drop-shadow-lg"
        >
          Ready to Elevate Your Healthcare Experience?
        </motion.h2>
        <motion.button
          onClick={handleStartSession} 
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.4)" }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="px-12 py-5 bg-white text-indigo-700 rounded-full font-bold text-lg shadow-xl hover:bg-gray-100 transition-all relative z-10 group flex items-center justify-center gap-3 mx-auto"
        >
          Get Started Now <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </motion.button>
      </section>

      {/* ===== FOOTER (No changes needed) ===== */}
      <footer className="bg-[#020617] py-16 px-6 border-t border-gray-800 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 text-gray-400">
          <div>
            <h3 className="text-2xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
              AI HealthMate
            </h3>
            <p className="text-sm leading-relaxed">
              Revolutionizing healthcare with intelligent AI and compassionate design for a healthier tomorrow.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white text-lg mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-lg mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-lg mb-3">Follow Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          © {new Date().getFullYear()} AI HealthMate. All rights reserved.
        </p>
      </footer>

      {/* Floating Animation Style (Removed unused flowParticles keyframe) */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
            animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slow-reverse {
            animation: spin-slow 25s linear infinite reverse;
        }
      `}</style>

      {/* Chatbot Div (as per your original code) */}
      <div className="chatbot">
        {/* Placeholder for your chatbot component */}
      </div>
    </div>
  );
}