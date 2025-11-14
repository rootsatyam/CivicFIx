// File: app/track/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function TrackIssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchMyIssues = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // LOGIC FIX: Only fetch issues submitted by THIS user
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('submitted_by', user.id) // <--- THE KEY FILTER
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setIssues(data || []);
      
      setLoading(false);
    };

    fetchMyIssues();
  }, []);

  // Helper for status badges
  const getStatusStyle = (status) => {
    if (status === 'Resolved') return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (status === 'In Progress') return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-red-500/20 text-red-300 border-red-500/50';
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundImage: `url('/city-issues-bg.jpg')`, // Using your city image
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' // Parallax effect
      }}
    >
      {/* Dark Overlay for readability */}
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-[3px] z-0"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-md">My Reports</h1>
                <p className="text-slate-300 text-sm">Track the progress of issues you submitted.</p>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-white/70 hover:text-white flex items-center gap-2 transition">
                ← Back
            </button>
        </div>

        {/* Content */}
        {loading ? (
            <div className="text-white/50 text-center py-20">Loading your reports...</div>
        ) : issues.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center backdrop-blur-md">
                <p className="text-slate-300 text-lg">You haven't reported anything yet.</p>
                <button onClick={() => router.push('/dashboard')} className="mt-4 text-blue-400 hover:underline">Go to Dashboard to report</button>
            </div>
        ) : (
            <div className="space-y-6">
                {issues.map((issue, index) => (
                    <motion.div 
                        key={issue.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md hover:bg-white/15 transition duration-300"
                    >
                        <div className="p-6 md:flex gap-6">
                            
                            {/* Image Section */}
                            {issue.image_url && (
                                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden flex-shrink-0 mb-4 md:mb-0 bg-black/30 relative">
                                    <img src={issue.image_url} alt="Evidence" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Details Section */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            {issue.is_emergency && <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">EMERGENCY</span>}
                                            <span className="text-blue-300 text-xs font-bold uppercase tracking-wide">{issue.category}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{issue.title}</h3>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                </div>

                                <p className="text-slate-300 text-sm mb-4 line-clamp-2">{issue.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-slate-400">
                                    <div className="flex items-center gap-4">
                                        <span>📍 {issue.location?.split(',')[0]}</span>
                                        <span>📅 {new Date(issue.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {/* Progress Indicator */}
                                    <div className="flex items-center gap-2">
                                        <span>Progress:</span>
                                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${issue.status === 'Resolved' ? 'bg-green-500' : 'bg-blue-500'}`} 
                                                style={{ width: issue.status === 'Resolved' ? '100%' : issue.status === 'In Progress' ? '50%' : '10%' }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}