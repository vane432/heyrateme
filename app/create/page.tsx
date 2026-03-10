'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getOrCreateUser } from '@/lib/queries';
import UploadPost from '@/components/UploadPost';

export default function CreatePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
    } else {
      const dbUser = await getOrCreateUser(authUser);
      setUser(dbUser);
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <UploadPost userId={user.id} onSuccess={handleSuccess} />
    </div>
  );
}
