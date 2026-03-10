'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    checkUserAndLoadProfile();
  }, [username]);

  const checkUserAndLoadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    await loadProfile();
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile(username);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex items-center gap-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
            {profile.user.avatar_url ? (
              <Image
                src={profile.user.avatar_url}
                alt={profile.user.username}
                width={128}
                height={128}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-400 text-white font-bold text-5xl">
                {profile.user.username[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{profile.user.username}</h1>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold">{profile.postCount}</div>
                <div className="text-sm text-gray-600">
                  {profile.postCount === 1 ? 'Post' : 'Posts'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : 'N/A'}
                  {profile.averageRating > 0 && (
                    <span className="text-yellow-400 text-xl">★</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Posts</h2>
        {profile.posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No posts yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {profile.posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
              >
                <Image
                  src={post.image_url}
                  alt={post.caption}
                  fill
                  className="object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="text-white text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold">
                      <span>{post.average_rating.toFixed(1)}</span>
                      <span className="text-yellow-400">★</span>
                    </div>
                    <div className="text-sm">
                      {post.rating_count} {post.rating_count === 1 ? 'rating' : 'ratings'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
