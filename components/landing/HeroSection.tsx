import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Where Posts Are{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                Rated
              </span>
              , Not Liked
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Share your best moments and see how the world rates them.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition transform hover:scale-105"
              >
                Get Started
              </Link>
              <a
                href="#top-posts"
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition"
              >
                Explore Top Posts
              </a>
            </div>
          </div>

          {/* Right - Mock Post Card */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                  <div>
                    <p className="font-semibold text-gray-900">@alexchen</p>
                    <p className="text-sm text-gray-500">Fashion</p>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📸</div>
                    <p className="text-gray-600 font-medium">Your Photo Here</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400 text-2xl">
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-gray-900">4.8</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">247 ratings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
