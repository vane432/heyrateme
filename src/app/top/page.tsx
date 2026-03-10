'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getTopPosts } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';

export default function TopPage() {
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUserAndLoadPosts();
  }, []);

  const checkUserAndLoadPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    await loadTopPosts();
  };

  const loadTopPosts = async () => {
    setLoading(true);
    try {
      const data = await getTopPosts();
      setTopPosts(data);
    } catch (error) {
      console.error('Error loading top posts:', error);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Top Posts Today</h1>
      <p className="text-gray-600 mb-8">
        Ranked by rating score: average rating × log(number of ratings)
      </p>

      {topPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No posts today yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {topPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="flex gap-4 bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-xl font-bold">
                {index + 1}
              </div>

              {/* Image */}
              <div className="flex-shrink-0 w-24 h-24 relative rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={post.image_url}
                  alt={post.caption}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {post.users.username}
                  </span>
                  <span className="text-sm text-gray-500">• {post.category}</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-2 mb-2">
                  {post.caption}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-semibold">
                      {post.average_rating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {post.rating_count} {post.rating_count === 1 ? 'rating' : 'ratings'}
                  </span>
                  <span className="text-gray-400">
                    Score: {post.score.toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
