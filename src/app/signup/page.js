'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    mobile: '',
    username: ''
  });
  const [role, setRole] = useState('citizen'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // WAITING STATE
  const [verificationPending, setVerificationPending] = useState(false);

  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // --- POLL FOR VERIFICATION ---
  useEffect(() => {
    let interval;
    if (verificationPending) {
        interval = setInterval(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                if (role === 'authority') router.push('/admin');
                else router.push('/dashboard');
            }
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [verificationPending, role, router, supabase]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const isValidIndianMobile = (number) => {
    const regex = /^[6-9]\d{9}$/; 
    return regex.test(number);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!isValidIndianMobile(formData.mobile)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        setLoading(false);
        return;
    }
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: formData.fullName,
          mobile: formData.mobile,
          username: formData.username,
          role: role === 'authority' ? 'admin' : 'citizen',
          points: 0
      });

      if (data.session) {
          if (role === 'authority') router.push('/admin');
          else router.push('/dashboard');
      } else {
          setVerificationPending(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* The background is handled by layout.js, this div centers the content */}
      
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden transition-all duration-500">
        
        <AnimatePresence mode='wait'>
            
            {/* --- VIEW 1: WAITING FOR VERIFICATION (Glass Style) --- */}
            {verificationPending ? (
                <motion.div 
                    key="waiting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center space-y-8 py-6"
                >
                    {/* Pulsing Icon */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/10 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                    </div>
                    
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            We sent a secure link to <span className="text-blue-300 font-medium">{formData.email}</span>.
                            <br/>Click it to activate your account.
                        </p>
                    </div>

                    {/* Modern Loading Indicator */}
                    <div className="flex items-center justify-center gap-3">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        <span className="text-blue-300 text-xs font-bold tracking-[0.2em] uppercase">Waiting for confirmation</span>
                    </div>

                    <div className="pt-4">
                         <button 
                            onClick={() => window.location.reload()}
                            className="text-white/40 hover:text-white text-xs hover:underline transition"
                         >
                            Verified? Click to refresh
                         </button>
                    </div>
                </motion.div>
            ) : (

                /* --- VIEW 2: SIGNUP FORM (Glass Style) --- */
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-white drop-shadow-lg">Join CivicFix</h2>
                        <p className="text-white/70 mt-2 text-sm">Create your citizen profile</p>
                    </div>

                    {/* Glass Role Toggle */}
                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 mb-6">
                        <button type="button" onClick={() => setRole('citizen')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${role === 'citizen' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>Citizen</button>
                        <button type="button" onClick={() => setRole('authority')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${role === 'authority' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>Authority</button>
                    </div>

                    {error && <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-center text-white text-sm mb-4 backdrop-blur-md">{error}</div>}

                    <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Inputs with Dark Glass Style */}
                        {['fullName', 'username'].map((key) => (
                            <div key={key}>
                                <input 
                                    name={key} 
                                    type="text" 
                                    placeholder={key === 'fullName' ? 'Full Name' : 'Choose Username'} 
                                    required 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/40 transition duration-200" 
                                />
                            </div>
                        ))}

                        {/* Mobile */}
                        <input 
                            name="mobile" 
                            type="tel" 
                            placeholder="Mobile Number (10 digits)" 
                            maxLength={10} 
                            required 
                            onChange={handleChange} 
                            className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/40 transition duration-200" 
                        />

                        {/* Email */}
                        <input 
                            name="email" 
                            type="email" 
                            placeholder="Email Address" 
                            required 
                            onChange={handleChange} 
                            className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/40 transition duration-200" 
                        />

                        {/* Password with Eye */}
                        <div className="relative">
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                required 
                                onChange={handleChange} 
                                className="w-full px-4 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-black/40 transition duration-200 pr-10" 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-white/50 hover:text-white transition">
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                )}
                            </button>
                        </div>

                        <button type="submit" disabled={loading} className={`w-full py-4 font-bold text-white text-lg rounded-xl shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 ${role === 'authority' ? 'bg-gradient-to-r from-red-600 to-red-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                            {loading ? 'Creating Profile...' : 'Sign Up Now'}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-white/60 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="font-bold text-white hover:text-blue-300 transition underline decoration-blue-400 underline-offset-4">
                                Log In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}