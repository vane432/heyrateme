export default function Features() {
  const features = [
    {
      icon: '👗',
      title: 'Fashion-First Ratings',
      description: 'Get detailed feedback across 4 dimensions: Style, Fit, Color Harmony, and Occasion Match.',
    },
    {
      icon: '⭐',
      title: 'Multi-Dimensional Feedback',
      description: 'Know exactly what works and what doesn\'t with detailed breakdowns.',
    },
    {
      icon: '🏆',
      title: 'Merit-Based Discovery',
      description: 'Your best work can beat anyone\'s best work, regardless of followers.',
    },
    {
      icon: '📈',
      title: 'Track Your Progress',
      description: 'See your dimensional averages and discover your fashion strengths.',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Fashion Feedback, Redefined
          </h2>
          <p className="text-xl text-gray-600">
            Get the detailed fashion feedback you actually need
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
