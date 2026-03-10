export default function TopPostsPreview() {
  const topPosts = [
    { rank: 1, rating: 4.9, username: '@stylequeen', category: 'Fashion' },
    { rank: 2, rating: 4.8, username: '@chefjake', category: 'Food' },
    { rank: 3, rating: 4.7, username: '@fitfam', category: 'Fitness' },
    { rank: 4, rating: 4.6, username: '@craftmaster', category: 'DIY' },
    { rank: 5, rating: 4.6, username: '@photozen', category: 'Photography' },
  ];

  return (
    <section id="top-posts" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Top Rated Posts of the Day
          </h2>
          <p className="text-xl text-gray-600">
            The best content rises to the top every day
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {topPosts.map((post) => (
            <div
              key={post.rank}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-6"
            >
              {/* Rank Badge */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                post.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                post.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                post.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-400' :
                'bg-gradient-to-br from-blue-400 to-purple-500'
              }`}>
                #{post.rank}
              </div>

              {/* Mock Image */}
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-3xl">
                📸
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">{post.username}</p>
                <p className="text-gray-500 text-sm">{post.category}</p>
              </div>

              {/* Rating */}
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-yellow-400 text-2xl">★</span>
                  <span className="text-2xl font-bold text-gray-900">{post.rating}</span>
                </div>
                <p className="text-xs text-gray-500">Top {post.rank}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 text-lg">
            Rankings update daily based on ratings and engagement
          </p>
        </div>
      </div>
    </section>
  );
}
