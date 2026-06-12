'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code.trim()) {
      setError('Please enter your invite code');
      return;
    }

    setIsLoading(true);

    try {
      const enteredCode = code.trim().toUpperCase();
      const { data, error: fetchError } = await supabase
        .from('invite_codes')
        .select('id, code, is_active, used_at')
        .eq('code', enteredCode)
        .single();

      // Valid if: found, is_active = true, used_at = null
      if (fetchError || !data || !(data as any).is_active || (data as any).used_at) {
        setError('Invalid or already used invite code');
        setIsLoading(false);
        return;
      }

      // Store valid code in sessionStorage to use after OAuth callback
      sessionStorage.setItem('invite_code', enteredCode);
      
      // Trigger Google OAuth sign in
      const { error: signInError } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (signInError) throw signInError;

    } catch (err: any) {
      console.error('Invite validation error:', err);
      setError('Something went wrong, please try again');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF385C] to-[#FF7043] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center text-center">
        {/* Logo Placeholder */}
        <div className="w-16 h-16 bg-[#FF385C]/10 rounded-full flex items-center justify-center mb-6 text-[#FF385C]">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-gray-900 mb-2">You&apos;re invited</h1>
        <p className="text-sm text-gray-500 mb-8">Enter your invite code to join the beta</p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code e.g. HRM-A3F9B2C1"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-center font-mono font-bold text-gray-900 placeholder:text-gray-400 placeholder:font-sans placeholder:font-normal mb-2"
            disabled={isLoading}
          />
          
          <div className="h-6 mb-4">
            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF385C] text-white py-3.5 rounded-full font-bold hover:bg-[#E63250] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#FF385C]/30"
          >
            {isLoading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}