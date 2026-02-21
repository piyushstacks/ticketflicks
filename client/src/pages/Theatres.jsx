import React, { useEffect, useState } from 'react'
import { MapPin, Film, Search, Plus, Clock, Calendar, Star } from 'lucide-react'
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

  const fetchTheatresWithShows = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/theatre/')
      if (data && data.success) {
        const theatresList = Array.isArray(data.theatres) ? data.theatres : []
        const theatresWithShowsData = await Promise.all(
          theatresList.map(async (theatre) => {
            try {
              const showsResponse = await axios.get(`/api/public/shows/by-theatre/${theatre._id}`)
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
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search theatres by name, city, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-field pl-10"
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
          {filteredTheatres.map((theatre) => (
            <div
              key={theatre._id}
              className="card overflow-hidden"
            >
              {/* Theatre Header */}
              <div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl" style={{ backgroundColor: "var(--color-accent-soft)" }}>
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{theatre.name}</h2>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{theatre.location}, {theatre.city}</p>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-accent"
                  style={{ backgroundColor: "var(--color-accent-soft)" }}
                >
                  {theatre.shows?.length || 0} Shows
                </span>
              </div>

              {/* Shows */}
              <div className="p-5">
                {theatre.shows && theatre.shows.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {theatre.shows.map((show) => (
                      <div
                        key={show._id}
                        className="rounded-xl overflow-hidden group transition-all duration-200"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      >
                        <div className="relative overflow-hidden">
                          <img
                            src={
                              show.movie?.poster_path?.startsWith('http')
                                ? show.movie.poster_path
                                : imageBaseURL + (show.movie?.poster_path || '')
                            }
                            alt={show.movie?.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-3.5">
                          <h4 className="font-semibold text-sm mb-2 truncate" style={{ color: "var(--text-primary)" }}>
                            {show.movie?.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {show.showDateTime
                                ? new Date(show.showDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                                : show.showTime || 'TBD'}
                            </span>
                            <span>-</span>
                            <span>{show.language || 'English'}</span>
                            <span>-</span>
                            <span className="text-accent font-semibold">{'₹'}{getMinPrice(show)}</span>
                          </div>
                          <button
                            onClick={() => handleSelectShow(show._id)}
                            className="btn-primary w-full py-2 text-xs"
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-10 rounded-xl"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <Calendar className="w-8 h-8 mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>No shows currently running</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Theatres
