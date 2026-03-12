'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const sanitizeHandle = (raw: string) => {
      const cleaned = raw
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      return cleaned.length >= 3 ? cleaned : `user_${Math.random().toString(36).slice(2, 8)}`;
    };

    const generateUniqueUsername = async (baseRaw: string) => {
      const base = sanitizeHandle(baseRaw).slice(0, 24);

      for (let i = 0; i < 50; i++) {
        const suffix = i === 0 ? '' : `_${i}`;
        const candidate = `${base}${suffix}`.slice(0, 30);

        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('username', candidate)
          .maybeSingle();

        if (!data) return candidate;
      }

      return `user_${Date.now().toString().slice(-8)}`;
    };

    const ensureProfileAndGetUsername = async (user: any) => {
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (existing?.username) return existing.username;

      const email = user.email || `${user.id.slice(0, 8)}@heyrate.me`;
      const emailHandle = email.split('@')[0] || user.id.slice(0, 8);
      const username = await generateUniqueUsername(emailHandle);

      await supabase.from('users').upsert(
        {
          id: user.id,
          email,
          username,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id' }
      );

      const { data: finalUser } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      return finalUser?.username || username;
    };

    const redirectToProfile = async (user: any) => {
      const username = await ensureProfileAndGetUsername(user);
      router.replace(username ? `/profile/${username}` : '/feed');
    };

    const init = async () => {
      // Force session creation from hash tokens (handles www/non-www callback quirks)
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }

        // Remove sensitive tokens from URL
        window.history.replaceState({}, '', '/auth/callback');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await redirectToProfile(session.user);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (nextSession?.user) {
          subscription.unsubscribe();
          await redirectToProfile(nextSession.user);
        }
      });

      // Final fallback with extra wait before sending to login
      setTimeout(async () => {
        subscription.unsubscribe();
        const { data: { session: lateSession } } = await supabase.auth.getSession();
        if (lateSession?.user) {
          await redirectToProfile(lateSession.user);
        } else {
          router.replace('/login');
        }
      }, 12000);
    };

    init();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Signing you in...</p>
      </div>
    </div>
  );
}
