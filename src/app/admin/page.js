// File: app/admin/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. Check Permission & Fetch Data
  useEffect(() => {
    const checkAdminAndFetch = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        alert("ACCESS DENIED: You are not an authorized official.");
        router.push('/dashboard'); // Kick them out
        return;
      }

      setIsAdmin(true);

      // Fetch ALL issues (Admin sees everything)
      const { data: issuesData, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setIssues(issuesData || []);
      
      setLoading(false);
    };

    checkAdminAndFetch();
  }, []);

  // 2. Handle Status Update
  const updateStatus = async (issueId, newStatus) => {
    // Optimistic UI Update (Instant change)
    setIssues(issues.map(i => i.id === issueId ? { ...i, status: newStatus } : i));

    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus })
      .eq('id', issueId);

    if (error) {
      alert('Failed to update status');
      console.error(error);
      // Revert if failed (optional complexity omitted for brevity)
    } else {
      // If resolved, maybe add points to the user? (Future feature)
      console.log(`Issue ${issueId} marked as ${newStatus}`);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Verifying Credentials...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      
      {/* Admin Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">ADMIN</div>
                <h1 className="text-xl font-bold">Authority Control Room</h1>
            </div>
            <button onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white text-sm">
                Exit to User App
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">Issue</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Proof</th>
                            <th className="px-6 py-4">Status (Action)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {issues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-slate-700/50 transition">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-white">{issue.title}</p>
                                    <p className="text-slate-400 text-sm">{issue.category}</p>
                                    <p className="text-slate-500 text-xs mt-1">ID: {issue.id}</p>
                                </td>
                                <td className="px-6 py-4 text-slate-300 text-sm">
                                    {issue.location}
                                    <div className="text-xs text-slate-500 mt-1">
                                        {new Date(issue.created_at).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {issue.image_url ? (
                                        <a href={issue.image_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm underline">
                                            View Photo
                                        </a>
                                    ) : (
                                        <span className="text-slate-600 text-xs">No Image</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <select 
                                        value={issue.status}
                                        onChange={(e) => updateStatus(issue.id, e.target.value)}
                                        className={`bg-slate-900 border border-slate-600 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-bold ${
                                            issue.status === 'Resolved' ? 'text-green-400' :
                                            issue.status === 'In Progress' ? 'text-yellow-400' :
                                            'text-red-400'
                                        }`}
                                    >
                                        <option value="Submitted">🔴 Submitted</option>
                                        <option value="In Progress">🟡 In Progress</option>
                                        <option value="Resolved">🟢 Resolved</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
}