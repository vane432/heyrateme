export default function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Post Your Content',
      description: 'Upload photos of your outfits, recipes, DIY projects, tips, or creative work.',
      icon: '📤',
    },
    {
      number: '2',
      title: 'Get Rated',
      description: 'Other users rate your post from 1 to 5 stars.',
      icon: '⭐',
    },
    {
      number: '3',
      title: 'Climb The Rankings',
      description: 'Top rated posts appear in daily leaderboards.',
      icon: '🏆',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600">
            Three simple steps to start sharing and rating
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-6xl mb-4">{step.icon}</div>
              <div className="text-sm font-bold text-yellow-500 mb-2">
                STEP {step.number}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
