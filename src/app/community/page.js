// File: app/community/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const IssueMap = dynamic(() => import('../components/IssueMap'), { ssr: false });

export default function CommunityPage() {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedIssues, setVotedIssues] = useState({});
  const [viewMode, setViewMode] = useState('list');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchCommunityIssues = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .neq('status', 'Resolved')
        .order('created_at', { ascending: false });

      if (!error) setIssues(data || []);
      setLoading(false);
    };
    fetchCommunityIssues();
  }, []);

  const handleVote = async (issueId, isDispute) => {
    if (votedIssues[issueId]) { alert("Already voted!"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    setVotedIssues((prev) => ({ ...prev, [issueId]: isDispute ? 'dispute' : 'verify' }));
    await supabase.from('verifications').insert([{ issue_id: issueId, user_id: user.id, is_dispute: isDispute }]);
  };

  return (
    <div 
      className="min-h-screen text-white"
      style={{
        backgroundImage: `url('/city-issues-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-[2px] z-0"></div>

      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center cursor-pointer gap-2" onClick={() => router.push('/dashboard')}>
                <span className="text-xl font-bold">CivicFix Community</span>
            </div>
            
            <div className="flex bg-black/30 p-1 rounded-lg border border-white/10">
               <button onClick={() => setViewMode('list')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>List</button>
               <button onClick={() => setViewMode('map')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'map' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>Map</button>
            </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        
        {viewMode === 'map' ? (
            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                <IssueMap issues={issues} />
            </div>
        ) : (
            <div className="space-y-6">
            {loading ? (
                <p className="text-center text-white/50 py-10">Loading community feed...</p>
            ) : (
                issues.map((issue, index) => (
                <motion.div 
                    key={issue.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg hover:bg-white/15 transition"
                >
                    <div className="p-6">
                    {/* Tags */}
                    <div className="flex items-center justify-between mb-4">
                        <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {issue.category}
                        </span>
                        <span className="text-white/40 text-xs">{new Date(issue.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-white mb-2">{issue.title}</h3>
                    <p className="text-slate-300 text-sm mb-4">{issue.description}</p>
                    
                    {/* Image */}
                    {issue.image_url && (
                        <div className="mt-3 mb-5 rounded-xl overflow-hidden shadow-lg border border-white/5">
                            <img src={issue.image_url} alt="Reported Issue" className="w-full h-64 object-cover hover:scale-105 transition duration-500" />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <button 
                            onClick={() => handleVote(issue.id, false)}
                            disabled={!!votedIssues[issue.id]}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition ${votedIssues[issue.id] === 'verify' ? 'bg-green-500 text-white' : 'bg-white/5 text-green-400 hover:bg-green-500/20'}`}
                        >
                            ✅ Verify
                        </button>
                        <button 
                            onClick={() => handleVote(issue.id, true)}
                            disabled={!!votedIssues[issue.id]}
                            className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold transition ${votedIssues[issue.id] === 'dispute' ? 'bg-red-500 text-white' : 'bg-white/5 text-red-400 hover:bg-red-500/20'}`}
                        >
                            ⚠️ Dispute
                        </button>
                    </div>
                    </div>
                </motion.div>
                ))
            )}
            </div>
        )}
      </main>
    </div>
  );
}