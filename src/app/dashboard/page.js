// File: app/dashboard/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReportIssueModal from '../components/ReportIssueModal'; 

/**
 * The Dashboard Page component.
 *
 * This is the main hub for authenticated citizen users. It displays:
 * - A personalized welcome message.
 * - Quick statistics about the user's reported issues.
 * - A grid of quick action buttons (Report, Track, Community, Rewards, Emergency).
 * - A list of the user's recent activity.
 * - A modal for reporting new issues.
 *
 * It handles fetching user data and real-time updates for issue statistics using Supabase.
 *
 * @component
 * @returns {JSX.Element} The rendered DashboardPage component.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // NEW: State for Username and Full Name
  const [profile, setProfile] = useState({ username: '', full_name: '', email: '' });
  
  const [stats, setStats] = useState({ resolved: 0, pending: 0 });
  const [myIssues, setMyIssues] = useState([]);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  /**
   * Fetches the user's profile and dashboard data from Supabase.
   *
   * - Verifies authentication status.
   * - Retrieves user profile details (username, full name).
   * - Fetches counts for resolved and pending issues.
   * - Fetches the 3 most recent issues reported by the user.
   *
   * @async
   * @function fetchRealData
   * @returns {Promise<void>}
   */
  const fetchRealData = async () => {
    setIsLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push('/login'); return; }

      // 1. GET PROFILE DATA (Username, Name)
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('username, full_name, email')
        .eq('id', user.id)
        .single();

      // Set Profile State (Fallback to email if username is missing)
      setProfile({
          username: userProfile?.username || user.email.split('@')[0],
          full_name: userProfile?.full_name || 'Citizen',
          email: user.email
      });

      const { count: resolvedCount } = await supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'Resolved');
      const { count: pendingCount } = await supabase.from('issues').select('*', { count: 'exact', head: true }).neq('status', 'Resolved');

      const { data: issuesData } = await supabase
        .from('issues')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setStats({ resolved: resolvedCount || 0, pending: pendingCount || 0 });
      setMyIssues(issuesData || []);

    } catch (error) { console.error('Error:', error); } finally { setIsLoading(false); }
  };

  /**
   * Initializes the dashboard data and sets up real-time subscription.
   *
   * Calls `fetchRealData` on mount and subscribes to changes in the 'issues' table
   * to update the dashboard in real-time.
   */
  useEffect(() => {
    fetchRealData();
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, () => fetchRealData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  /**
   * Opens the report issue modal.
   *
   * @function openReport
   * @param {boolean} emergency - Whether the report is an emergency.
   */
  const openReport = (emergency) => {
      setIsEmergencyMode(emergency);
      setIsModalOpen(true);
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundImage: `url('/city-issues-bg.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm z-0"></div>

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="font-bold text-sm">C</span>
                </div>
                <span className="font-bold text-xl tracking-tight">CivicFix</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <div className="w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase">
                  {profile.username.charAt(0)}
                </div>
                {/* SHOW USERNAME HERE */}
                <span className="ml-2 text-sm font-medium text-white/90">@{profile.username}</span>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-sm text-red-400 hover:text-red-300 font-medium transition">Sign Out</button>
            </div>
          </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        
        {/* WELCOME SECTION */}
        <div className="mb-8">
            {/* SHOW FULL NAME HERE */}
            <h2 className="text-3xl font-bold text-white">Welcome Back, {profile.full_name}.</h2>
            <p className="text-slate-400">Here is what's happening in your city today.</p>
        </div>

        {/* ... REST OF DASHBOARD CODE (Same as before) ... */}
        {/* Copy the rest of your Dashboard JSX here (Buttons, Stats, List) exactly as it was */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
            
            {/* STATS ROW */}
            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatsCard label="Issues Resolved" value={stats.resolved} icon="✅" color="text-green-400" bg="bg-green-500/10 border-green-500/30" />
                <StatsCard label="Issues Pending" value={stats.pending} icon="⏳" color="text-yellow-400" bg="bg-yellow-500/10 border-yellow-500/30" />
            </motion.div>

            {/* ACTION GRID */}
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Quick Actions</h3>
            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                
                <button onClick={() => openReport(true)} className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl shadow-lg shadow-red-900/50 hover:scale-[1.02] transition border border-red-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="font-bold text-xs uppercase tracking-wider">Emergency</span>
                </button>

                <DashboardButton label="Report" onClick={() => openReport(false)} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />} color="bg-white/10 hover:bg-blue-600/80" />
                <DashboardButton label="My Track" onClick={() => router.push('/track')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} color="bg-white/10 hover:bg-green-600/80" />
                <DashboardButton label="Community" onClick={() => router.push('/community')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3 3 0 01-3.356-3.143V6a3 3 0 013-3h12a3 3 0 013 3v6c0 1.261-.42 2.417-1.144 3.357m-11.212 0A3 3 0 015.644 13H4a3 3 0 01-3-3V6a3 3 0 013-3h12a3 3 0 013 3v4" />} color="bg-white/10 hover:bg-purple-600/80" />
                <DashboardButton label="Rewards" onClick={() => router.push('/rewards')} icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM12 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />} color="bg-white/10 hover:bg-yellow-600/80" />
            </motion.div>

            {/* RECENT ACTIVITY LIST */}
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-4">Your Recent Activity</h3>
            <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                {myIssues.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">No recent activity.</div>
                ) : (
                    myIssues.map((issue) => (
                        <div key={issue.id} className="p-4 border-b border-white/5 flex justify-between items-center hover:bg-white/5 transition">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${issue.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                <div>
                                    <h4 className="text-white font-medium text-sm">{issue.title}</h4>
                                    <p className="text-slate-400 text-xs">{new Date(issue.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded text-slate-300">{issue.status}</span>
                        </div>
                    ))
                )}
            </motion.div>

        </motion.div>
      </main>

      {isModalOpen && (
        <ReportIssueModal 
          defaultEmergency={isEmergencyMode} 
          onClose={() => setIsModalOpen(false)} 
          onIssueSubmitted={() => { setIsModalOpen(false); fetchRealData(); }}
        />
      )}
    </div>
  );
}

/**
 * A reusable button component for the dashboard quick actions.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.color - The Tailwind CSS class for background color and hover effect.
 * @param {string} props.label - The label text for the button.
 * @param {Function} props.onClick - The click handler.
 * @param {React.ReactNode} props.icon - The icon to display.
 * @returns {JSX.Element} The rendered DashboardButton component.
 */
function DashboardButton({ color, label, onClick, icon }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 ${color} text-white rounded-2xl shadow-lg transition transform hover:scale-105 border border-white/5 backdrop-blur-sm`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mb-2 opacity-80">{icon}</svg>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

/**
 * A reusable card component for displaying statistics.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {string} props.label - The label for the statistic.
 * @param {string|number} props.value - The value of the statistic.
 * @param {React.ReactNode} props.icon - The icon to display.
 * @param {string} props.color - The text color class for the icon.
 * @param {string} props.bg - The background style class.
 * @returns {JSX.Element} The rendered StatsCard component.
 */
function StatsCard({ label, value, icon, color, bg }) {
    return (
      <div className={`p-6 rounded-2xl flex items-center justify-between backdrop-blur-md ${bg} border`}>
        <div>
          <div className="text-slate-300 text-sm font-medium mb-1">{label}</div>
          <div className="text-4xl font-bold text-white">{value}</div>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    );
}