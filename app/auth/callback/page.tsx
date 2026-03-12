'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const ensureProfileAndGetUsername = async (user: any, accessToken?: string) => {
      // Use the server-side API route so the upsert runs with the service role key
      // (bypasses RLS regardless of whether the client session is fully established)
      try {
        const res = await fetch('/api/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            email: user.email || `${user.id.slice(0, 8)}@heyrate.me`,
            avatar_url: user.user_metadata?.avatar_url || null,
            access_token: accessToken,
          }),
        });
        const json = await res.json();
        if (json.username) return json.username as string;
        console.error('[callback] create-profile error:', json.error);
      } catch (err) {
        console.error('[callback] fetch /api/create-profile failed:', err);
      }

      // Fallback: check if the row already exists (e.g. returning user)
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      return existing?.username ?? null;
    };

    const redirectToProfile = async (user: any, accessToken?: string) => {
      const username = await ensureProfileAndGetUsername(user, accessToken);
      router.replace(username ? `/profile/${username}` : '/feed');
    };

    const init = async () => {
      let redirected = false;

      // Unified redirect helper — always uses the live session access_token
      const doRedirect = async (user: any, accessToken: string) => {
        if (redirected) return;
        redirected = true;
        await redirectToProfile(user, accessToken);
      };

      // ── PATH 1: PKCE flow — Supabase v2 default ──────────────────────────
      // After Google OAuth, Supabase sends: /auth/callback?code=XXXX
      const urlCode = new URLSearchParams(window.location.search).get('code');
      if (urlCode) {
        try {
          const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(urlCode);
          if (!codeErr && codeData?.session) {
            await doRedirect(codeData.session.user, codeData.session.access_token);
            return;
          }
          console.error('[callback] PKCE exchange error:', codeErr);
        } catch (e) {
          console.error('[callback] exchangeCodeForSession threw:', e);
        }
      }

      // ── PATH 2: Implicit flow — /auth/callback#access_token=XXXX ─────────
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        if (accessToken && refreshToken) {
          window.history.replaceState({}, '', '/auth/callback');
          try {
            const { data: sessData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessData?.session) {
              await doRedirect(sessData.session.user, sessData.session.access_token);
              return;
            }
          } catch {
            // fall through to PATH 3
          }
        }
      }

      // ── PATH 3: Session already exists (e.g. Supabase auto-detected code) ─
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        await doRedirect(existingSession.user, existingSession.access_token);
        return;
      }

      // ── PATH 4: Wait for onAuthStateChange (PKCE exchange still in-flight) ─
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!redirected && nextSession?.user) {
          subscription.unsubscribe();
          await doRedirect(nextSession.user, nextSession.access_token!);
        }
      });

      // ── PATH 5: 12s hard timeout ──────────────────────────────────────────
      setTimeout(async () => {
        if (redirected) return;
        subscription.unsubscribe();
        const { data: { session: lateSession } } = await supabase.auth.getSession();
        if (lateSession?.user) {
          await doRedirect(lateSession.user, lateSession.access_token);
          return;
        }
        // Nothing worked — send back to login
        router.replace('/login');
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
