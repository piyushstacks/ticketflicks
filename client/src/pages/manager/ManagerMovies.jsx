import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { Plus, Edit2, Power, PowerOff, Film, Clock, Star, Calendar, Eye, X } from "lucide-react";
import Loading from "../../components/Loading";

const ManagerMovies = () => {
  const { axios, getAuthHeaders, imageBaseURL } = useAppContext();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingMovie, setViewingMovie] = useState(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/show/movies/all", {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setMovies(data.movies || []);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error("Failed to fetch movies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleToggleStatus = async (movieId, currentStatus) => {
    const action = currentStatus === 'disabled' ? 'enable' : 'disable';
    const confirmMessage = `Are you sure you want to ${action} this movie?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      const { data } = await axios.patch(`/api/show/movies/${movieId}`, {
        isActive: action === 'enable'
      }, {
        headers: getAuthHeaders()
      });

      if (data.success) {
        toast.success(`Movie ${action}d successfully`);
        fetchMovies();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Failed to ${action} movie`);
    }
  };

  const getGenreName = (genre) => {
    if (typeof genre === 'string') return genre;
    if (typeof genre === 'object' && genre.name) return genre.name;
    return String(genre);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Movies</h1>
          <p className="text-gray-400 mt-1">View and manage movies available for your theatre shows</p>
        </div>
      </div>

      {/* Movies Grid */}
      <div className="bg-gray-900/20 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Available Movies for Shows</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{movies.length} movies available</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <div
                key={movie._id}
                className={`bg-gray-800/50 border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 ${
                  !movie.isActive ? 'border-gray-700 opacity-60' : 'border-gray-600'
                }`}
              >
                <div className="relative">
                  {movie.poster_path ? (
                    <img
                      src={
                        movie.poster_path.startsWith("http")
                          ? movie.poster_path
                          : `${imageBaseURL}${movie.poster_path}`
                      }
                      alt={movie.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  {!movie.isActive && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-red-600/90 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                      Inactive
                    </div>
                  )}
                  {movie.isActive && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-green-600/90 text-white text-xs rounded-full font-medium backdrop-blur-sm">
                      Active
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg line-clamp-2 text-white">{movie.title}</h3>
                    {movie.genres && movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {movie.genres.slice(0, 2).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-md"
                          >
                            {getGenreName(genre)}
                          </span>
                        ))}
                        {movie.genres.length > 2 && (
                          <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
                            +{movie.genres.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{movie.runtime} min</span>
                      </div>
                      {movie.vote_average && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-white">{movie.vote_average}</span>
                        </div>
                      )}
                    </div>
                    
                    {movie.release_date && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setViewingMovie(movie)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleToggleStatus(movie._id, movie.isActive ? 'active' : 'disabled')}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition text-sm font-medium ${
                        !movie.isActive
                          ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                          : 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-400'
                      }`}
                    >
                      {!movie.isActive ? (
                        <>
                          <Power className="w-4 h-4" />
                          Enable
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-4 h-4" />
                          Disable
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Film className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Movies Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Movies will appear here once they are added to your theatre. Contact your administrator if you need movies added.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Movie Details Modal */}
      {viewingMovie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{viewingMovie.title}</h2>
                  {viewingMovie.genres && viewingMovie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {viewingMovie.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-primary/20 text-primary text-sm rounded"
                        >
                          {getGenreName(genre)}
                        </span>
                      ))}
                    </div>
                  )}
                  {!viewingMovie.isActive && (
                    <span className="inline-block px-3 py-1 bg-red-600/20 text-red-400 text-sm rounded mt-2">
                      Inactive
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setViewingMovie(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Movie Poster */}
                <div>
                  {viewingMovie.poster_path ? (
                    <img
                      src={
                        viewingMovie.poster_path.startsWith("http")
                          ? viewingMovie.poster_path
                          : `${imageBaseURL}${viewingMovie.poster_path}`
                      }
                      alt={viewingMovie.title}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-gray-800 flex items-center justify-center rounded-lg">
                      <Film className="w-24 h-24 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Movie Details */}
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-primary mb-3">Movie Information</h3>
                    <div className="space-y-3">
                      {viewingMovie.overview && (
                        <div>
                          <h4 className="text-sm text-gray-400 mb-1">Overview</h4>
                          <p className="text-gray-300">{viewingMovie.overview}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        {viewingMovie.runtime && (
                          <div>
                            <span className="text-gray-400">Runtime:</span>
                            <span className="ml-2 text-gray-300">{viewingMovie.runtime} min</span>
                          </div>
                        )}
                        
                        {viewingMovie.vote_average && (
                          <div>
                            <span className="text-gray-400">Rating:</span>
                            <span className="ml-2 text-gray-300">{viewingMovie.vote_average}/10</span>
                          </div>
                        )}
                        
                        {viewingMovie.release_date && (
                          <div>
                            <span className="text-gray-400">Release Date:</span>
                            <span className="ml-2 text-gray-300">
                              {new Date(viewingMovie.release_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        <div>
                          <span className="text-gray-400">Status:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            viewingMovie.isActive 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-red-600/20 text-red-400'
                          }`}>
                            {viewingMovie.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewingMovie.backdrop_path && (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-primary mb-3">Backdrop Image</h3>
                      <img
                        src={
                          viewingMovie.backdrop_path.startsWith("http")
                            ? viewingMovie.backdrop_path
                            : `${imageBaseURL}${viewingMovie.backdrop_path}`
                        }
                        alt={`${viewingMovie.title} backdrop`}
                        className="w-full rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerMovies;
