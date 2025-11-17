// File: app/signup/page.js

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
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign Up
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // We also save this in metadata as a backup
        data: {
          full_name: formData.fullName,
          username: formData.username,
        }
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // 2. Force Save Profile Data (Using Upsert to fix race conditions)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({  // <--- CHANGED FROM update TO upsert
          id: data.user.id, // Explicitly link the ID
          full_name: formData.fullName,
          mobile: formData.mobile,
          username: formData.username,
          role: role === 'authority' ? 'admin' : 'citizen',
          points: 0 // Default points
        });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        // Even if this fails, we let them through, but log it.
      }
      
      if (role === 'authority') router.push('/admin');
      else router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"> 

      <div className="relative z-10 w-full max-w-md p-8 space-y-6 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
        
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-white drop-shadow-md">Join  CivicFix</h2>
          <p className="text-white/80 mt-2">Create your account</p>
        </div>

        <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            <button 
                type="button"
                onClick={() => setRole('citizen')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    role === 'citizen' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
            >
                Citizen
            </button>
            <button 
                type="button"
                onClick={() => setRole('authority')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                    role === 'authority' 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
                    : 'text-white/60 hover:text-white'
                }`}
            >
                Authority
            </button>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {[
            { name: 'fullName', placeholder: 'Full Name', type: 'text' },
            { name: 'username', placeholder: 'Choose Username', type: 'text' },
            { name: 'mobile', placeholder: 'Mobile Number', type: 'tel' },
            { name: 'email', placeholder: 'Email Address', type: 'email' },
            { name: 'password', placeholder: 'Password', type: 'password' }
          ].map((field) => (
            <div key={field.name}>
                <input
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    required
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition duration-200"
                />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-lg font-bold text-white rounded-xl shadow-lg hover:scale-[1.02] transition transform disabled:opacity-50
                ${role === 'authority' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-red-500/30' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-blue-500/30'}
            `}
          >
            {loading ? 'Creating...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-white/70 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-white hover:text-blue-300 transition underline decoration-blue-400 underline-offset-4">
              Log In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}