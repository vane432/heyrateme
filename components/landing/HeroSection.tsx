import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Get{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                Multi-Dimensional
              </span>{' '}
              Fashion Feedback
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Share your outfit and get rated on Style, Fit, Color Harmony, and Occasion Match.
              Real feedback from real people.
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
                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
                      <span>📅</span> Date Night
                    </span>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">📸</div>
                    <p className="text-gray-600 font-medium">Your Photo Here</p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">4.8★ Overall</span>
                    <span className="text-xs text-purple-600 font-medium">47 ratings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">✨ Style</span>
                      <span className="font-bold">5.0★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">👔 Fit</span>
                      <span className="font-bold">4.5★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">🎨 Color</span>
                      <span className="font-bold">4.8★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">📅 Occasion</span>
                      <span className="font-bold">4.9★</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
