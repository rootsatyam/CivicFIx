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
  const [error, setError] = useState(null); // For validation errors
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error when typing
  };

  // LOGIC: Indian Mobile Validation
  const isValidIndianMobile = (number) => {
    const regex = /^[6-9]\d{9}$/; // Starts with 6-9, total 10 digits
    return regex.test(number);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Validate Mobile
    if (!isValidIndianMobile(formData.mobile)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        setLoading(false);
        return;
    }

    // 2. Validate Password Length
    if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // This ensures the redirect goes to the LIVE site, not localhost
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create Profile
      await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: formData.fullName,
          mobile: formData.mobile,
          username: formData.username,
          role: role === 'authority' ? 'admin' : 'citizen',
          points: 0
      });

      // CHECK: If email confirmation is required (session is null)
      if (!data.session) {
          alert("Account created! Please check your email to verify your account before logging in.");
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
      <div className="fixed inset-0 z-0">
        <img src="/city-issues-bg.jpg" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Join CivicFix</h2>
          <p className="text-white/80 mt-2">Create your citizen profile</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            <button type="button" onClick={() => setRole('citizen')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'citizen' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60'}`}>Citizen</button>
            <button type="button" onClick={() => setRole('authority')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${role === 'authority' ? 'bg-red-600 text-white shadow-lg' : 'text-white/60'}`}>Authority</button>
        </div>

        {/* Error Message Box */}
        {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-center">
                <p className="text-white text-sm font-medium">{error}</p>
            </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {[
            { name: 'fullName', placeholder: 'Full Name', type: 'text' },
            { name: 'username', placeholder: 'Choose Username', type: 'text' },
            { name: 'mobile', placeholder: 'Mobile Number (10 digits)', type: 'tel' },
            { name: 'email', placeholder: 'Email Address', type: 'email' },
            { name: 'password', placeholder: 'Password', type: 'password' }
          ].map((field) => (
            <div key={field.name}>
                <input
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    maxLength={field.name === 'mobile' ? 10 : 50}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition"
                />
            </div>
          ))}

          <button type="submit" disabled={loading} className={`w-full py-3 text-lg font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50 ${role === 'authority' ? 'bg-red-600' : 'bg-blue-600'}`}>
            {loading ? 'Processing...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-white/70 text-sm">Already have an account? <Link href="/login" className="font-bold text-white hover:underline">Log In</Link></p>
        </div>
      </div>
    </div>
  );
}