// File: app/login/page.js

'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  // VIEW STATE: 'login' | 'forgot' | 'resend'
  const [view, setView] = useState('login'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen'); 
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null); // Separate state for errors
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // 1. LOGIN LOGIC
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      // If error is about unconfirmed email, suggest resending
      if (error.message.includes("Email not confirmed")) {
        setErrorMsg("Email not confirmed. Please check your inbox or resend the link.");
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  };

  // 2. RESET PASSWORD LOGIC
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Check your email! We sent you a password reset link.');
    }
    setLoading(false);
  };

  // 3. RESEND CONFIRMATION LOGIC (NEW)
  const handleResendConfirmation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setMessage('Confirmation email resent! Please check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"> 

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 transition-all duration-500">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 shadow-inner">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {view === 'login' ? (
                 <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              ) : (
                 <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              )}
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white drop-shadow-md">
            {view === 'login' ? 'Welcome Back' : view === 'forgot' ? 'Reset Password' : 'Resend Link'}
          </h2>
          <p className="text-white/80 mt-2 text-center">
            {view === 'login' ? 'Sign in to your account' : 
             view === 'forgot' ? 'Enter email to receive recovery link' : 
             'Enter email to resend confirmation'}
          </p>
        </div>

        {/* --- MESSAGES --- */}
        {message && (
          <div className="bg-green-500/20 border border-green-500/50 p-3 rounded-lg text-center animate-pulse">
            <p className="text-white font-medium text-sm">{message}</p>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-center">
            <p className="text-white font-medium text-sm">{errorMsg}</p>
          </div>
        )}

        {/* --- VIEW 1: LOGIN FORM --- */}
        {view === 'login' && (
          <>
            <div className="flex bg-black/30 p-1 rounded-xl border border-white/10">
                <button type="button" onClick={() => setRole('citizen')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'citizen' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Citizen</button>
                <button type="button" onClick={() => setRole('authority')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'authority' ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Authority</button>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
                <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition duration-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
                <input type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition duration-200" />
                
                <div className="flex justify-between mt-2">
                  <button type="button" onClick={() => setView('resend')} className="text-xs text-white/60 hover:text-white hover:underline transition">
                    Resend Confirmation?
                  </button>
                  <button type="button" onClick={() => setView('forgot')} className="text-xs text-blue-300 hover:text-white hover:underline transition">
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className={`w-full py-3 text-lg font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 ${role === 'authority' ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-red-500/30' : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-blue-500/30'}`}>
                {loading ? 'Logging In...' : `Log In as ${role === 'authority' ? 'Authority' : 'Citizen'}`}
              </button>
            </form>
          </>
        )}

        {/* --- VIEW 2 & 3: FORGOT PASSWORD & RESEND CONFIRMATION --- */}
        {(view === 'forgot' || view === 'resend') && (
          <form className="space-y-6" onSubmit={view === 'forgot' ? handleResetPassword : handleResendConfirmation}>
             <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email Address</label>
                <input type="email" required placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition duration-200" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 text-lg font-bold text-white rounded-xl shadow-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-purple-500/30 hover:scale-[1.02] transition transform disabled:opacity-50">
                {loading ? 'Sending...' : (view === 'forgot' ? 'Resend Reset Link' : 'Resend Confirmation Email')}
              </button>

              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full py-3 text-sm font-bold text-white/70 hover:text-white transition"
              >
                ← Back to Login
              </button>
          </form>
        )}

        {/* FOOTER */}
        {view === 'login' && (
          <div className="text-center">
            <p className="text-white/70 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="font-bold text-white hover:text-blue-300 transition underline decoration-blue-400 underline-offset-4">
                Sign up
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}