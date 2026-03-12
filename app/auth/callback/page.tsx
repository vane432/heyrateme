'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const log = (msg: string) => {
      console.log('[callback]', msg);
      setStatus(msg);
    };

    const addDebug = (info: string) => {
      console.log('[debug]', info);
      setDebugInfo(prev => prev + '\n' + info);
    };

    const ensureProfileAndGetUsername = async (user: any, accessToken?: string) => {
      log('Creating/fetching profile...');
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
        addDebug(`API response: ${res.status} - ${JSON.stringify(json)}`);
        if (json.username) return json.username as string;
      } catch (err: any) {
        addDebug(`API fetch error: ${err.message}`);
      }

      // Fallback: check if the row already exists
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();
      addDebug(`Fallback DB lookup: ${JSON.stringify(existing)}`);
      return existing?.username ?? null;
    };

    const redirectToProfile = async (user: any, accessToken?: string) => {
      const username = await ensureProfileAndGetUsername(user, accessToken);
      log(`Redirecting to: ${username ? `/profile/${username}` : '/feed'}`);
      router.replace(username ? `/profile/${username}` : '/feed');
    };

    const init = async () => {
      let redirected = false;

      const doRedirect = async (user: any, accessToken: string) => {
        if (redirected) return;
        redirected = true;
        await redirectToProfile(user, accessToken);
      };

      // Log initial URL state
      addDebug(`URL: ${window.location.href}`);
      addDebug(`Search: ${window.location.search}`);
      addDebug(`Hash: ${window.location.hash ? 'present' : 'none'}`);

      // ── PATH 1: PKCE flow ──
      const urlCode = new URLSearchParams(window.location.search).get('code');
      if (urlCode) {
        log('Found ?code= param, exchanging for session...');
        addDebug(`Code length: ${urlCode.length}`);
        try {
          const { data: codeData, error: codeErr } = await supabase.auth.exchangeCodeForSession(urlCode);
          if (codeErr) {
            addDebug(`PKCE error: ${codeErr.message}`);
          }
          if (!codeErr && codeData?.session) {
            log('PKCE exchange successful!');
            addDebug(`User: ${codeData.session.user.email}`);
            await doRedirect(codeData.session.user, codeData.session.access_token);
            return;
          }
        } catch (e: any) {
          addDebug(`PKCE threw: ${e.message}`);
        }
      } else {
        addDebug('No ?code= param found');
      }

      // ── PATH 2: Implicit flow (#access_token) ──
      if (window.location.hash.includes('access_token')) {
        log('Found #access_token, setting session...');
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        if (accessToken && refreshToken) {
          window.history.replaceState({}, '', '/auth/callback');
          try {
            const { data: sessData, error: sessErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessErr) addDebug(`setSession error: ${sessErr.message}`);
            if (sessData?.session) {
              log('Implicit flow session set!');
              await doRedirect(sessData.session.user, sessData.session.access_token);
              return;
            }
          } catch (e: any) {
            addDebug(`setSession threw: ${e.message}`);
          }
        }
      }

      // ── PATH 3: Existing session ──
      log('Checking for existing session...');
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession?.user) {
        log('Found existing session!');
        addDebug(`User: ${existingSession.user.email}`);
        await doRedirect(existingSession.user, existingSession.access_token);
        return;
      }
      addDebug('No existing session');

      // ── PATH 4: Wait for auth state change ──
      log('Waiting for auth state change...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
        addDebug(`Auth event: ${event}`);
        if (!redirected && nextSession?.user) {
          subscription.unsubscribe();
          log(`Auth state changed: ${event}`);
          await doRedirect(nextSession.user, nextSession.access_token!);
        }
      });

      // ── PATH 5: 12s timeout ──
      setTimeout(async () => {
        if (redirected) return;
        subscription.unsubscribe();
        log('Timeout reached, final session check...');
        const { data: { session: lateSession } } = await supabase.auth.getSession();
        if (lateSession?.user) {
          await doRedirect(lateSession.user, lateSession.access_token);
          return;
        }
        addDebug('No session after timeout — redirecting to login');
        router.replace('/login');
      }, 12000);
    };

    init();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-lg mx-auto p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg mb-2">{status}</p>
        <pre className="text-left text-xs bg-gray-100 p-2 rounded mt-4 overflow-auto max-h-48 text-gray-500">
          {debugInfo || 'Loading debug info...'}
        </pre>
      </div>
    </div>
  );
}
