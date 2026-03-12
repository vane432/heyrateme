'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getOrCreateUser } from '@/lib/queries';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      const finalize = async (s: typeof session) => {
        if (s?.user) {
          try {
            const profile = await getOrCreateUser(s.user);
            // Redirect to the user's own profile page
            router.replace(`/profile/${profile.username}`);
          } catch (e) {
            // Fallback: look up username from DB
            const { data } = await supabase
              .from('users')
              .select('username')
              .eq('id', s.user.id)
              .single();
            if (data?.username) {
              router.replace(`/profile/${data.username}`);
            } else {
              router.replace('/feed');
            }
          }
        } else {
          router.replace('/login');
        }
      };

      if (session) {
        await finalize(session);
      } else {
        setTimeout(async () => {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          await finalize(retrySession);
        }, 1500);
      }
    };

    handleAuthCallback();
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
