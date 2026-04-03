import React, { useEffect, useState } from 'react'
import { MapPin, Film, Search, Plus, Clock, Calendar, Star, ChevronDown, ChevronUp, Monitor } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import TheatreRegistration from '../components/TheatreRegistration'

const Theatres = () => {
  const navigate = useNavigate()
  const { axios, imageBaseURL } = useAppContext()

  const [theatres, setTheatres] = useState([])
  const [theatresWithShows, setTheatresWithShows] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [filteredTheatres, setFilteredTheatres] = useState([])
  const [showRegistration, setShowRegistration] = useState(false)
  
  // Track which theatres are expanded to view shows
  const [expandedTheatres, setExpandedTheatres] = useState({})

  const toggleTheatre = (id) => {
    setExpandedTheatres(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const fetchTheatresWithShows = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/theatre?status=approved&disabled=false')
      if (data && data.success) {
        const theatresList = Array.isArray(data.theatres) ? data.theatres : []
        const theatresWithShowsData = await Promise.all(
          theatresList.map(async (theatre) => {
            try {
              const showsResponse = await axios.get(`/api/public/shows/by-theatre/${theatre.id || theatre._id}`)
              const showsData = showsResponse.data.success ? showsResponse.data.shows || [] : []
              return { ...theatre, shows: showsData }
            } catch (error) {
              return { ...theatre, shows: [] }
            }
          })
        )
        setTheatres(theatresList)
        setTheatresWithShows(theatresWithShowsData)
        setFilteredTheatres(theatresWithShowsData)
      } else {
        setTheatres([])
        setTheatresWithShows([])
        setFilteredTheatres([])
      }
    } catch (error) {
      toast.error('Failed to load theatres')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredTheatres(theatresWithShows)
    } else {
      const q = query.toLowerCase()
      const filtered = theatresWithShows.filter((theatre) => {
        const name = (theatre.name || '').toString().toLowerCase()
        const city = (theatre.city || '').toString().toLowerCase()
        const location = (theatre.location || '').toString().toLowerCase()
        return name.includes(q) || city.includes(q) || location.includes(q)
      })
      setFilteredTheatres(filtered)
    }
  }

  const getMinPrice = (show) => {
    if (show.screen?.seatTiers && show.screen.seatTiers.length > 0) {
      const prices = show.screen.seatTiers.map(tier => tier.price).filter(price => price && price > 0)
      return prices.length > 0 ? Math.min(...prices) : (show.basePrice || show.showPrice || 150)
    }
    return show.basePrice || show.showPrice || 150
  }

  const handleSelectShow = (showId) => {
    navigate(`/seat-layout/${showId}`)
  }

  useEffect(() => {
    fetchTheatresWithShows()
  }, [])

  return (
    <div className="relative pb-20 px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 overflow-hidden min-h-screen pt-24">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-semibold text-2xl" style={{ color: "var(--text-primary)" }}>
            Theatres & Shows
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Find theatres and book shows near you
          </p>
        </div>
        <button
          onClick={() => setShowRegistration(true)}
          className="btn-secondary text-sm"
        >
          <Plus className="w-4 h-4" />
          Apply as Theatre
        </button>
      </div>

      {showRegistration && <TheatreRegistration onClose={() => setShowRegistration(false)} />}

      {/* Search */}
      <div
        className="mb-8 rounded-xl p-4"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search theatres by name, city, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field w-full h-12"
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </div>

      {/* Theatres */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading theatres...</p>
        </div>
      ) : filteredTheatres.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-xl"
          style={{ backgroundColor: "var(--bg-secondary)" }}
        >
          <Film className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>No theatres found</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Try a different search</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredTheatres.map((theatre) => {
            const tId = theatre.id || theatre._id;
            const isExpanded = !!expandedTheatres[tId];
            
            return (
            <div
              key={tId}
              className="card overflow-hidden transition-all duration-300"
            >
              {/* Theatre Header */}
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                style={{ borderBottom: isExpanded ? "1px solid var(--border)" : "none" }}
                onClick={() => toggleTheatre(tId)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{theatre.name}</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{theatre.location}, {theatre.city}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span
                    className="px-4 py-1.5 rounded-full text-xs font-semibold text-accent whitespace-nowrap"
                    style={{ backgroundColor: "var(--color-accent-soft)" }}
                  >
                    {theatre.shows?.length || 0} Shows Available
                  </span>
                  <div className="p-2 rounded-full hidden sm:flex items-center justify-center transition-transform duration-300" 
                       style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                     <ChevronDown className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
                  </div>
                  {/* Mobile toggle button layout */}
                  <button className="sm:hidden text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1"
                          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                     {isExpanded ? 'Hide' : 'View'} 
                     <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Shows Content - Only Render if Expanded */}
              {isExpanded && (
                <div className="p-5 bg-[var(--bg-card)]">
                  {theatre.shows && theatre.shows.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {theatre.shows.map((show) => {
                        const movieTitle = show.movie?.title || 'Unknown Movie'
                        const showDate = show.showDateTime
                          ? new Date(show.showDateTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : (show.startDate ? new Date(show.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD')
                        const showTime = show.showDateTime
                          ? new Date(show.showDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                          : (show.showTime || 'TBD')
                        const screenName = show.screen?.name || (show.screen?.screenNumber ? `Screen ${show.screen.screenNumber}` : 'Screen')
                        const minPrice = getMinPrice(show)

                        return (
                        <div
                          key={show._id}
                          className="rounded-xl overflow-hidden group transition-all duration-300 hover:shadow-lg"
                          style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                        >
                          <div className="relative overflow-hidden aspect-[4/3]">
                            <img
                              src={
                                show.movie?.poster_path?.startsWith('http')
                                  ? show.movie.poster_path
                                  : imageBaseURL + (show.movie?.poster_path || '')
                              }
                              alt={movieTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            {/* Language badge over poster */}
                            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: 'var(--color-accent)', border: '1px solid var(--border)' }}>
                              {show.language || 'English'}
                            </span>
                          </div>

                          <div className="p-4 flex flex-col gap-2">
                            {/* Movie Title */}
                            <h4 className="font-bold text-sm leading-tight line-clamp-1" style={{ color: "var(--text-primary)" }}>
                              {movieTitle}
                            </h4>

                            {/* Date Row */}
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                              <span>{showDate}</span>
                            </div>

                            {/* Time Row */}
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{showTime}</span>
                            </div>

                            {/* Screen Row */}
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <Monitor className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                              <span>{screenName}</span>
                              <span className="ml-auto font-semibold text-accent">₹{minPrice}</span>
                            </div>

                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelectShow(show._id); }}
                              className="btn-primary w-full py-2 text-xs mt-1 shadow-md hover:shadow-accent/25"
                            >
                              Book Tickets
                            </button>
                          </div>
                        </div>
                        )})
                      }
                    </div>
                  ) : (
                    <div
                      className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed"
                      style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
                    >
                      <div className="p-3 bg-[var(--bg-card)] rounded-full mb-3 shadow-sm">
                         <Calendar className="w-6 h-6 text-accent opacity-80" />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No shows scheduled</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Check back later for newly added shows.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default Theatres
