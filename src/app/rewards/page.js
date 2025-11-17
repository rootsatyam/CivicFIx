// File: app/rewards/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('points').eq('id', user.id).single();
      if (profileData) setPoints(profileData.points);

      const { data: badgesData } = await supabase.from('badges').select('*').eq('user_id', user.id);
      setBadges(badgesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const currentLevel = points < 100 ? 1 : points < 500 ? 2 : 3;
  const nextLevelPoints = currentLevel === 1 ? 100 : currentLevel === 2 ? 500 : 1000;
  const prevLevelPoints = currentLevel === 1 ? 0 : currentLevel === 2 ? 100 : 500;
  const progressPercent = Math.min(100, Math.max(0, ((points - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100));
  const levelTitle = currentLevel === 1 ? "Citizen Observer" : currentLevel === 2 ? "Community Activist" : "Civic Champion";

  return (
    <div className="min-h-screen text-white">

      {/* HEADER */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center cursor-pointer gap-2" onClick={() => router.push('/dashboard')}>
                <span className="text-xl font-bold">Achievements</span>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-xs text-white/60 hover:text-white">Back to Dash</button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        
        {/* 1. Main Points Card */}
        <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-r from-purple-900/80 to-indigo-900/80 rounded-3xl shadow-2xl border border-white/10 p-8 mb-10 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Civic Score</p>
                        <h2 className="text-6xl font-extrabold text-white drop-shadow-lg">{loading ? '...' : points}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-purple-200 text-xs uppercase mb-1">Current Rank</p>
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-3xl">🏆</span>
                            <span className="text-2xl font-bold text-white">{levelTitle}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-black/40 rounded-full h-4 backdrop-blur-sm border border-white/5 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full shadow-[0_0_15px_rgba(255,165,0,0.5)]"
                    ></motion.div>
                </div>
                <div className="flex justify-between text-xs text-purple-300 mt-2 font-mono">
                    <span>LVL {currentLevel}</span>
                    <span>{nextLevelPoints - points} pts to next level</span>
                    <span>LVL {currentLevel + 1}</span>
                </div>
            </div>
        </motion.div>

        {/* 2. Badges Grid */}
        <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-6">Medals & Honors</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BadgeCard title="First Report" desc="Submitted 1st issue" icon="🥇" earned={points > 0} />
            <BadgeCard title="Top Verifier" desc="Verified 10 issues" icon="✅" earned={badges.some(b => b.badge_type === 'Top Verifier')} />
            <BadgeCard title="Problem Solver" desc="5 issues resolved" icon="🔧" earned={badges.some(b => b.badge_type === 'Problem Solver')} />
            <BadgeCard title="Civic Star" desc="1000+ Points" icon="⭐" earned={points >= 1000} />
        </div>

      </main>
    </div>
  );
}

// Dark Glass Badge Card
function BadgeCard({ title, desc, icon, earned }) {
    return (
        <motion.div 
            whileHover={{ scale: 1.05 }}
            className={`p-6 rounded-2xl border flex flex-col items-center text-center transition backdrop-blur-md ${
            earned 
                ? 'bg-white/10 border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]' 
                : 'bg-black/20 border-white/5 opacity-50 grayscale'
        }`}>
            <div className="text-4xl mb-3 drop-shadow-md">{icon}</div>
            <h4 className={`font-bold text-sm mb-1 ${earned ? 'text-white' : 'text-slate-500'}`}>{title}</h4>
            <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
            {earned && <div className="mt-3 text-[9px] font-bold uppercase tracking-wide bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded border border-yellow-500/30">Unlocked</div>}
        </motion.div>
    );
}