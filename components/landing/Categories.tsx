export default function Categories() {
  const fashionCategories = [
    { name: 'Date Night', icon: '💕', color: 'from-pink-400 to-rose-500' },
    { name: 'Formal / Event', icon: '🎩', color: 'from-purple-400 to-indigo-500' },
    { name: 'Work / Office', icon: '💼', color: 'from-blue-400 to-cyan-500' },
    { name: 'Streetwear', icon: '🧢', color: 'from-gray-400 to-slate-500' },
    { name: 'Thrifted / Vintage', icon: '🕰️', color: 'from-amber-400 to-orange-500' },
    { name: 'Night Out / Party', icon: '🌙', color: 'from-violet-400 to-purple-500' },
    { name: 'Casual / Everyday', icon: '👕', color: 'from-green-400 to-teal-500' },
    { name: 'Athleisure / Gym', icon: '💪', color: 'from-red-400 to-pink-500' },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Fashion Categories for Every Style
          </h2>
          <p className="text-xl text-gray-600">
            Get detailed ratings on your outfits for any occasion - from casual dates to formal events
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
          {fashionCategories.map((category, index) => (
            <div
              key={category.name}
              className="group cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:scale-105 flex flex-col items-center justify-center aspect-square relative`}>
                <div className="text-4xl mb-3 group-hover:scale-125 transition-transform">
                  {category.icon}
                </div>
                <p className="text-white font-bold text-center text-sm">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Multi-dimensional rating highlight */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Multi-Dimensional Feedback</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Style', icon: '✨', description: 'Overall aesthetic appeal' },
                { label: 'Fit', icon: '👔', description: 'How well clothes fit your body' },
                { label: 'Color Harmony', icon: '🎨', description: 'Color coordination & matching' },
                { label: 'Occasion Match', icon: '📅', description: 'Appropriateness for the event' },
              ].map(dimension => (
                <div key={dimension.label} className="text-center">
                  <div className="text-3xl mb-2">{dimension.icon}</div>
                  <h4 className="font-bold text-gray-900">{dimension.label}</h4>
                  <p className="text-xs text-gray-600 mt-1">{dimension.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
