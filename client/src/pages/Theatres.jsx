import React, { useEffect, useState } from 'react'
import { MapPin, Film, Search, Filter, X, Plus, Clock, Calendar, Star } from 'lucide-react'
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

  // Fetch all theatres with their shows
  const fetchTheatresWithShows = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/theatre/')
      if (data && data.success) {
        const theatresList = Array.isArray(data.theatres) ? data.theatres : []
        
        // Fetch shows for each theatre
        const theatresWithShowsData = await Promise.all(
          theatresList.map(async (theatre) => {
            try {
              const showsResponse = await axios.get(`/api/public/shows/by-theatre/${theatre._id}`)
              const showsData = showsResponse.data.success ? showsResponse.data.shows || [] : []
              return { ...theatre, shows: showsData }
            } catch (error) {
              console.error(`Error fetching shows for theatre ${theatre._id}:`, error)
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
      console.error('Error fetching theatres:', error)
      toast.error('Failed to load theatres')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
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

  // Calculate minimum price from seat tiers or use base price
  const getMinPrice = (show) => {
    if (show.screen?.seatTiers && show.screen.seatTiers.length > 0) {
      const prices = show.screen.seatTiers.map(tier => tier.price).filter(price => price && price > 0);
      return prices.length > 0 ? Math.min(...prices) : (show.basePrice || show.showPrice || 150);
    }
    return show.basePrice || show.showPrice || 150;
  }

  // Navigate to movie show selector
  const handleSelectMovie = (movieId) => {
    navigate(`/select-show/${movieId}`)
  }

  // Navigate to seat layout for specific show
  const handleSelectShow = (showId) => {
    navigate(`/seat-layout/${showId}`)
  }

  useEffect(() => {
    fetchTheatresWithShows()
  }, [])

  return (
    <div className="relative mb-60 px-6 md:px-16 lg:px-40 overflow-hidden min-h-screen pt-20">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-medium text-3xl md:text-4xl text-white">
          Theatres & Shows
        </h1>
        <button
          onClick={() => setShowRegistration(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dull text-white rounded-lg font-semibold transition active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Apply as Theatre
        </button>
      </div>

      {/* Theatre Registration Modal */}
      {showRegistration && (
        <TheatreRegistration onClose={() => setShowRegistration(false)} />
      )}

      {/* Search & Filter Section */}
      <div className="mb-8 bg-gray-900/30 backdrop-blur-md rounded-lg p-6 border border-gray-700">
        <div className="relative flex items-center gap-3">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search theatres by name, city, or location..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary outline-none transition placeholder-gray-500"
          />
        </div>
      </div>

      {/* Theatres with Shows */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-400">Loading theatres and shows...</p>
        </div>
      ) : filteredTheatres.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No theatres found</p>
          <p className="text-gray-500 text-sm">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredTheatres.map((theatre) => (
            <div
              key={theatre._id}
              className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden"
            >
              {/* Theatre Header */}
              <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{theatre.name}</h2>
                      <p className="text-gray-300">{theatre.location}, {theatre.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Cineplex</div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">4.5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shows Section */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Now Showing</h3>
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                    {theatre.shows?.length || 0} Shows
                  </span>
                </div>

                {theatre.shows && theatre.shows.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {theatre.shows.map((show) => (
                      <div
                        key={show._id}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group"
                      >
                        <div className="relative">
                          <img
                            src={
                              show.movie?.poster_path?.startsWith('http') 
                                ? show.movie.poster_path 
                                : imageBaseURL + (show.movie?.poster_path || '')
                            }
                            alt={show.movie?.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <Film className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>

                        <div className="p-4">
                          <h4 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {show.movie?.title}
                          </h4>

                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                            <Clock className="w-4 h-4" />
                            <span>
                              {show.showDateTime 
                                ? new Date(show.showDateTime).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : show.showTime || 'No time'
                              }
                            </span>
                            <span>•</span>
                            <span>{show.language || 'English'}</span>
                            <span>•</span>
                            <span className="text-primary font-semibold">₹{getMinPrice(show)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {show.showDateTime 
                                ? new Date(show.showDateTime).toLocaleDateString()
                                : show.startDate 
                                ? new Date(show.startDate).toLocaleDateString()
                                : 'No date'
                              }
                            </span>
                            <span>•</span>
                            <span>Screen {show.screen?.screenNumber || 'N/A'}</span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSelectShow(show._id)}
                              className="w-full py-2 bg-primary hover:bg-primary-dull text-white rounded font-semibold transition text-sm"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700">
                    <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No shows currently running at this theatre</p>
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

