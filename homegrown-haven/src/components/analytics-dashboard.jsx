import { BarChart3, Star, Users, MapPin, Tag, Store } from 'lucide-react'

function getTopCategory(businesses) {
  const counts = {}
  businesses.forEach(b => {
    counts[b.category] = (counts[b.category] || 0) + 1
  })
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <div className="text-white">{icon}</div>
        </div>
        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  )
}

function RatingBar({ rating, count, maxCount, total }) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="w-12 flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-green-700 text-green-700" />
        <span className="font-medium text-gray-900">{rating}</span>
      </div>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="w-20 text-right text-sm">
        <span className="font-medium text-gray-900">{count}</span>
        <span className="text-gray-500 ml-1">({percentage}%)</span>
      </div>
    </div>
  )
}

function RatingDistributionCard({ distribution, total }) {
  const maxCount = Math.max(...Object.values(distribution))

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-black">Rating Distribution</h3>
      </div>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => (
          <RatingBar
            key={rating}
            rating={rating}
            count={distribution[rating]}
            maxCount={maxCount}
            total={total}
          />
        ))}
      </div>
    </div>
  )
}

function DistanceCard({ distanceStats, total }) {
  if (total === 0) return null

  const segments = [
    { key: 'near', label: 'Nearby (0-1 mi)' },
    { key: 'medium', label: 'Moderate (1-3 mi)' },
    { key: 'far', label: 'Farther (3+ mi)' }
  ]

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-black">Distance from You</h3>
      </div>
      <div className="space-y-4">
        {segments.map(({ key, label }) => {
          const count = distanceStats[key]
          const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DealsCard({ dealsStats }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <Tag className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-black">Active Deals</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{dealsStats.totalDeals}</div>
          <div className="text-sm text-gray-600 mt-1">Total Deals</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{dealsStats.businessesWithDeals}</div>
          <div className="text-sm text-gray-600 mt-1">Businesses</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{dealsStats.percentageWithDeals}%</div>
          <div className="text-sm text-gray-600 mt-1">Coverage</div>
        </div>
      </div>
    </div>
  )
}

function CategoryBreakdown({ categoryStats, totalBusinesses }) {
  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count)

  const maxCount = Math.max(...sortedCategories.map(([, data]) => data.count))

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <Store className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-black">Categories</h3>
      </div>
      <div className="space-y-4">
        {sortedCategories.map(([category, data]) => {
          const width = (data.count / maxCount) * 100
          return (
            <div key={category}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900 capitalize">{category}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Star className="w-3.5 h-3.5 fill-green-700 text-green-700" />
                    {data.avgRating}
                  </span>
                  <span className="font-semibold text-gray-900">{data.count}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopBusinessesCard({ businesses }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
          <Star className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-black">Top Rated</h3>
      </div>
      <div className="space-y-3">
        {businesses.map((business, index) => (
          <div
            key={business.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center text-white font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{business.name}</div>
              <div className="text-sm text-gray-500 capitalize">{business.category}</div>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="w-4 h-4 fill-green-700 text-green-700" />
              <span className="font-semibold text-gray-900">
                {business.rating ? Number(business.rating).toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard({ businesses, deals = [], userLocation = null }) {
  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    totalBusinesses: businesses.length,
    averageRating: businesses.length > 0
      ? (businesses.reduce((sum, b) => sum + (Number(b.rating) || 0), 0) / businesses.length).toFixed(1)
      : '0.0',
    totalReviews: businesses.reduce((sum, b) => sum + (b.review_count || 0), 0),
    topCategory: getTopCategory(businesses)
  }

  // Rating distribution
  const ratingDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  businesses.forEach(b => {
    const rating = Math.floor(Number(b.rating) || 0)
    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating]++
    }
  })

  // Distance analysis
  const distanceStats = { near: 0, medium: 0, far: 0 }
  if (userLocation) {
    businesses.forEach(b => {
      const dist = b.distance || 999
      if (dist <= 1) distanceStats.near++
      else if (dist <= 3) distanceStats.medium++
      else distanceStats.far++
    })
  }

  // Deals statistics
  const dealsStats = {
    totalDeals: deals.length,
    businessesWithDeals: new Set(deals.map(d => d.business_id)).size,
    percentageWithDeals: businesses.length > 0
      ? ((new Set(deals.map(d => d.business_id)).size / businesses.length) * 100).toFixed(0)
      : 0
  }

  // Category breakdown
  const categoryStats = {}
  businesses.forEach(b => {
    if (!categoryStats[b.category]) {
      categoryStats[b.category] = { count: 0, avgRating: 0, totalRating: 0 }
    }
    categoryStats[b.category].count++
    categoryStats[b.category].totalRating += (Number(b.rating) || 0)
  })

  Object.keys(categoryStats).forEach(cat => {
    categoryStats[cat].avgRating = (categoryStats[cat].totalRating / categoryStats[cat].count).toFixed(1)
  })

  // Top businesses
  const topBusinesses = [...businesses]
    .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Store className="w-5 h-5" />}
          label="Businesses"
          value={stats.totalBusinesses}
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Avg Rating"
          value={stats.averageRating}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Reviews"
          value={stats.totalReviews}
        />
        <StatCard
          icon={<Tag className="w-5 h-5" />}
          label="Top Category"
          value={stats.topCategory}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RatingDistributionCard
          distribution={ratingDistribution}
          total={stats.totalBusinesses}
        />

        {userLocation && Object.values(distanceStats).some(v => v > 0) ? (
          <DistanceCard
            distanceStats={distanceStats}
            total={stats.totalBusinesses}
          />
        ) : deals.length > 0 ? (
          <DealsCard dealsStats={dealsStats} />
        ) : null}
      </div>

      {/* Deals card if both distance and deals exist */}
      {userLocation && Object.values(distanceStats).some(v => v > 0) && deals.length > 0 && (
        <DealsCard dealsStats={dealsStats} />
      )}

      {/* Category & Top Businesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown
          categoryStats={categoryStats}
          totalBusinesses={stats.totalBusinesses}
        />
        <TopBusinessesCard businesses={topBusinesses} />
      </div>
    </div>
  )
}
