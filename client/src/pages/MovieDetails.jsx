import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { Heart, HeartIcon, PlayCircleIcon, StarIcon, ChevronDown } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import TrailerSection from "../components/TrailerSection";
import useWindowWidth from "../hooks/useWindowWidth";

const MovieDetails = () => {
  const navigate = useNavigate();
  const width = useWindowWidth();

  let sliceCount = 4;
  if (width >= 1024 && width < 1536) {
    // lg (≥1024) and xl (<1536)
    sliceCount = 3;
  }

  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [selectedShowId, setSelectedShowId] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [screens, setScreens] = useState([]);
  const [shows, setShows] = useState({});
  const [loading, setLoading] = useState(false);

  const {
    shows: allShows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    imageBaseURL,
  } = useAppContext();

  // Fetch all theaters
  const fetchTheaters = async () => {
    try {
      const { data } = await axios.get("/api/theatre/");
      if (data.success) {
        setTheaters(data.theaters);
      }
    } catch (error) {
      console.error("Error fetching theaters:", error);
    }
  };

  // Fetch screens for selected theater
  const fetchScreens = async (theaterId) => {
    if (!theaterId) {
      setScreens([]);
      return;
    }

    try {
      // The theatre API returns the theatre document with embedded screens
      const { data } = await axios.get(`/api/theatre/${theaterId}`);
      if (data && data.success && data.theatre) {
        // Some theatre documents use `screens` array directly
        const screensList = Array.isArray(data.theatre.screens)
          ? data.theatre.screens
          : [];
        setScreens(screensList);
        setSelectedScreen(null);
      } else {
        setScreens([]);
      }
    } catch (error) {
      console.error("Error fetching screens:", error);
      setScreens([]);
    }
  };

  // Fetch shows for movie (grouped by theater/screen)
  const fetchShowsForMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/show/by-movie/${id}`);
      if (data.success) {
        setShows(data.groupedShows);
      }
    } catch (error) {
      console.error("Error fetching shows:", error);
    } finally {
      setLoading(false);
    }
  };

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);

      if (data.success) {
        // The server may return either { show } (single show) or { movie, dateTime }
        // when fetching by movie id. Normalize to an object with `movie` so the
        // component can safely access `show.movie`.
        if (data.movie) {
          setShow({ movie: data.movie, dateTime: data.dateTime || {} });
        } else if (data.show) {
          setShow(data.show);
        } else {
          // Fallback: set raw response
          setShow(data);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFavorite = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");

      const { data } = await axios.post(
        "/api/user/update-favorite",
        {
          movieId: id,
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Handle theater selection
  const handleTheaterChange = (theaterId) => {
    setSelectedTheater(theaterId);
    fetchScreens(theaterId);
  };

  // Get shows for selected theater and screen
  const getShowsForSelection = () => {
    if (!selectedTheater || !selectedScreen || !shows[selectedTheater]) {
      return [];
    }

    const theaterShows = shows[selectedTheater].screens[selectedScreen];
    return theaterShows?.shows || [];
  };

  const isFavorite = favoriteMovies.some((movie) => movie._id === id);

  const FavoriteButton = ({ className = "", iconSize = "w-5 h-5" }) => (
    <button
      onClick={handleFavorite}
      className={`bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95 ${className}`}
    >
      <Heart
        className={`${iconSize} ${
          isFavorite ? "fill-primary text-primary" : ""
        }`}
      />
    </button>
  );

  useEffect(() => {
    getShow();
    fetchTheaters();
    fetchShowsForMovie();
  }, [id]);

  // Ensure we have movie details before attempting to render properties like poster, casts, etc.
  return show && show.movie ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20">
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto mb-12">
        <img
          src={
            (show.movie.poster_path || "").startsWith("http")
              ? show.movie.poster_path
              : imageBaseURL + (show.movie.poster_path || "")
          }
          alt={show.movie.title || "Movie Poster"}
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />
          <p className="text-primary">ENGLISH</p>
          <h1 className="text-4xl font-semibold max-w-96 text-balance flex w-full justify-between items-center">
            {show.movie.title}
            <FavoriteButton className="lg:hidden" iconSize="w-7 h-7" />
          </h1>
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {(typeof show.movie.vote_average === "number" && !isNaN(show.movie.vote_average))
              ? show.movie.vote_average.toFixed(1)
              : "N/A"} User Rating
          </div>

          <p className="text-gray-400 mt-2 text-md leading-tight max-w-2xl">
            {show.movie.overview}
          </p>

          <p>
            {(show.movie.runtime ? timeFormat(show.movie.runtime) : "N/A")} ●{" "}
            {(Array.isArray(show.movie.genres) ? show.movie.genres.map((genre) => genre.name).join(" | ") : "N/A")} ●{" "}
            {(show.movie.release_date ? show.movie.release_date.split("-").join("/") : "N/A")}
          </p>

          <div className="flex items-center flex-wrap gap-4 mt-4 lg:gap-3 xl:gap-4">
            <a
              href="#trailer"
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition 
              rounded-md font-medium cursor-pointer active:scale-95"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </a>
            <a
              onClick={() => {
                navigate(`/select-show/${id}`);
                scrollTo(0, 0);
              }}
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium
              cursor-pointer active:scale-95"
            >
              Book Tickets
            </a>
            <FavoriteButton className="max-md:hidden" />
          </div>
        </div>
      </div>

      {/* Theater/Screen/Show Selection Section */}
      <div id="bookingSection" className="bg-gray-900/50 backdrop-blur-md rounded-lg p-8 my-12 border border-gray-700">
        <h2 className="text-2xl font-bold mb-8">Select Your Show</h2>
        
        {/* Theater Selection */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-3">Select Theater</label>
          <select
            value={selectedTheater || ""}
            onChange={(e) => handleTheaterChange(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary outline-none transition hover:bg-gray-750 cursor-pointer"
          >
            <option value="">-- Choose a theater --</option>
            {(Array.isArray(theaters) ? theaters : []).map((theater) => (
              <option key={theater._id} value={theater._id}>
                {theater.name} - {theater.city}
              </option>
            ))}
          </select>
        </div>

        {/* Screen Selection */}
        {selectedTheater && screens.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3">Select Screen</label>
            <select
              value={selectedScreen || ""}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-primary outline-none transition hover:bg-gray-750 cursor-pointer"
            >
              <option value="">-- Choose a screen --</option>
              {(Array.isArray(screens) ? screens : []).map((screen) => (
                <option key={screen._id} value={screen._id}>
                  {screen.screenNumber} ({screen.seatLayout.totalSeats} seats)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Shows Grid */}
        {selectedTheater && selectedScreen && (
          <div>
            <label className="block text-sm font-semibold mb-4">Select Show Time</label>
            {getShowsForSelection().length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(getShowsForSelection() || []).map((showItem) => (
                  <button
                    key={showItem._id}
                    onClick={() => {
                      if (!user) {
                        navigate("/login");
                        return;
                      }
                      navigate(`/seat-layout/${showItem._id}`);
                    }}
                    className="p-3 bg-primary hover:bg-primary-dull rounded-lg transition text-center font-semibold text-white active:scale-95 transform duration-200"
                  >
                    {new Date(showItem.showDateTime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-6">
                No shows available for this selection
              </p>
            )}
          </div>
        )}

        {!selectedTheater && (
          <p className="text-gray-400 text-center py-6">
            👆 Please select a theater to view available shows
          </p>
        )}
      </div>

      <p className="text-xl font-medium mt-20">Movie Cast:</p>
      <div className="overflow-x-auto mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {(show.movie.casts || []).slice(0, 16).map((cast, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <img
                src={imageBaseURL + cast.profile_path}
                alt={cast.name}
                className="rounded-full h-20 md:h-20 aspect-square object-cover"
              />
              <p className="font-medium text-xs mt-3">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>

      <TrailerSection id={id} />

      <p className="text-xl font-medium mt-20 mb-8">You May Also Like</p>
      <div className="flex flex-wrap max-sm:justify-center gap-9 ">
        {(Array.isArray(allShows) ? allShows : [])
          .filter((movie) => movie._id !== id)
          .slice(0, sliceCount)
          .map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
      </div>
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95"
        >
          Show More
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
