'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const ensureProfileAndGetUsername = async (user: any, accessToken?: string) => {
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
      } catch (err) {
        console.error('[callback] create-profile failed:', err);
      }

      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      return existing?.username ?? null;
    };

    const redirectToProfile = async (user: any, accessToken?: string) => {
      const username = await ensureProfileAndGetUsername(user, accessToken);
      router.replace(username ? `/${username}` : '/feed');
    };

    const init = async () => {
      let redirected = false;

      const doRedirect = async (user: any, accessToken: string) => {
        if (redirected) return;
        redirected = true;
        await redirectToProfile(user, accessToken);
      };

      // PATH 1: PKCE flow (?code=)
      const urlCode = new URLSearchParams(window.location.search).get('code');
      if (urlCode) {
        try {
          const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(urlCode);
          if (!codeErr && codeData?.session) {
            await doRedirect(codeData.session.user, codeData.session.access_token);
            return;
          }
        } catch (e) {
          console.error('[callback] PKCE error:', e);
        }
      }

      // PATH 2: Implicit flow (#access_token)
      if (window.location.hash.includes('access_token')) {
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
            // fall through
          }
        }
      }

      // PATH 3: Existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        await doRedirect(existingSession.user, existingSession.access_token);
        return;
      }

      // PATH 4: Wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!redirected && nextSession?.user) {
          subscription.unsubscribe();
          await doRedirect(nextSession.user, nextSession.access_token!);
        }
      });

      // PATH 5: 12s timeout
      setTimeout(async () => {
        if (redirected) return;
        subscription.unsubscribe();
        const { data: { session: lateSession } } = await supabase.auth.getSession();
        if (lateSession?.user) {
          await doRedirect(lateSession.user, lateSession.access_token);
          return;
        }
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
