import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Ready to See How The World Rates You?
        </h2>
        <p className="text-xl text-gray-300 mb-12">
          Join thousands of creators sharing their best work
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="bg-white text-gray-900 px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-100 transition transform hover:scale-105"
          >
            Create Your Profile
          </Link>
          <Link
            href="/login"
            className="border-2 border-white text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-white hover:text-gray-900 transition"
          >
            Start Rating Posts
          </Link>
        </div>
      </div>
    </section>
  );
}
