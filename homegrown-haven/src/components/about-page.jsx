import { useState } from 'react'
import { Leaf, ArrowRight } from 'lucide-react'

const tabs = [
  { id: 'about', label: 'About' },
  { id: 'guide', label: 'Guide' }
]

const features = [
  {
    image: '/screenshot-search.png',
    title: 'Search',
    description: 'Find businesses by name or keyword. Our search instantly filters results as you type, making it easy to discover exactly what you\'re looking for.'
  },
  {
    image: '/screenshot-filters.png',
    title: 'Filters',
    description: 'Narrow down your search with powerful filters. Sort by category, rating, distance from your location, or view only your saved favorites.'
  },
  {
    image: '/screenshot-details.png',
    title: 'Business Details',
    description: 'Get comprehensive information about each business including hours of operation, location on an interactive map, and direct contact options.'
  },
  {
    image: '/screenshot-deals.png',
    title: 'Deals & Coupons',
    description: 'Never miss a great offer. Browse exclusive deals and promotions, then copy promo codes directly to use at checkout.'
  },
  {
    image: '/screenshot-analytics.png',
    title: 'Analytics',
    description: 'Explore insights about local business trends, popular categories, and community engagement in your area.'
  },
  {
    image: '/screenshot-reviews.png',
    title: 'Reviews',
    description: 'Read authentic reviews from your neighbors and share your own experiences to help others make informed decisions.'
  },
  {
    image: '/voice-assistant.gif',
    title: 'AI Voice Assistant',
    description: 'Talk to our AI assistant to search for businesses, apply filters, and navigate the app hands-free. Just click the green button and start speaking.'
  }
]

function FeatureSection({ image, title, description, index }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full object-cover"
        style={{ maxHeight: '400px' }}
      />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            {index + 1}
          </span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('about')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Logo and title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-green-700 rounded-full mb-4">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text mb-2">
          Homegrown Haven
        </h1>
        <p className="text-gray-600">
          Discover Local, Support Local
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex justify-center gap-2 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                : 'bg-white text-gray-600 hover:text-green-700 border border-gray-200 hover:border-green-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {/* About Tab */}
        {activeTab === 'about' && (
          <>
            {/* Mission statement - hero style */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-green-50 leading-relaxed text-lg">
                Homegrown Haven connects you with local businesses that make your neighborhood unique.
                Whether you're looking for a coffee shop, a trusted mechanic, or a hidden gem restaurant,
                we help you discover and support the businesses that matter most.
              </p>
            </div>

            {/* Values - unified design */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">What We Stand For</h2>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="p-6 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Local First</h3>
                    <p className="text-gray-600">
                      Every business featured is locally owned and operated. When you shop local, you're keeping dollars in your community and supporting your neighbors.
                    </p>
                  </div>
                </div>
                <div className="p-6 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Community Driven</h3>
                    <p className="text-gray-600">
                      Real reviews from real neighbors help you make informed decisions. Share your experiences and discover trusted recommendations from people who live nearby.
                    </p>
                  </div>
                </div>
                <div className="p-6 flex gap-4 items-start hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Smart Discovery</h3>
                    <p className="text-gray-600">
                      AI-powered search and voice assistant help you find exactly what you need. Just ask, and we'll guide you to the perfect local business.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ready to explore?</h3>
                  <p className="text-gray-600 text-sm">Check out the Guide to learn how to use all the features.</p>
                </div>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-colors"
                >
                  View Guide
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Guide Tab */}
        {activeTab === 'guide' && (
          <>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-2">How It Works</h2>
              <p className="text-green-50">
                Explore the features below to get the most out of Homegrown Haven.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, idx) => (
                <FeatureSection key={idx} index={idx} {...feature} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          Homegrown Haven — Supporting local communities
        </p>
      </div>
    </div>
  )
}
