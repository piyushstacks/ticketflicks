import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import dateFormat from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import { dummyShowsData, dummyDashboardData } from "../../assets/assets";

const ListShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const { axios, getToken, user } = useAppContext();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeShows = () => {
      try {
        const dummyShows = dummyDashboardData.activeShows.map((show) => ({
          ...show,
          movie: show.movie || dummyShowsData[0],
        }));
        setShows(dummyShows);
      } catch (error) {
        console.log("Error initializing dummy shows:", error);
        setShows([]);
      }
    };

    initializeShows();
  }, []);

  useEffect(() => {
    const initializeShows = () => {
      try {
        const dummyShows = dummyDashboardData.activeShows.map((show) => ({
          ...show,
          movie: show.movie || dummyShowsData[0],
        }));
        setShows(dummyShows);
      } catch (error) {
        console.log("Error initializing dummy shows:", error);
        setShows([]);
      }
    };

    initializeShows();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("api/admin/all-shows", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        // Ensure data.shows is an array, fallback to dummy data if not
        if (Array.isArray(data?.shows)) {
          setShows(data.shows);
        } else {
          console.log("Invalid shows data format, using dummy data");
          const dummyShows = dummyDashboardData.activeShows.map((show) => ({
            ...show,
            movie: show.movie || dummyShowsData[0],
          }));
          setShows(dummyShows);
        }
      } catch (error) {
        console.log("Error fetching shows, using dummy data:", error);
        // Fallback to dummy data on error
        const dummyShows = dummyDashboardData.activeShows.map((show) => ({
          ...show,
          movie: show.movie || dummyShowsData[0],
        }));
        setShows(dummyShows);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Total Bookings</th>
              <th className="p-2 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {Array.isArray(shows) && shows.length > 0 ? (
              shows.map((show, index) => (
                <tr
                  key={index}
                  className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
                >
                  <td className="p-2 min-w-45 pl-5">{show.movie?.title || "N/A"}</td>
                  <td className="p-2">{dateFormat(show.showDateTime || new Date())}</td>
                  <td className="p-2">
                    {Object.keys(show.occupiedSeats || {}).length}
                  </td>
                  <td className="p-2">
                    {currency}{" "}
                    {(Object.keys(show.occupiedSeats || {}).length * (show.showPrice || 0)).toFixed(0)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No shows found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListShows;
