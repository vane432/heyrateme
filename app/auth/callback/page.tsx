'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      if (data?.username) {
        router.replace(`/profile/${data.username}`);
      } else {
        // Profile not created yet by trigger — wait briefly and retry once
        setTimeout(async () => {
          const { data: retryData } = await supabase
            .from('users')
            .select('username')
            .eq('id', userId)
            .single();
          router.replace(retryData?.username ? `/profile/${retryData.username}` : '/feed');
        }, 2000);
      }
    };

    // First check if session already exists (e.g. page reload)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await redirectToProfile(session.user.id);
        return;
      }

      // Otherwise wait for SIGNED_IN event (fires when Supabase processes the OAuth tokens)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          subscription.unsubscribe();
          await redirectToProfile(session.user.id);
        }
        // If token_refreshed or other events with a session, also handle
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          subscription.unsubscribe();
          await redirectToProfile(session.user.id);
        }
      });

      // Safety fallback — if nothing fires after 5s, go to login
      setTimeout(() => {
        subscription.unsubscribe();
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            redirectToProfile(session.user.id);
          } else {
            router.replace('/login');
          }
        });
      }, 5000);
    });
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
