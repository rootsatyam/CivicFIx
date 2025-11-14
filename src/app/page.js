// File: app/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, issues: 0 });
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Fetch REAL Data for the Landing Page
  useEffect(() => {
    const getStats = async () => {
      // 1. Check if user is logged in (Auto-redirect)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
        return;
      }

      // 2. Get Real Counts
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: issueCount } = await supabase.from('issues').select('*', { count: 'exact', head: true });

      setStats({ 
        users: userCount || 0, 
        issues: issueCount || 0 
      });
      setLoading(false);
    };

    getStats();
  }, []);

  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    visible: { transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND IMAGE LAYER */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url('/city-issues-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed', // Parallax feel
        }}
      />
      {/* Dark Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900"></div>

      {/* --- NAVIGATION (Glass) --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="font-bold text-xl">C</span>
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">CivicFix</span>
            </div>
            <div className="flex gap-4">
                <Link href="/login" className="hidden md:block px-6 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
                    Log In
                </Link>
                <Link href="/signup" className="px-6 py-2 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-blue-50 transition transform hover:scale-105 shadow-lg">
                    Join Now
                </Link>
            </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="relative z-10 pt-32 pb-20 px-6">
        <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center"
        >
            
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Live Beta: Jharkhand's First Civic Portal
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight mb-8">
                Report Problems. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Build a Better City.
                </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Don't just complain—act. Use CivicFix to report potholes, garbage, and hazards instantly. Track resolution in real-time and earn rewards for your impact.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                    Start Reporting
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </Link>
                <Link href="/community" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold text-lg transition backdrop-blur-sm">
                    View Live Map
                </Link>
            </motion.div>

        </motion.div>

        {/* --- REAL TIME STATS (Glass Cards) --- */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
            <StatCard 
                label="Active Citizens" 
                value={stats.users} 
                suffix="+" 
                icon="👥" 
                loading={loading} 
            />
            <StatCard 
                label="Issues Reported" 
                value={stats.issues} 
                suffix="" 
                icon="📝" 
                loading={loading} 
            />
            <StatCard 
                label="Cities Covered" 
                value="1" 
                suffix="" 
                icon="🏙️" 
                loading={false} 
            />
        </motion.div>

        {/* --- HOW IT WORKS --- */}
        <div className="mt-32 mb-20 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold mb-4">How CivicFix Works</h2>
                <p className="text-slate-400">Three simple steps to change your neighborhood.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    step="01"
                    title="Snap & Upload"
                    desc="Take a photo of the issue. Our GPS automatically tags your exact location."
                    color="bg-blue-500"
                />
                <FeatureCard 
                    step="02"
                    title="Track Progress"
                    desc="Watch the status change from 'Submitted' to 'In Progress' to 'Resolved'."
                    color="bg-purple-500"
                />
                <FeatureCard 
                    step="03"
                    title="Earn Badges"
                    desc="Get recognized as a top citizen. Earn points and badges for every verified report."
                    color="bg-pink-500"
                />
            </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/20 backdrop-blur-lg py-12 text-center">
        <p className="text-slate-500 text-sm">
            &copy; 2025 CivicFix Inc. Building for the future.
        </p>
      </footer>
    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, suffix, icon, loading }) {
    return (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md p-8 rounded-3xl flex flex-col items-center justify-center hover:bg-white/10 transition duration-300 group">
            <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition duration-300">{icon}</div>
            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mb-2">
                {loading ? '-' : value}{suffix}
            </div>
            <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">{label}</div>
        </div>
    );
}

function FeatureCard({ step, title, desc, color }) {
    return (
        <div className="relative p-8 rounded-3xl bg-slate-800/50 border border-white/5 overflow-hidden group hover:border-white/20 transition duration-300">
            <div className={`absolute top-0 left-0 w-full h-1 ${color} opacity-50 group-hover:opacity-100 transition`}></div>
            <div className="text-6xl font-black text-white/5 absolute -right-4 -top-4">{step}</div>
            
            <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <span className="font-bold text-white text-lg">{step}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    );
}