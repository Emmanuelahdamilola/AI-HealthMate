"use client";

import { useContext } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserDetailContext } from "@/context/UserDetailProvider";
import Header from "./(routes)/dashboard/_components/Header";
import Image from "next/image";

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

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#020617] via-[#050d25] to-[#0a0f2c] text-white overflow-hidden">
      <Header />

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050B1A] to-[#0C142C] text-white pt-28 pb-24 px-6 flex flex-col md:flex-row items-center justify-between">
  {/* Left: Text Content */}
  <div className="max-w-xl text-center md:text-left space-y-6 z-10">
    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-4xl md:text-6xl font-extrabold leading-tight"
    >
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
        Empowering Healthcare
      </span>{" "}
      with AI Voice Technology
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-gray-300 text-lg"
    >
      Speak your symptoms, get AI-powered insights, and experience smarter
      healthcare assistance — anytime, anywhere.
    </motion.p>

    <motion.button
      onClick={handleStartSession}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ delay: 0.6 }}
      className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 font-semibold text-white shadow-lg shadow-blue-500/30 transition-all"
    >
      Start Voice Session
    </motion.button>
  </div>

  {/* Right: AI Robot + Circuit */}
  <div className="relative mt-16 md:mt-0 flex justify-center items-center md:w-1/2">
    {/* Animated Glow Behind Robot */}
    <div className="absolute w-80 h-80 bg-cyan-500/20 blur-3xl rounded-full -z-10 animate-pulse-slow"></div>



    {/* AI Robot */}
    <motion.img
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      src="/ai-robot.png"
      alt="AI HealthMate Robot"
      className="relative z-10 w-[420px] drop-shadow-[0_0_60px_rgba(79,70,229,0.4)] animate-float"
    />
  </div>

  {/* Background Soft Glow */}
  <div className="absolute inset-0 -z-20 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl opacity-70" />
</section>


      {/* ===== WHY CHOOSE SECTION ===== */}
      <section className="py-20 px-6 bg-[#0b102d]/60 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Why Choose <span className="text-cyan-400">AI HealthMate?</span>
        </h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {[
            {
              title: "Smart Integration",
              text: "Connect seamlessly with modern healthcare systems and APIs.",
            },
            {
              title: "Cutting-edge AI",
              text: "Uses state-of-the-art models for speech and symptom recognition.",
            },
            {
              title: "Reliable Insights",
              text: "Backed by medical data and WHO standards for consistency.",
            },
            {
              title: "Privacy First",
              text: "All health interactions are end-to-end encrypted and secured.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className="p-6 bg-[#0f1538]/80 rounded-2xl shadow-lg hover:shadow-cyan-500/10 hover:scale-105 transition-transform"
            >
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">
                {item.title}
              </h3>
              <p className="text-gray-300">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-24 px-6 text-center bg-gradient-to-b from-[#0b102d] to-[#050a1f]">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          How <span className="text-indigo-400">It Works</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              num: "01",
              title: "Speak",
              text: "Describe your symptoms naturally through voice or text input.",
            },
            {
              num: "02",
              title: "Analyze",
              text: "AI analyzes input using medical data and health algorithms.",
            },
            {
              num: "03",
              title: "Recommend",
              text: "Receive health recommendations or connect with professionals.",
            },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.3 }}
              viewport={{ once: true }}
              className="p-8 bg-[#10163d]/80 rounded-2xl shadow-md hover:shadow-indigo-500/10 transition-all"
            >
              <h3 className="text-5xl font-bold text-indigo-500 mb-4">
                {step.num}
              </h3>
              <h4 className="text-xl font-semibold mb-2 text-cyan-400">
                {step.title}
              </h4>
              <p className="text-gray-300">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== SERVICES SECTION ===== */}
      <section className="py-24 px-6 text-center bg-[#070c2b]">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Explore Our <span className="text-cyan-400">AI Services</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              img: "/service1.png",
              title: "AI Symptom Checker",
              desc: "Get instant analysis and guidance from our AI health assistant.",
            },
            {
              img: "/service2.png",
              title: "Voice Consultation",
              desc: "Talk naturally with AI to receive insights and connect with doctors.",
            },
            {
              img: "/service3.png",
              title: "Health Data Dashboard",
              desc: "Track your health records and get AI-driven health predictions.",
            },
          ].map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.3 }}
              viewport={{ once: true }}
              className="bg-[#10163d]/80 rounded-2xl shadow-lg hover:shadow-cyan-500/10 overflow-hidden hover:-translate-y-2 transition-transform"
            >
              <Image
                src={service.img}
                alt={service.title}
                width={400}
                height={250}
                className="w-full object-cover h-56"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-cyan-400 mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-300 text-sm">{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#0a0f2c] to-[#030615] text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          What Users <span className="text-indigo-400">Say</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              name: "Dr. Jane Smith",
              text: "AI HealthMate has transformed how I communicate with patients remotely. It's accurate and easy to use.",
            },
            {
              name: "Michael Ade",
              text: "The voice recognition is excellent. I spoke naturally, and it understood everything clearly!",
            },
            {
              name: "Nora Daniels",
              text: "As a patient, I feel more empowered to understand my health through AI assistance.",
            },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.3 }}
              viewport={{ once: true }}
              className="bg-[#0f1538]/70 p-6 rounded-2xl shadow-md hover:shadow-indigo-500/10"
            >
              <p className="text-gray-300 italic mb-4">“{t.text}”</p>
              <h4 className="text-cyan-400 font-semibold">{t.name}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold mb-6"
        >
          Ready to Experience Smarter Healthcare?
        </motion.h2>
        <motion.button
          onClick={handleStartSession}
          whileHover={{ scale: 1.05 }}
          className="px-8 py-4 bg-white text-blue-700 rounded-xl font-semibold shadow-md hover:bg-gray-100 transition-all"
        >
          Get Started Now
        </motion.button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#020617] py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10 text-gray-400">
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">
              AI HealthMate
            </h3>
            <p className="text-sm">
              Revolutionizing healthcare delivery with artificial intelligence
              and human empathy.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400">About Us</a></li>
              <li><a href="#" className="hover:text-cyan-400">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400">Blog</a></li>
              <li><a href="#" className="hover:text-cyan-400">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400">Help Center</a></li>
              <li><a href="#" className="hover:text-cyan-400">FAQs</a></li>
              <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">Follow Us</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-cyan-400">LinkedIn</a></li>
              <li><a href="#" className="hover:text-cyan-400">Twitter</a></li>
              <li><a href="#" className="hover:text-cyan-400">Instagram</a></li>
              <li><a href="#" className="hover:text-cyan-400">YouTube</a></li>
            </ul>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-12">
          © {new Date().getFullYear()} AI HealthMate. All rights reserved.
        </p>
      </footer>

      {/* Floating Animation Style */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
