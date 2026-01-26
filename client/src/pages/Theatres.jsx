import React, { useEffect, useState } from 'react'
import { MapPin, Film, Search, Filter, X, Plus } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import TheatreRegistration from '../components/TheatreRegistration'

const Theatres = () => {
  const navigate = useNavigate()
  const { axios } = useAppContext()

  const [theaters, setTheaters] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTheater, setSelectedTheater] = useState(null)
  const [theaterMovies, setTheaterMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [filteredTheaters, setFilteredTheaters] = useState([])
  const [showRegistration, setShowRegistration] = useState(false)

  // Fetch all theaters
  const fetchTheaters = async () => {
    try {
      setLoading(true)
  const { data } = await axios.get('/api/theatre/')
      if (data && data.success) {
        const list = Array.isArray(data.theatres) ? data.theatres : []
        setTheaters(list)
        setFilteredTheaters(list)
      } else {
        // Ensure state is always an array
        setTheaters([])
        setFilteredTheaters([])
      }
    } catch (error) {
      console.error('Error fetching theaters:', error)
      toast.error('Failed to load theaters')
    } finally {
      setLoading(false)
    }
  }

  // Get shows for selected theater
  const fetchShowsForTheater = async (theaterId) => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/show/all')
      if (data.success) {
        // Filter shows for this theater
        const theaterShows = data.shows.filter(
          (show) => show.theater?._id === theaterId
        )
        setTheaterMovies(theaterShows)
      }
    } catch (error) {
      console.error('Error fetching shows:', error)
      setTheaterMovies([])
    } finally {
      setLoading(false)
    }
  }

  // Handle theater selection
  const handleTheaterSelect = (theater) => {
    setSelectedTheater(theater)
    fetchShowsForTheater(theater._id)
  }

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredTheaters(theaters)
    } else {
      const q = query.toLowerCase()
      const filtered = theaters.filter((theater) => {
        const name = (theater.name || '').toString().toLowerCase()
        const city = (theater.city || '').toString().toLowerCase()
        const location = (theater.location || '').toString().toLowerCase()
        return name.includes(q) || city.includes(q) || location.includes(q)
      })
      setFilteredTheaters(filtered)
    }
  }

  // Navigate to movie details
  const handleSelectMovie = (movieId) => {
    navigate(`/movies/${movieId}`)
  }

  useEffect(() => {
    fetchTheaters()
  }, [])

  return (
    <div className="relative mb-60 px-6 md:px-16 lg:px-40 overflow-hidden min-h-screen pt-20">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <div className="flex items-center justify-between mb-8">
        <h1 className="font-medium text-3xl md:text-4xl text-white">
          Find Your Theater
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

      {!selectedTheater ? (
        <>
          {/* Search & Filter Section */}
          <div className="mb-8 bg-gray-900/30 backdrop-blur-md rounded-lg p-6 border border-gray-700">
            <div className="relative flex items-center gap-3">
              <Search className="absolute left-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search theaters by name, city, or location..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary outline-none transition placeholder-gray-500"
              />
            </div>
          </div>

          {/* Theaters Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading theaters...</p>
            </div>
          ) : filteredTheaters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">No theaters found</p>
              <p className="text-gray-500 text-sm">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTheaters.map((theater) => (
                <div
                  key={theater._id}
                  onClick={() => handleTheaterSelect(theater)}
                  className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-2xl p-6 hover:border-primary hover:bg-gray-900/50 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                      {theater.name}
                    </h2>
                    <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                      {theater.screens?.length || 0} Screens
                    </div>
                  </div>

                  <div className="space-y-3 text-gray-300">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{theater.location}</p>
                        <p className="text-sm text-gray-500">
                          {theater.contact_no || theater.location || ''}
                        </p>
                      </div>
                    </div>

                    {theater.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">📞</span>
                        <p>{theater.phone}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTheaterSelect(theater)
                    }}
                    className="w-full mt-4 py-2 bg-primary hover:bg-primary-dull text-white rounded-lg font-semibold transition active:scale-95"
                  >
                    View Movies
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Theater Movies View */}
          <button
            onClick={() => {
              setSelectedTheater(null)
              setTheaterMovies([])
            }}
            className="flex items-center gap-2 text-primary hover:text-primary-dull transition mb-8 font-semibold"
          >
            ← Back to Theaters
          </button>

          <div className="mb-8 bg-gray-900/30 backdrop-blur-md rounded-lg p-6 border border-primary/20">
            <h2 className="text-2xl font-bold mb-2">{selectedTheater.name}</h2>
            <p className="text-gray-400">{selectedTheater.contact_no || selectedTheater.location}</p>
          </div>

          {/* Movies at Selected Theater */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading movies...</p>
            </div>
          ) : theaterMovies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No movies showing at this theater</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xl font-semibold mb-6">Now Showing ({theaterMovies.length} movies)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theaterMovies.map((show) => (
                  <div
                    key={show._id}
                    onClick={() => handleSelectMovie(show.movie._id)}
                    className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-lg overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={'https://image.tmdb.org/t/p/w500' + show.movie.poster_path}
                        alt={show.movie.title}
                        className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                        <Film className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {show.movie.title}
                      </h3>

                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">Showtimes:</p>
                        <div className="flex flex-wrap gap-2">
                          {[show.showDateTime].map((time, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/20 text-primary text-xs rounded font-semibold"
                            >
                              {new Date(time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectMovie(show.movie._id)
                        }}
                        className="w-full py-2 bg-primary hover:bg-primary-dull text-white rounded font-semibold transition active:scale-95"
                      >
                        Select Movie
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Theatres

