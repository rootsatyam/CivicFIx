'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('All'); // 'All', 'Emergency', 'Submitted', 'In Progress'
  const [stats, setStats] = useState({ pending: 0, emergency: 0, resolved: 0 });
  
  // Real-time state to flash new items
  const [newIssueId, setNewIssueId] = useState(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setIssues(data || []);
      // Calculate Stats
      const pending = data.filter(i => i.status !== 'Resolved').length;
      const emergency = data.filter(i => i.is_emergency && i.status !== 'Resolved').length;
      const resolved = data.filter(i => i.status === 'Resolved').length;
      setStats({ pending, emergency, resolved });
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/dashboard'); return; }
      
      fetchIssues();
    };

    checkAdmin();

    // REAL-TIME LISTENER
    const channel = supabase.channel('admin-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, (payload) => {
        if(payload.eventType === 'INSERT') setNewIssueId(payload.new.id);
        fetchIssues();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id, newStatus) => {
    // Optimistic Update
    setIssues(issues.map(i => i.id === id ? { ...i, status: newStatus } : i));
    await supabase.from('issues').update({ status: newStatus }).eq('id', id);
    fetchIssues(); // Re-sync to be safe
  };

  // Filter Logic
  const filteredIssues = issues.filter(i => {
    if (filter === 'Emergency') return i.is_emergency && i.status !== 'Resolved';
    if (filter === 'All') return true;
    return i.status === filter;
  });

  return (
    <div 
      className="min-h-screen text-white p-4 md:p-8"
      style={{
        backgroundImage: `url('/city-issues-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-0"></div>

      <main className="relative z-10 max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Authority Control Room</h1>
                    <p className="text-slate-400 text-sm">Manage and resolve civic grievances.</p>
                </div>
            </div>
            <button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition">
                Exit to User App
            </button>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Critical Emergencies" value={stats.emergency} color="bg-red-500" icon="??" />
            <StatCard label="Pending Action" value={stats.pending} color="bg-yellow-500" icon="?" />
            <StatCard label="Resolved Total" value={stats.resolved} color="bg-green-500" icon="?" />
        </div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['All', 'Emergency', 'Submitted', 'In Progress', 'Resolved'].map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition whitespace-nowrap border ${
                        filter === f 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    {f}
                </button>
            ))}
        </div>

        {/* ISSUE FEED */}
        {loading ? (
            <div className="text-center py-20 text-white/30 animate-pulse">Connecting to Satellite Feed...</div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredIssues.map((issue) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1,
                                borderColor: issue.id === newIssueId ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255,255,255,0.1)'
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={issue.id}
                            className={`
                                relative overflow-hidden rounded-2xl border backdrop-blur-xl p-0 transition-all
                                ${issue.is_emergency ? 'bg-red-900/20 border-red-500/30 shadow-red-900/20' : 'bg-white/5 border-white/10 shadow-lg'}
                            `}
                        >
                            {/* Emergency Stripe */}
                            {issue.is_emergency && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 z-20 animate-pulse"></div>}

                            <div className="flex flex-col sm:flex-row h-full">
                                
                                {/* Image Section */}
                                <div className="sm:w-48 h-48 sm:h-auto relative bg-black/50 flex-shrink-0">
                                    {issue.image_url ? (
                                        <img src={issue.image_url} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">NO SIGNAL</div>
                                    )}
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase text-white border border-white/10">
                                        {issue.category}
                                    </div>
                                </div>

                                {/* Data Section */}
                                <div className="p-5 flex flex-col justify-between flex-1">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-white leading-tight">{issue.title}</h3>
                                            <span className={`text-[10px] px-2 py-1 rounded border ${
                                                issue.status === 'Resolved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                                issue.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 
                                                'bg-red-500/20 text-red-400 border-red-500/30'
                                            }`}>
                                                {issue.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{issue.description}</p>
                                        
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                            <span>?? {issue.location ? issue.location.split(',')[0] : 'Unknown Location'}</span>
                                            <span>•</span>
                                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 border-t border-white/5 flex gap-2">
                                        <select 
                                            value={issue.status}
                                            onChange={(e) => updateStatus(issue.id, e.target.value)}
                                            className="bg-black/30 text-white text-xs rounded-lg px-3 py-2 border border-white/10 outline-none focus:border-blue-500 flex-1 cursor-pointer hover:bg-black/50 transition"
                                        >
                                            <option value="Submitted">?? Pending</option>
                                            <option value="In Progress">?? In Progress</option>
                                            <option value="Resolved">?? Resolved</option>
                                        </select>
                                        
                                        <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${issue.latitude},${issue.longitude}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg px-3 py-2 flex items-center justify-center transition"
                                            title="View on Google Maps"
                                        >
                                            ??
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
    return (
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition group">
            <div>
                <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-3xl font-bold text-white">{value}</div>
            </div>
            <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition`}>
                {icon}
            </div>
        </div>
    );
}