import { useState, useEffect } from 'react';
import { Filter, Star, Heart, X, Tag } from 'lucide-react';

export default function BusinessFilter({ onFilterChange, isOpen, onClose, filters }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:8000/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: 'all',
      minRating: 0,
      maxDistance: 'all',
      favoritesOnly: false,
      hasDeals: false
    };
    onFilterChange(defaultFilters);
  };

  const activeFilterCount = [
    filters.category !== 'all',
    filters.minRating > 0,
    filters.maxDistance !== 'all',
    filters.favoritesOnly,
    filters.hasDeals
  ].filter(Boolean).length;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 border-l border-gray-200 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-700" />
              <h2 className="text-xl font-bold text-gray-800">Filter Businesses</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white shadow-sm"
              >
                <option value="0">All Ratings</option>
                <option value="1">1+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Distance
              </label>
              <select
                value={filters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                className="w-full px-4 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-transparent bg-white shadow-sm"
              >
                <option value="all">Any Distance</option>
                <option value="1">Within 1 mile</option>
                <option value="2">Within 2 miles</option>
                <option value="5">Within 5 miles</option>
                <option value="10">Within 10 miles</option>
                <option value="20">Within 20 miles</option>
              </select>
            </div>

            {/* Favorites Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Favorites
              </label>
              <button
                onClick={() => handleFilterChange('favoritesOnly', !filters.favoritesOnly)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${
                  filters.favoritesOnly
                    ? 'bg-gradient-to-r from-green-600 to-green-700 shadow-2xl hover:shadow-green-500/50 hover:scale-110 '
                    : 'bg-white border-2 border-gray-300 text-gray-700 shadow-2xl hover:shadow-green-500/50 hover:scale-110 '
                }`}
              >
                <Heart className={`w-5 h-5 ${filters.favoritesOnly ? 'fill-white' : ''}`} />
                {filters.favoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
              </button>
            </div>

            {/* Has Deals Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deals & Coupons
              </label>
              <button
                onClick={() => handleFilterChange('hasDeals', !filters.hasDeals)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all shadow-sm ${
                  filters.hasDeals
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-2xl hover:shadow-orange-500/50 hover:scale-105'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:shadow-orange-500/50 hover:scale-105'
                }`}
              >
                <Tag className={`w-5 h-5 ${filters.hasDeals ? 'text-white' : ''}`} />
                {filters.hasDeals ? 'Showing Deals Only' : 'Show Businesses with Deals'}
              </button>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Active Filters</span>
                  <span className="text-xs text-gray-500">{activeFilterCount} active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.category !== 'all' && (
                    <span className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      {filters.category}
                    </span>
                  )}
                  {filters.minRating > 0 && (
                    <span className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {filters.minRating}+
                    </span>
                  )}
                  {filters.maxDistance !== 'all' && (
                    <span className="bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                      ≤ {filters.maxDistance} mi
                    </span>
                  )}
                  {filters.favoritesOnly && (
                    <span className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      Favorites
                    </span>
                  )}
                  {filters.hasDeals && (
                    <span className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Deals
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium  hover:shadow-green-500/50 hover:scale-110  hover:bg-gray-100 transition-colors"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 shadow-2xl hover:shadow-green-500/50 hover:scale-110  text-white rounded-lg font-medium hover:bg-green-800 transition-colors shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
