// File: app/profile/page.js

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({});
  
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
      setFormData(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // 2. Handle Updates
  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        username: formData.username,
        mobile: formData.mobile,
      })
      .eq('id', profile.id);

    if (!error) {
      setProfile(formData);
      setEditing(false);
      alert('Profile updated!');
    }
    setLoading(false);
  };

  // 3. Handle Avatar Upload
  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;

      // Upload to 'issue-images' bucket (re-using it for simplicity)
      const { error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('issue-images')
        .getPublicUrl(filePath);

      // Update profile with new URL
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      
      setProfile({ ...profile, avatar_url: publicUrl });
      alert('Avatar updated!');
    } catch (error) {
      alert('Error uploading avatar!');
      console.log(error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-slate-900">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      
      {/* BACK BUTTON */}
      <button onClick={() => router.push('/dashboard')} className="absolute top-4 left-4 text-white/80 hover:text-white flex items-center gap-2">
        ← Back to Dashboard
      </button>

      {/* GLASS PROFILE CARD */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>

        <div className="px-8 pb-8">
          
          {/* Avatar Circle */}
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white/20 bg-slate-800 overflow-hidden shadow-xl">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                            {profile?.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                </div>
                {/* Upload Overlay */}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                    <span className="text-white text-xs font-bold">{uploading ? '...' : 'Change'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading}/>
                </label>
            </div>

            <button 
                onClick={() => editing ? handleUpdate() : setEditing(true)}
                className={`px-6 py-2 rounded-full font-bold transition ${editing ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
                {editing ? 'Save Changes' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Info */}
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                    <label className="block text-white/50 text-xs uppercase font-bold mb-1">Full Name</label>
                    {editing ? (
                        <input 
                            value={formData.full_name || ''} 
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                        />
                    ) : (
                        <h2 className="text-2xl font-bold text-white">{profile.full_name || 'Anonymous'}</h2>
                    )}
                </div>

                {/* Username */}
                <div>
                    <label className="block text-white/50 text-xs uppercase font-bold mb-1">Username</label>
                    {editing ? (
                        <input 
                            value={formData.username || ''} 
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                        />
                    ) : (
                        <p className="text-lg text-white/80">@{profile.username}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Email (Read Only) */}
                 <div>
                    <label className="block text-white/50 text-xs uppercase font-bold mb-1">Email (Verified)</label>
                    <div className="flex items-center gap-2">
                        <p className="text-white/80">{profile.username}</p> {/* Note: username was originally email */}
                        <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded border border-green-500/30">Verified</span>
                    </div>
                </div>

                {/* Mobile */}
                <div>
                    <label className="block text-white/50 text-xs uppercase font-bold mb-1">Mobile Number</label>
                    {editing ? (
                        <input 
                            value={formData.mobile || ''} 
                            onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white focus:outline-none"
                        />
                    ) : (
                         <div className="flex items-center gap-2">
                            <p className="text-white/80">{profile.mobile || 'Not set'}</p>
                            {profile.mobile && <span className="bg-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30">Unverified</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Gamification Stats */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-6">
                <h3 className="text-white font-bold mb-3">Civic Impact</h3>
                <div className="flex gap-8">
                    <div>
                        <span className="block text-3xl font-bold text-purple-400">{profile.points}</span>
                        <span className="text-white/50 text-xs">Total Points</span>
                    </div>
                    <div>
                        <span className="block text-3xl font-bold text-blue-400">
                             {profile.points < 100 ? '1' : profile.points < 500 ? '2' : '3'}
                        </span>
                        <span className="text-white/50 text-xs">Current Level</span>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
