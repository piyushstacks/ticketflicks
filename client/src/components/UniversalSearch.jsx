import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Film, MapPin, Calendar, Clock, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UniversalSearch = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { axios, shows, imageBaseURL } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close search on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleResultClick = useCallback((result) => {
    onClose();
    if (result.type === 'movie') {
      // Navigate to movie details page
      navigate(`/movies/${result.movieData._id}`);
    } else if (result.type === 'theatre') {
      navigate(`/theatres`);
    }
  }, [onClose, navigate]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!searchResults.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedIndex, handleResultClick]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // Search movies only (no shows)
        const movieShowResponse = await axios.get(`/api/search/movies?q=${encodeURIComponent(searchQuery)}`)
          .catch(() => ({ data: { success: false, movies: [], shows: [] } }));
        
        const movieResults = (movieShowResponse.data.movies || [])
          .slice(0, 5)
          .map(movie => ({
            type: 'movie',
            id: movie.id,
            title: movie.title,
            subtitle: movie.subtitle,
            image: movie.image ? `${imageBaseURL}/w92${movie.image}` : null,
            movieData: movie.movieData
          }));

        // Search theatres
        const theatreResponse = await axios.get(`/api/search/theatres?q=${encodeURIComponent(searchQuery)}`)
          .catch(() => ({ data: { success: false, theatres: [] } }));
        
        const theatreResults = (theatreResponse.data.theatres || [])
          .slice(0, 5)
          .map(theatre => ({
            type: 'theatre',
            id: theatre._id,
            title: theatre.name,
            subtitle: theatre.address,
            image: null,
            theatreData: theatre
          }));

        // Combine results (movies and theatres only, no shows)
        const combinedResults = [...movieResults, ...theatreResults];
        setSearchResults(combinedResults);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        toast.error('Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, shows, axios, imageBaseURL]);

  const getGenreName = (genreId) => {
    const genreMap = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Science Fiction',
      10770: 'TV Movie',
      53: 'Thriller',
      10752: 'War',
      37: 'Western'
    };
    return genreMap[genreId] || '';
  };

  const handleOverlayClick = (e) => {
    if (e.target === searchContainerRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

    return (
      <div 
        ref={searchContainerRef}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
        onClick={handleOverlayClick}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-lg`} />
      
        {/* Search Container */}
        <div className="glass-card shadow-2xl border border-white/10 relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className={`flex items-center gap-3 p-4 border-b ${
            isDark ? 'border-white/20' : 'border-gray-200'
          }`}>
          <Search className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-gray-500'}`} />
          <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies and theatres..."
              className="flex-1 bg-transparent outline-none text-lg movie-title placeholder-movie-meta"
          />
          <button
              onClick={onClose}
              className="btn-secondary p-2 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
        </div>

        {/* Search Results */}
        <div className="overflow-y-auto max-h-[60vh]">
            {isSearching && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
              </div>
            )}

          {!isSearching && searchResults.length === 0 && searchQuery && (
            <div className="text-center p-8">
              <Search className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                No results found for "{searchQuery}"
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                Try searching with different keywords
              </p>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center p-8">
              <Search className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              <p className={`text-lg ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                Search for movies and theatres
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                Start typing to see results
              </p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className={`w-full flex items-center gap-4 p-4 text-left transition-all duration-200 rounded-xl ${
                      index === selectedIndex
                        ? 'bg-accent/10 shadow-md scale-[1.01]'
                        : 'hover:bg-accent/5 hover:shadow-sm'
                    }`}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      result.type === 'movie'
                        ? 'bg-accent/20 text-accent'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {result.type === 'movie' ? (
                      <Film className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate movie-title">
                        {result.title}
                      </h3>
                    {result.subtitle && (
                        <p className="text-sm truncate movie-meta">
                          {result.subtitle}
                        </p>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.type === 'movie'
                        ? 'bg-accent/20 text-accent' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {result.type === 'movie' ? 'Movie' : 'Theatre'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-4 py-3 border-t text-xs ${
          isDark 
            ? 'border-white/20 text-white/40' 
            : 'border-gray-200 text-gray-500'
        }`}>
          <div className="flex items-center justify-between">
            <span>Press Enter to select • Esc to close</span>
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalSearch;