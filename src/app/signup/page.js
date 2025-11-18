'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const [showPassword, setShowPassword] = useState(false); // NEW: Eye Toggle
  const [error, setError] = useState(null);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  // LOGIC: Strict Indian Mobile Validation
  const isValidIndianMobile = (number) => {
    const regex = /^[6-9]\d{9}$/; // Must start with 6,7,8,9 and be 10 digits
    return regex.test(number);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validation Checks
    if (!isValidIndianMobile(formData.mobile)) {
        setError("Please enter a valid 10-digit Indian mobile number (starting with 6-9).");
        setLoading(false);
        return;
    }
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    // 2. Sign Up
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

    // 3. Save Profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: formData.fullName,
          mobile: formData.mobile,
          username: formData.username,
          role: role === 'authority' ? 'admin' : 'citizen',
          points: 0
        });

      if (profileError) console.error('Error:', profileError);
      
      if (!data.session) {
        alert("Account created! Please check your email.");
        router.push('/login');
      } else {
        if (role === 'authority') router.push('/admin');
        else router.push('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* FIXED BACKGROUND handled by layout.js, just overlay here */}
      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Join CivicFix</h2>
          <p className="text-white/80 mt-2">Create your account</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            <button type="button" onClick={() => setRole('citizen')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'citizen' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Citizen</button>
            <button type="button" onClick={() => setRole('authority')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'authority' ? 'bg-red-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}>Authority</button>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-center text-white text-sm">{error}</div>}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Standard Inputs */}
          {['fullName', 'username'].map((key) => (
             <div key={key}>
                <input name={key} type="text" placeholder={key === 'fullName' ? 'Full Name' : 'Choose Username'} required onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition" />
             </div>
          ))}

          {/* Mobile Input */}
          <div>
             <input name="mobile" type="tel" placeholder="Mobile Number (10 digits)" maxLength={10} required onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition" />
          </div>

          {/* Email Input */}
          <div>
             <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition" />
          </div>

          {/* Password Input with EYE ICON */}
          <div className="relative">
            <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" required onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition pr-10" 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-white/50 hover:text-white">
                {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
            </button>
          </div>

          <button type="submit" disabled={loading} className={`w-full py-3 text-lg font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 ${role === 'authority' ? 'bg-red-600' : 'bg-blue-600'}`}>
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-white/70 text-sm">Already have an account? <Link href="/login" className="font-bold text-white hover:underline">Log In</Link></p>
        </div>

      </div>
    </div>
  );
}