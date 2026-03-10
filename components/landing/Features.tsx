export default function Features() {
  const features = [
    {
      icon: '⭐',
      title: 'Star Ratings',
      description: 'Posts are rated instead of liked.',
    },
    {
      icon: '🔥',
      title: 'Top Posts',
      description: 'The highest rated posts become featured daily.',
    },
    {
      icon: '🎨',
      title: 'Categories',
      description: 'Discover content across fashion, food, fitness, DIY and more.',
    },
    {
      icon: '👤',
      title: 'Profiles',
      description: 'Track your average rating and top performing posts.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Features That Stand Out
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to share and discover great content
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
