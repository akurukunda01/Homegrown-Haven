// Central field map: drives the column toggles in ReportConfig AND the
// CSV/JSON/print projection in page.jsx, so all three output formats stay
// consistent. Kept in a plain module (no component export) so React Fast
// Refresh stays happy.
export const FIELD_DEFS = [
  { key: 'name', label: 'Name', group: 'Basic', accessor: (b) => b.name ?? '' },
  { key: 'category', label: 'Category', group: 'Basic', accessor: (b) => b.category ?? '' },
  { key: 'description', label: 'Description', group: 'Basic', accessor: (b) => b.description ?? '' },
  { key: 'rating', label: 'Rating', group: 'Metrics', accessor: (b) => b.rating ?? 'N/A' },
  { key: 'review_count', label: 'Reviews', group: 'Metrics', accessor: (b) => b.review_count ?? 0 },
  { key: 'id', label: 'ID', group: 'Metrics', accessor: (b) => b.id ?? '' },
  { key: 'phone', label: 'Phone', group: 'Contact', accessor: (b) => b.phone ?? 'N/A' },
  { key: 'email', label: 'Email', group: 'Contact', accessor: (b) => b.email ?? 'N/A' },
  { key: 'website', label: 'Website', group: 'Contact', accessor: (b) => b.website ?? 'N/A' },
  { key: 'address', label: 'Address', group: 'Location', accessor: (b) => b.address ?? 'N/A' },
  { key: 'distance', label: 'Distance', group: 'Location', accessor: (b) => b.distance ?? 'N/A' },
  { key: 'latitude', label: 'Latitude', group: 'Location', accessor: (b) => b.latitude ?? '' },
  { key: 'longitude', label: 'Longitude', group: 'Location', accessor: (b) => b.longitude ?? '' },
];

export const GROUP_ORDER = ['Basic', 'Metrics', 'Contact', 'Location'];

// The 7 columns the report shipped with before it became customizable.
export const DEFAULT_REPORT_CONFIG = {
  columns: {
    name: true,
    category: true,
    rating: true,
    review_count: true,
    distance: true,
    address: true,
    phone: true,
  },
  scope: 'current',
  sortBy: 'rating',
  sortOrder: 'desc',
  format: 'csv',
};

export const SCOPES = [
  { key: 'current', label: 'Current list' },
  { key: 'all', label: 'All businesses' },
  { key: 'favorites', label: 'Favorites only' },
  { key: 'deals', label: 'Has deals only' },
];

export const SORT_FIELDS = [
  { key: 'rating', label: 'Rating' },
  { key: 'name', label: 'Name' },
  { key: 'distance', label: 'Distance' },
  { key: 'review_count', label: 'Reviews' },
];

export const FORMATS = [
  { key: 'csv', label: 'CSV' },
  { key: 'json', label: 'JSON' },
  { key: 'print', label: 'Printable' },
];
