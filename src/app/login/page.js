'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [view, setView] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NEW: Toggle State
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [originUrl, setOriginUrl] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get the correct URL (Vercel or Localhost) on load
  useEffect(() => {
    setOriginUrl(window.location.origin);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profile?.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // USE THE DYNAMIC ORIGIN URL
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${originUrl}/auth/callback?next=/dashboard`,
    });

    if (error) setErrorMsg(error.message);
    else setMessage('Check your email! We sent you a password reset link.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="fixed inset-0 z-0">
        <img src="/city-issues-bg.jpg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white drop-shadow-md">{view === 'login' ? 'Welcome Back' : 'Reset Password'}</h2>
        </div>

        {message && <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg text-center"><p className="text-white text-sm">{message}</p></div>}
        {errorMsg && <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-center"><p className="text-white text-sm">{errorMsg}</p></div>}

        {view === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
                <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
                <input 
                    type={showPassword ? "text" : "password"} // TOGGLE TYPE
                    required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 pr-10" 
                />
                {/* EYE ICON BUTTON */}
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-white/50 hover:text-white">
                    {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                </button>
              </div>
              
              <div className="flex justify-end"><button type="button" onClick={() => setView('forgot')} className="text-sm text-blue-300 hover:underline">Forgot Password?</button></div>

              <button type="submit" disabled={loading} className="w-full py-3 font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:scale-[1.02] transition disabled:opacity-50">{loading ? 'Logging In...' : 'Log In'}</button>
            </form>
        )}

        {view === 'forgot' && (
          <form className="space-y-6" onSubmit={handleResetPassword}>
             <div><label className="block text-sm font-medium text-white/80 mb-1">Email Address</label><input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50" /></div>
              <button type="submit" disabled={loading} className="w-full py-3 font-bold text-white bg-purple-600 rounded-xl shadow-lg hover:scale-[1.02] transition disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
              <button type="button" onClick={() => setView('login')} className="w-full py-3 text-sm font-bold text-white/70 hover:text-white">← Back</button>
          </form>
        )}
      </div>
    </div>
  );
}