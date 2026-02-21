import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Film, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const UniversalSearch = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { axios, shows, imageBaseURL } = useAppContext();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleResultClick = useCallback((result) => {
    onClose();
    if (result.type === 'movie') {
      navigate(`/movies/${result.movieData._id}`);
    } else if (result.type === 'theatre') {
      navigate(`/theatres`);
    }
  }, [onClose, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!searchResults.length) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) handleResultClick(searchResults[selectedIndex]);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedIndex, handleResultClick]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      try {
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

        setSearchResults([...movieResults, ...theatreResults]);
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

  const handleOverlayClick = (e) => {
    if (e.target === searchContainerRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={searchContainerRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-lg"
        style={{ backgroundColor: "var(--overlay)" }}
      />

      {/* Search Container */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden animate-fadeIn"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px var(--shadow-color)",
        }}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movies and theatres..."
            className="flex-1 bg-transparent outline-none text-base sm:text-lg"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg transition-all hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <div className="text-center p-6 sm:p-8">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
                No results found for "{searchQuery}"
              </p>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: "var(--text-muted)" }}>
                Try searching with different keywords
              </p>
            </div>
          )}

          {!searchQuery && (
            <div className="text-center p-6 sm:p-8">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4" style={{ color: "var(--text-muted)" }} />
              <p className="text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
                Search for movies and theatres
              </p>
              <p className="text-xs sm:text-sm mt-1.5 sm:mt-2" style={{ color: "var(--text-muted)" }}>
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
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 text-left transition-all duration-200"
                  style={{
                    backgroundColor: index === selectedIndex ? "var(--bg-elevated)" : "transparent",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-elevated)"; }}
                  onMouseLeave={(e) => {
                    if (index !== selectedIndex) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: result.type === 'movie' ? "var(--color-accent-soft)" : "rgba(59, 130, 246, 0.12)",
                    }}
                  >
                    {result.type === 'movie' ? (
                      <Film className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                    ) : (
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {result.title}
                    </h3>
                    {result.subtitle && (
                      <p className="text-xs sm:text-sm truncate" style={{ color: "var(--text-muted)" }}>
                        {result.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div
                    className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: result.type === 'movie' ? "var(--color-accent-soft)" : "rgba(59, 130, 246, 0.12)",
                      color: result.type === 'movie' ? "var(--color-accent)" : "#60a5fa",
                    }}
                  >
                    {result.type === 'movie' ? 'Movie' : 'Theatre'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <div className="flex items-center justify-between">
            <span>Press Enter to select -- Esc to close</span>
            <span className="hidden sm:inline">Use arrow keys to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalSearch;
