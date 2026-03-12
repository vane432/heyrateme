'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    const decodeJwtPayload = (token: string): any | null => {
      try {
        const part = token.split('.')[1];
        if (!part) return null;
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        return JSON.parse(atob(padded));
      } catch {
        return null;
      }
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
      let tokenUserId: string | null = null;
      let tokenEmailHandle: string | null = null;

      // Force session creation from hash tokens (handles www/non-www callback quirks)
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        if (accessToken) {
          const payload = decodeJwtPayload(accessToken);
          tokenUserId = payload?.sub || null;
          tokenEmailHandle = payload?.email ? String(payload.email).split('@')[0] : null;
        }

        if (accessToken && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          } catch {
            // We'll still try session/user recovery paths below
          }
        }

        // Remove sensitive tokens from URL
        window.history.replaceState({}, '', '/auth/callback');
      }

      const tryResolveAndRedirect = async () => {
        // 1) Preferred: authenticated user from session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await redirectToProfile(user);
          return true;
        }

        // 2) Fallback: find DB profile by user id from token payload
        if (tokenUserId) {
          for (let i = 0; i < 10; i++) {
            const { data } = await supabase
              .from('users')
              .select('username')
              .eq('id', tokenUserId)
              .maybeSingle();

            if (data?.username) {
              router.replace(`/profile/${data.username}`);
              return true;
            }

            await wait(700);
          }
        }

        return false;
      };

      if (await tryResolveAndRedirect()) return;

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
        if (await tryResolveAndRedirect()) return;

        // Last-resort fallback: route to a deterministic profile path based on email handle
        if (tokenEmailHandle) {
          router.replace(`/profile/${sanitizeHandle(tokenEmailHandle)}`);
        } else {
          router.replace('/feed');
        }
      }, 15000);
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
