export default function Categories() {
  const categories = [
    { name: 'Fashion', icon: '👗', color: 'from-pink-400 to-purple-500' },
    { name: 'Food', icon: '🍔', color: 'from-orange-400 to-red-500' },
    { name: 'Fitness', icon: '💪', color: 'from-green-400 to-teal-500' },
    { name: 'DIY', icon: '🔨', color: 'from-yellow-400 to-orange-500' },
    { name: 'Life Tips', icon: '💡', color: 'from-blue-400 to-cyan-500' },
    { name: 'Photography', icon: '📷', color: 'from-purple-400 to-pink-500' },
    { name: 'Art', icon: '🎨', color: 'from-red-400 to-pink-500' },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Categories
          </h2>
          <p className="text-xl text-gray-600">
            Find content that matches your interests
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="group cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all hover:scale-110 flex flex-col items-center justify-center aspect-square`}>
                <div className="text-5xl mb-3 group-hover:scale-125 transition-transform">
                  {category.icon}
                </div>
                <p className="text-white font-bold text-center">
                  {category.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
