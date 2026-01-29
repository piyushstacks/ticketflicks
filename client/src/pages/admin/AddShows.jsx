import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { CheckIcon, StarIcon } from "lucide-react";
import kConverter from "../../lib/kConverter";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const AddShows = () => {
  const { axios, getAuthHeaders, user, imageBaseURL } = useAppContext();

  const [movies, setMovies] = useState([]); // Admin movies (active)
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState("");
  const [selectedMovieIds, setSelectedMovieIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const fetchMovies = async () => {
    try {
      const { data } = await axios.get("/api/admin/movies/available", {
        headers: getAuthHeaders(),
      });
      if (data.success) setMovies(data.movies || []);
    } catch (error) {
      console.error("[fetchMovies]", error);
    }
  };

  const fetchTheatres = async () => {
    try {
      const { data } = await axios.get("/api/admin/theatres", {
        headers: getAuthHeaders(),
      });
      if (data.success) setTheatres(data.theatres || []);
    } catch (error) {
      console.error("[fetchTheatres]", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMovies();
      fetchTheatres();
    }
  }, [user]);

  const toggleMovieSelection = (movieId) => {
    setSelectedMovieIds((prev) => {
      const exists = prev.includes(movieId);
      if (exists) return prev.filter((id) => id !== movieId);
      return [...prev, movieId];
    });
  };

  const handleAssign = async () => {
    try {
      if (!selectedTheatre) return toast.error("Please select a theatre");
      if (selectedMovieIds.length === 0)
        return toast.error("Please select at least one movie to assign");

      setAssigning(true);

      const payload = {
        theatreId: selectedTheatre,
        movieIds: selectedMovieIds,
      };

      const { data } = await axios.post(
        `/api/admin/theatres/${selectedTheatre}/assign-movies`,
        payload,
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success(data.message || "Movies assigned to theatre");
        setSelectedMovieIds([]);
        // Refresh theatres to show updated assignments
        fetchTheatres();
      } else {
        toast.error(data.message || "Failed to assign movies");
      }
    } catch (error) {
      console.error("[handleAssign]", error);
      toast.error("An error occurred while assigning movies");
    }

    setAssigning(false);
  };

  if (!user) return <Loading />;

  return (
    <>
      <Title text1="Assign" text2="Movies to Theatres" />

      <div className="mt-6">
        <label className="block text-sm font-medium mb-2 text-white/80">Select Theatre</label>
        <select
          value={selectedTheatre}
          onChange={(e) => setSelectedTheatre(e.target.value)}
          className="w-full border border-gray-600 px-3 py-2 rounded-md bg-black/40 text-white transition-all duration-200 hover:bg-black/30 focus:outline-none focus:border-primary/80"
          title="Choose a theatre to assign movies to"
        >
          <option value="" className="bg-black/40">-- Select Theatre --</option>
          {theatres.map((t) => (
            <option key={t._id || t.id} value={t._id || t.id} className="bg-black/40">
              {t.name || t.name}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-8 text-xl font-medium">Available Movies (Select multiple)</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {movies.map((movie) => {
            const id = movie._id || movie.id;
            const selected = selectedMovieIds.includes(id);
            return (
              <div
                onClick={() => toggleMovieSelection(id)}
                key={id}
                className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`}
              >
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imageBaseURL + movie.poster_path}
                    alt={movie.title}
                    className="w-full object-cover brightness-90"
                  />
                  <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                    <p className="flex items-center gap-1 text-gray-400">
                      <StarIcon className="w-4 h-4 text-primary fill-primary" />
                      {(movie.vote_average || 0).toFixed(1)}
                    </p>
                    <p className="text-gray-300">
                      {kConverter(movie.vote_count || 0)} Votes
                    </p>
                  </div>
                </div>

                {selected && (
                  <div className="absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded">
                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                )}

                <p className="font-medium truncate" style={{ maxWidth: 160 }}>
                  {movie.title}
                </p>
                <p className="text-gray-400 text-sm">{movie.release_date ? new Date(movie.release_date).toLocaleDateString() : "N/A"}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleAssign}
          disabled={assigning}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 transition-all cursor-pointer active:scale-99"
        >
          Assign Selected Movies
        </button>
      </div>
    </>
  );
};

export default AddShows;
