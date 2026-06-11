'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getTopPosts, getTopCreators } from '@/lib/queries';
import Image from 'next/image';
import Link from 'next/link';

type Timeframe = 'today' | 'week' | 'month' | 'all_time' | 'creators';

export default function TopPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const router = useRouter();

  useEffect(() => {
    checkUserAndLoadPosts();
  }, []);

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const checkUserAndLoadPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let fetchedData;
      if (timeframe === 'creators') {
        fetchedData = await getTopCreators(10);
      } else {
        fetchedData = await getTopPosts(timeframe, 10);
      }
      setData(fetchedData);
    } catch (error) {
      console.error('Error loading top posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeframes: { id: Timeframe; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'all_time', label: 'All Time' },
    { id: 'creators', label: 'Top Creators' }
  ];

  const isPodiumView = timeframe === 'today' || timeframe === 'week';
  const isCreators = timeframe === 'creators';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-8 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100">Charts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">The best outfits rise to the top</p>
        </header>
  
        {/* Time Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {timeframes.map(tf => (
            <button
              key={tf.id}
              onClick={() => {
                if (timeframe !== tf.id) {
                  setLoading(true);
                  setData([]);
                  setTimeframe(tf.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                timeframe === tf.id
                  ? 'bg-[#FF385C] text-white'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
  
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C]"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="w-12 h-12 opacity-30" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500">No posts yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center px-8">
              Be the first on the charts {timeframe === 'today' ? 'today' : 'in this timeframe'}
            </p>
            <Link href="/create" className="mt-2 px-5 py-2 bg-[#FF385C] text-white text-sm font-bold rounded-full hover:bg-[#E63250] transition-colors shadow-lg shadow-[#FF385C]/30">
              + Post Now
            </Link>
          </div>
        ) : (
          <>
            {!isCreators ? (
              <>
                {/* Podium View for Today and Week */}
                {isPodiumView && data.length >= 3 && (
                  <div className="flex items-end justify-center gap-2 md:gap-4 mb-8 mt-6">
                    {/* Rank 2 (Left) */}
                    {data[1] && <PodiumCard post={data[1]} rank={2} />}
                    
                    {/* Rank 1 (Center) */}
                    {data[0] && <PodiumCard post={data[0]} rank={1} isWinner />}
                    
                    {/* Rank 3 (Right) */}
                    {data[2] && <PodiumCard post={data[2]} rank={3} />}
                  </div>
                )}
  
                {/* Ranked List */}
                <div className="space-y-1">
                  {(isPodiumView && data.length >= 3 ? data.slice(3) : data).map((post, i) => {
                    if (!post?.users?.username) return null;
                    const rank = isPodiumView && data.length >= 3 ? i + 4 : i + 1;
                    return (
                      <Link key={post.id} href={`/post/${post.id}`} className="bg-white dark:bg-zinc-900 mx-1 md:mx-0 mb-2 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors hover:shadow-md">
                        <span className={`font-black text-sm w-6 text-center ${rank <= 3 ? 'text-[#FF385C]' : 'text-gray-300 dark:text-zinc-600'}`}>{rank}</span>
                        <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-800">
                          {post.media_type === 'video' ? (
                            <video src={post.image_url} className="w-full h-full object-cover" muted />
                          ) : (
                            <Image src={post.image_url} alt="" fill className="object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">@{post.users.username}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{post.category}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[#FF385C] font-black text-lg leading-none">{post.average_rating.toFixed(1)}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">★ {post.rating_count} ratings</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Top Creators View */
              <div className="space-y-1 mt-4">
                {data.map((creator, i) => {
                  if (!creator?.user?.username) return null; // Safe guard for invalid data
                  const rank = i + 1;
                  
                  return (
                    <Link key={creator.user.id} href={`/${creator.user.username}`} className="bg-white dark:bg-zinc-900 mx-1 md:mx-0 mb-2 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors hover:shadow-md">
                      <span className={`font-black text-sm w-6 text-center ${rank <= 3 ? 'text-[#FF385C]' : 'text-gray-300 dark:text-zinc-600'}`}>{rank}</span>
                      <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                        {creator.user.avatar_url ? (
                          <Image src={creator.user.avatar_url} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                            {creator.user.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1">
                          @{creator.user.username}
                          {creator.user.is_pioneer && (
                            <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">★ Pioneer</span>
                          )}
                          {['vance', 'kiki', 'oracle'].includes(creator.user.username.toLowerCase()) && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-black">AI</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {creator.postCount} posts · {creator.ratingCount} ratings
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[#FF385C] font-black text-lg leading-none">{creator.averageRating.toFixed(1)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ post, rank, isWinner }: { post: any, rank: number, isWinner?: boolean }) {
  if (!post?.users?.username) return null;

  return (
    <Link href={`/post/${post.id}`} className={`relative flex-1 max-w-[140px] rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.02] ${isWinner ? 'h-56 z-10 -mt-4 ring-2 ring-[#FF385C] ring-offset-2 dark:ring-offset-black' : 'h-48 opacity-95'}`}>
      {post.media_type === 'video' ? (
        <video src={post.image_url} className="w-full h-full object-cover" muted />
      ) : (
        <Image src={post.image_url} alt="" fill className="object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      <div className={`absolute top-2 left-2 flex items-center justify-center font-black rounded-full ${isWinner ? 'w-8 h-8 bg-[#FF385C] text-white text-sm' : 'w-6 h-6 bg-black/60 backdrop-blur-md text-white text-xs'}`}>
        #{rank}
      </div>
      
      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-1">
        <p className="text-white text-[10px] font-bold truncate opacity-90">@{post.users.username}</p>
        <p className="text-[#FF385C] text-sm font-black leading-none drop-shadow-md shrink-0">{post.average_rating.toFixed(1)}</p>
      </div>
    </Link>
  );
}
