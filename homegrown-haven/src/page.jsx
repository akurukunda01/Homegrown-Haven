import { useState, useEffect } from "react"
import BusinessCard from "./components/business-card"
import BusinessDetail from "./components/business-detail"
import { Leaf, Bot, Phone, PhoneOff, Filter, X, Download, User, Mic, MicOff } from "lucide-react"
import SearchBar from "./components/search-bar"
import BusinessFilter from "./components/business-filter"
import AnalyticsDashboard from "./components/analytics-dashboard"
import AboutPage from "./components/about-page"
import ReportConfig from "./components/report-config"
import { FIELD_DEFS, DEFAULT_REPORT_CONFIG } from "./components/report-fields"
import { buildQueryString } from "./utils/validators"
import { useAuth0 } from "@auth0/auth0-react"
import {
  RoomAudioRenderer,
  RoomContext,
  useTranscriptions,
  useLocalParticipant
} from '@livekit/components-react';
import { Room } from 'livekit-client';


function LogoutButton() {
  const { logout } = useAuth0();

  return (
    <button
      onClick={() => logout({
        logoutParams: { returnTo: window.location.origin }
      })}
    >
      Logout
    </button>
  );
}

function Header({ view, onHomeClick, onAboutClick }) {
  return (
    <header className=" top-0 z-40 w-full border-b border-gray-600 border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary bg-gradient-to-r from-green-600 to-green-700 rounded-lg flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white text-primary-foreground" />
          </div>
          <div className="flex flex-col justify-content-start">
            <h1 className="text-lg sm:text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text  text-primary flex justify-start ">Homegrown Haven</h1>
            <p className="text-md sm:text-sm text-muted-foreground text-gray-600">Supporting Local Businesses</p>
          </div>
        </div>
        <nav className="flex gap-6 text-gray-600 hover:text-green-700">
          <LogoutButton />
          <button
            onClick={onHomeClick}
            aria-label="Home"
            className={`text-sm font-medium transition-colors ${
              view === 'businesses' || view === 'analytics'
                ? 'text-green-700 font-semibold'
                : 'text-gray-600 hover:text-green-700'
            }`}
          >
            Home
          </button>
          <button
            onClick={onAboutClick}
            aria-label="About Homegrown Haven"
            className={`text-sm font-medium transition-colors ${
              view === 'about'
                ? 'text-green-700 font-semibold'
                : 'text-gray-600 hover:text-green-700'
            }`}
          >
            About
          </button>
          <button aria-label="Community" className="text-sm font-medium text-foreground hover:text-green-700 bg-clear text-gray-600  transition-colors">
            Community
          </button>
        </nav>
      </div>
    </header>
  )
}

function MicrophoneToggle() {
  const { localParticipant } = useLocalParticipant();
  const isMuted = !localParticipant?.isMicrophoneEnabled;

  const toggleMic = () => {
    localParticipant?.setMicrophoneEnabled(isMuted);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={toggleMic}
        className={`p-2 rounded-full transition-colors ${
          isMuted
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
        }`}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      <span className="text-xs text-gray-500">
        {isMuted ? 'Muted' : 'Listening...'}
      </span>
    </div>
  );
}

function LiveKitAudioRoom({ room }) {
  if (!room) return null

  return (
    <RoomContext.Provider value={room}>
      <TranscriptionPanel />
    </RoomContext.Provider>
  )
}

function TranscriptionPanel() {
  const transcriptions = useTranscriptions();

  return (
    <div className="fixed bottom-24 left-6 bg-white rounded-2xl shadow-xl z-50 border border-gray-200 w-96 max-h-[450px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-gray-900 font-semibold text-sm">AI Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-500">Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[180px] max-h-[280px] bg-gradient-to-b from-gray-50/50 to-white">
        {transcriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Mic className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-400 text-sm">Start speaking...</p>
            <p className="text-gray-300 text-xs mt-1">I'm listening</p>
          </div>
        ) : (
          transcriptions.map((entry, index) => {
            const isUser = entry.participantInfo?.identity === 'web-user';
            return (
              <div
                key={index}
                className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  isUser
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : 'bg-gradient-to-br from-gray-600 to-gray-700'
                }`}>
                  {isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <span className={`text-[10px] font-medium mb-1 px-1 ${
                    isUser ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {isUser ? 'You' : 'Assistant'}
                  </span>
                  <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl rounded-tr-md shadow-sm'
                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-md shadow-sm border border-gray-100'
                  }`}>
                    {entry.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/80">
        <RoomAudioRenderer />
        <MicrophoneToggle />
      </div>
    </div>
  )
}


export default function Home({ currentUser }) {
   const [userLocation] = useState({
    lat: 40.2859,
    lng: -76.6502
  });
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [businesses, setBusinesses] = useState([])
  const [allBusinesses, setAllBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    category: 'all',
    minRating: 0,
    maxDistance: 'all',
    favoritesOnly: false,
    hasDeals: false
  })
  const [favorites, setFavorites] = useState([])
  const [allDeals, setAllDeals] = useState([])
  const [filterOpen, setFilterOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportConfig, setReportConfig] = useState(DEFAULT_REPORT_CONFIG);
  const [liveKitRoom, setLiveKitRoom] = useState(null);
  const [isInRoom, setIsInRoom] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState(null);
  const [view, setView] = useState('businesses'); // 'businesses' | 'analytics' | 'about'

  // WebSocket connection for agent navigation
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws');

    ws.onopen = () => {
      console.log('🔌 WebSocket connected to backend');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Agent command received:', data);

      // Handle navigation commands from agent
      switch(data.action) {
        case 'select_business':
          const business = businesses.find(b => b.id === data.business_id);
          if (business) {
            console.log('🎯 Navigating to business:', business.name);
            setSelectedBusiness(business);
          } else {
            console.warn('Business not found with ID:', data.business_id);
          }
          break;

        case 'go_back':
          console.log('⬅️ Going back to list');
          setSelectedBusiness(null);
          break;

        case 'search':
          console.log('🔍 Updating search:', data.query);
          setSearchQuery(data.query);
          break;

        case 'apply_filters':
          console.log('🔧 Applying filters:', data.filters);
          setFilters(prevFilters => ({
            ...prevFilters,
            ...data.filters
          }));
          fetchBusinesses({
            ...filters,
            ...data.filters
          });
          break;

        case 'update_favorite':
          console.log('❤️ Updating favorite status:', data);
          const isFav = data.is_favorited;
          const businessId = data.business_id;
          // Refresh favorites list to reflect change
          if (currentUser?.id) {
            fetchFavorites();
          }
          break;

        case 'refresh_reviews':
          console.log('🔄 Refreshing reviews for business:', data.business_id);
          // Trigger review refresh in business detail component
          // This will be handled by business-detail.jsx via custom event or state
          window.dispatchEvent(new CustomEvent('refresh-reviews', {
            detail: { business_id: data.business_id }
          }));
          break;

        case 'copy_deal_code':
          console.log('📋 Copying deal code:', data.code);
          // Copy to clipboard
          if (navigator.clipboard && data.code) {
            navigator.clipboard.writeText(data.code)
              .then(() => {
                console.log('✅ Code copied to clipboard');
                // Optional: Show toast notification
                alert(`Copied code: ${data.code}`);
              })
              .catch(err => {
                console.error('Failed to copy code:', err);
              });
          }
          break;

        case 'sort_filter_reviews':
          console.log('🔧 Sorting/filtering reviews:', data);
          // Dispatch custom event for business-detail.jsx to handle
          window.dispatchEvent(new CustomEvent('sort-filter-reviews', {
            detail: {
              business_id: data.business_id,
              sort_by: data.sort_by,
              filter_rating: data.filter_rating
            }
          }));
          break;

        case 'reset_filters':
          console.log('🔄 Resetting all filters');
          const defaultFilters = {
            category: 'all',
            minRating: 0,
            maxDistance: 'all',
            favoritesOnly: false,
            hasDeals: false
          };
          setFilters(defaultFilters);
          fetchBusinesses(defaultFilters);
          break;

        case 'toggle_filter_panel':
          console.log('📋 Toggle filter panel:', data.open);
          setFilterOpen(data.open);
          break;

        case 'switch_view':
          console.log('👁️ Switching view to:', data.view);
          setView(data.view);
          break;

        case 'sort_businesses':
          console.log('📊 Sorting businesses by:', data.sort_by, data.order);
          setBusinesses(prevBusinesses => {
            const sorted = [...prevBusinesses];
            const order = data.order === 'asc' ? 1 : -1;

            switch (data.sort_by) {
              case 'rating':
                sorted.sort((a, b) => order * ((b.rating || 0) - (a.rating || 0)));
                break;
              case 'distance':
                sorted.sort((a, b) => order * ((a.distance_value || 999) - (b.distance_value || 999)));
                break;
              case 'name':
                sorted.sort((a, b) => order * a.name.localeCompare(b.name));
                break;
              case 'reviews':
                sorted.sort((a, b) => order * ((b.review_count || 0) - (a.review_count || 0)));
                break;
              default:
                break;
            }
            return sorted;
          });
          break;

        default:
          console.log('Unknown action:', data.action);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [businesses]);

  // LiveKit URL from environment variable with fallback
  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://homegrownhaven-5ibzm37i.livekit.cloud';

  const joinLiveKitRoom = async () => {
    // Prevent concurrent connection attempts
    if (isConnecting || isInRoom) {
      console.log('⚠️ Already connecting or in room');
      return;
    }

    setIsConnecting(true);

    try {
      console.log('🔌 Fetching LiveKit token...');

      const response = await fetch('http://localhost:8000/livekit/token');
      if (!response.ok) {
        throw new Error('Failed to fetch LiveKit token');
      }
      const token = await response.text();

      console.log('🔌 Attempting to join LiveKit room...');

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on('connected', () => {
        console.log('✅ Connected to room');
      });

      room.on('disconnected', () => {
        console.log('🔌 Room disconnected event');
        setLiveKitRoom(null);
        setIsInRoom(false);
        setIsConnecting(false);
      });

      room.on('localTrackPublished', (publication) => {
        console.log('📤 Local track published:', publication.kind);
      });

      room.on('trackSubscribed', (track, publication, participant) => {
        console.log('🎵 Track subscribed:', track.kind, 'from', participant.identity);
      });

      await room.connect(LIVEKIT_URL, token);
      console.log('🎤 Room connected');

      await room.localParticipant.setMicrophoneEnabled(true);
      console.log('🎤 Microphone enabled and publishing');

      setLiveKitRoom(room);
      setIsInRoom(true);

    } catch (err) {
      console.error('❌ Failed to join LiveKit room:', err);
      alert('Failed to connect: ' + err.message);
      // Reset state on error
      setLiveKitRoom(null);
      setIsInRoom(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const leaveLiveKitRoom = async () => {
    if (liveKitRoom) {
      try {
        // Remove all event listeners to prevent memory leaks
        liveKitRoom.removeAllListeners();

        // Disconnect and wait for it to complete
        await liveKitRoom.disconnect();
        console.log('🔌 Disconnected from room');
      } catch (err) {
        console.error('Error disconnecting:', err);
      } finally {
        setLiveKitRoom(null);
        setIsInRoom(false);
      }
    }
  };

  useEffect(() => {
    fetchBusinesses(filters)
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      fetchFavorites();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllDeals();
  }, []);

  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  const fetchAllBusinesses = async () => {
    try {
      const response = await fetch(`http://localhost:8000/get_local?lat=${userLocation.lat}&lng=${userLocation.lng}`);
      const data = await response.json();
      console.log('📊 Fetched all businesses for analytics:', data.length, 'businesses');
      setAllBusinesses(data);
    } catch (error) {
      console.error('Error fetching all businesses:', error);
    }
  };

  const fetchBusinesses = async (filters) => {
  setLoading(true)
  try {
    if (filters.favoritesOnly && currentUser?.id) {
      const response = await fetch(`http://localhost:8000/favorites/${currentUser.id}`, {
        headers: { 'X-Auth0-User-ID': currentUser.auth0_id }
      });
      let data = await response.json();

      if (filters.hasDeals) {
        data = data.filter(b => allDeals.some(d => d.business_id === b.id));
      }
      setBusinesses(data);
    } else {
      const query = buildQueryString({
        lat: userLocation.lat,
        lng: userLocation.lng,
        category: filters.category !== 'all' ? filters.category : null,
        min_rating: filters.minRating > 0 ? filters.minRating : null,
        max_distance: filters.maxDistance !== 'all' ? filters.maxDistance : null,
      })
      const response = await fetch(`http://localhost:8000/get_local?${query}`)
      let data = await response.json()
      if (filters.hasDeals) data = data.filter(b => allDeals.some(d => d.business_id === b.id))
      setBusinesses(data)
    }
  } catch (error) {
    console.error('Error applying filters:', error)
    setError('Failed to load businesses. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`http://localhost:8000/favorites/${currentUser.id}`, {
        headers: { 'X-Auth0-User-ID': currentUser.auth0_id }
      });
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites. Please try again.');
    }
  };

  const fetchAllDeals = async () => {
    try {
      const response = await fetch('http://localhost:8000/deals/active');
      const data = await response.json();
      setAllDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setError('Failed to load deals. Please try again.');
    }
  };

  const toggleFavorite = async (businessId) => {
    const isFavorited = favorites.some(fav => fav.id === businessId);
    try {
      if (isFavorited) {
        await fetch(`http://localhost:8000/favorites/${currentUser.id}/${businessId}`, {
          method: 'DELETE',
          headers: { 'X-Auth0-User-ID': currentUser.auth0_id }
        });
      } else {
        await fetch('http://localhost:8000/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth0-User-ID': currentUser.auth0_id
          },
          body: JSON.stringify({ user_id: currentUser.id, business_id: businessId })
        });
      }
      fetchFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setError('Failed to update favorite. Please try again.');
    }
  };

  const handleSearch = async () => {
  if (!searchQuery.trim()) {
    fetchBusinesses(filters)
    return
  }
  setLoading(true)
  try {
    const query = buildQueryString({
      q: searchQuery.trim(),
      lat: userLocation.lat,
      lng: userLocation.lng,
      category: filters.category !== 'all' ? filters.category : null,
      min_rating: filters.minRating > 0 ? filters.minRating : null,
      max_distance: filters.maxDistance !== 'all' ? filters.maxDistance : null,
    })
    const response = await fetch(`http://localhost:8000/search_local?${query}`)
    let data = await response.json()
    if (filters.hasDeals) data = data.filter(b => allDeals.some(d => d.business_id === b.id))
    setBusinesses(data)
  } catch (error) {
    console.error('Error searching businesses:', error)
    setError('Failed to search businesses. Please try again.')
  } finally {
    setLoading(false)
  }
}

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchBusinesses(newFilters)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(filters)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Row counts per scope, for the report panel's live labels.
  const reportCounts = {
    current: businesses.length,
    all: allBusinesses.length,
    favorites: favorites.length,
    deals: allBusinesses.filter(b => allDeals.some(d => d.business_id === b.id)).length,
  }

  const triggerDownload = (content, type, extension) => {
    const blob = new Blob([content], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `businesses_${new Date().toISOString().split('T')[0]}.${extension}`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  // Guard against CSV injection and escape embedded quotes/newlines.
  const csvCell = (value) => {
    let str = String(value ?? '')
    if (/^[=+\-@]/.test(str)) str = `'${str}`
    return `"${str.replace(/"/g, '""')}"`
  }

  const generateReport = () => {
    const config = reportConfig

    // 1. Resolve rows by scope (all source arrays already exist in state).
    const scopeRows = {
      current: businesses,
      all: allBusinesses,
      favorites,
      deals: allBusinesses.filter(b => allDeals.some(d => d.business_id === b.id)),
    }
    const rows = [...(scopeRows[config.scope] || [])]

    // 2. Sort.
    const dir = config.sortOrder === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      const av = a[config.sortBy]
      const bv = b[config.sortBy]
      if (config.sortBy === 'name') return String(av || '').localeCompare(String(bv || '')) * dir
      return ((Number(av) || 0) - (Number(bv) || 0)) * dir
    })

    // 3. Project selected columns via the shared field map.
    const fields = FIELD_DEFS.filter(f => config.columns[f.key])
    if (fields.length === 0 || rows.length === 0) return

    // 4. Emit by format.
    if (config.format === 'json') {
      const data = rows.map(r => Object.fromEntries(fields.map(f => [f.key, f.accessor(r)])))
      triggerDownload(JSON.stringify(data, null, 2), 'application/json', 'json')
    } else if (config.format === 'print') {
      const head = fields.map(f => `<th>${f.label}</th>`).join('')
      const body = rows.map(r =>
        `<tr>${fields.map(f => `<td>${String(f.accessor(r) ?? '')}</td>`).join('')}</tr>`
      ).join('')
      const win = window.open('', '_blank')
      if (!win) return
      win.document.write(`<!DOCTYPE html><html><head><title>Business Report</title>
        <style>
          body{font-family:system-ui,sans-serif;padding:24px;color:#111}
          h1{color:#15803d}
          table{border-collapse:collapse;width:100%;font-size:13px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#15803d;color:#fff}
          tr:nth-child(even){background:#f6f6f6}
        </style></head><body>
        <h1>HomegrownHaven Business Report</h1>
        <p>${rows.length} businesses · ${new Date().toLocaleDateString()}</p>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        </body></html>`)
      win.document.close()
      win.focus()
      win.print()
    } else {
      const header = fields.map(f => csvCell(f.label)).join(',')
      const lines = rows.map(r => fields.map(f => csvCell(f.accessor(r))).join(','))
      triggerDownload([header, ...lines].join('\n'), 'text/csv', 'csv')
    }

    setReportOpen(false)
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/10">
  <div className={`transition-all duration-300 ${filterOpen || reportOpen ? 'mr-60' : 'mr-0'}`}>
    <Header
      view={view}
      onHomeClick={() => setView('businesses')}
      onAboutClick={() => setView('about')}
    />

    {/* Error Banner */}
    {error && (
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )}

    {/* Floating Voice Assistant Button - Bottom Right */}
    <div className="fixed bottom-6 left-6 z-50">
      {!isInRoom ? (
        <button
          onClick={joinLiveKitRoom}
          disabled={isConnecting}
          aria-label="Talk to AI Assistant"
          className={`group relative bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-3 ${
            isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
          }`}
        >
          <div className="relative">
            <Bot className="w-8 h-8" />
            {isConnecting ? (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            ) : (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            )}
          </div>
          <span className="font-semibold text-lg pr-2 hidden group-hover:inline">
            {isConnecting ? 'Connecting...' : 'Talk to AI Assistant'}
          </span>
        </button>
      ) : (
        <button
          onClick={leaveLiveKitRoom}
          aria-label="End AI Assistant call"
          className="group relative bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-full shadow-2xl hover:shadow-red-500/50 hover:scale-110 transition-all duration-300 flex items-center gap-3"
        >
          <div className="relative">
            <PhoneOff className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <span className="font-semibold text-lg pr-2 hidden group-hover:inline">End Call</span>
        </button>
      )}
    </div>

    {/* Render LiveKit Audio UI when connected */}
    {liveKitRoom && <LiveKitAudioRoom room={liveKitRoom} />}

    <div className="mx-auto px-4 py-8 sm:py-12">
      {!selectedBusiness && (
        <>
          {/* Hero Section - only for businesses/analytics views */}
          {(view === 'businesses' || view === 'analytics') && (
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-700 text-transparent bg-clip-text text-primary mb-4 text-balance">
                Discover Local, Support Local
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty text-gray-600">
                Explore incredible local businesses in your community and get personalized recommendations with AI
                assistance
              </p>
            </div>
          )}

          {/* Tab Navigation - only for businesses/analytics views */}
          {(view === 'businesses' || view === 'analytics') && (
            <div className="flex justify-center gap-4 mb-8 border-b">
              <button
                onClick={() => setView('businesses')}
                className={`px-4 py-2 font-semibold transition-colors ${view === 'businesses' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-600 hover:text-green-700'}`}
              >
                Businesses
              </button>
              <button
                onClick={() => setView('analytics')}
                className={`px-4 py-2 font-semibold transition-colors ${view === 'analytics' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-600 hover:text-green-700'}`}
              >
                Analytics
              </button>
            </div>
          )}

          {view === 'businesses' && (
          <>
          <div className="flex justify-center items-center gap-5 mb-8">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} />
            <button
              onClick={() => { setReportOpen(false); setFilterOpen(!filterOpen); }}
              aria-label="Open filters"
              className="group relative bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-3 rounded-xl shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center hover:scale-105 "
            >
              <Filter className="w-5 h-5 mx-2 " />
              <span className="font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all whitespace-nowrap">
                Filters
              </span>
            </button>
            <button
              onClick={() => { setFilterOpen(false); setReportOpen(true); }}
              aria-label="Customize and export business report"
              className="group relative bg-white border-2 border-green-700 text-green-700 px-3 py-3 rounded-xl shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center hover:scale-105"
            >
              <Download className="w-5 h-5 mx-2" />
              <span className="font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all whitespace-nowrap">
                Export ({businesses.length})
              </span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading businesses...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {businesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  onSelect={setSelectedBusiness}
                  isFavorited={favorites.some(fav => fav.id === business.id)}
                  onToggleFavorite={toggleFavorite}
                  hasDeals={allDeals.some(deal => deal.business_id === business.id)}
                />
              ))}
            </div>
          )}
          </>
          )}

          {view === 'analytics' && (
            <AnalyticsDashboard
              businesses={allBusinesses}
              deals={allDeals}
              userLocation={userLocation}
            />
          )}

          {view === 'about' && (
            <AboutPage />
          )}
        </>
      )}

      {/* Business Detail View */}
      {selectedBusiness && (
        <BusinessDetail
          business={selectedBusiness}
          user={currentUser}
          onBack={() => setSelectedBusiness(null)}
          onAskAI={() => setShowVoiceChat(true)}
          isFavorited={favorites.some(fav => fav.id === selectedBusiness.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  </div>

  {/* BusinessFilter stays outside the pushed container */}
  <BusinessFilter
    onFilterChange={handleFilterChange}
    isOpen={filterOpen}
    onClose={() => setFilterOpen(false)}
    filters={filters}
  />

  <ReportConfig
    isOpen={reportOpen}
    onClose={() => setReportOpen(false)}
    config={reportConfig}
    onConfigChange={setReportConfig}
    onGenerate={generateReport}
    counts={reportCounts}
  />

  </div>
  )
}
