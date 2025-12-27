import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import { dummyBookingData } from "../../assets/assets";
import Title from "../../components/admin/Title";
import { useAppContext } from "../../context/AppContext";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  useEffect(() => {
    const initializeBookings = () => {
      try {
        setBookings(dummyBookingData);
      } catch (error) {
        console.log("Error initializing dummy bookings:", error);
        setBookings([]);
      }
    };

    initializeBookings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("api/admin/all-bookings", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        // Ensure data.bookings is an array, fallback to dummy data if not
        if (Array.isArray(data?.bookings)) {
          setBookings(data.bookings);
        } else {
          console.log("Invalid bookings data format, using dummy data");
          setBookings(dummyBookingData);
        }
      } catch (error) {
        console.log("Error fetching bookings, using dummy data:", error);
        // Keep dummy data already set in state
        setBookings(dummyBookingData);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Bookings" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Theater</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
              <th className="p-2 font-medium text-center">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {Array.isArray(bookings) && bookings.length > 0 ? (
              bookings.map((item, index) => {
                // Handle both array and object formats for bookedSeats
                let seatsDisplay = "";
                if (Array.isArray(item.bookedSeats)) {
                  seatsDisplay = item.bookedSeats.join(", ");
                } else if (typeof item.bookedSeats === "object" && item.bookedSeats !== null) {
                  seatsDisplay = Object.keys(item.bookedSeats)
                    .map((seat) => item.bookedSeats[seat])
                    .join(", ");
                }

                const isExpanded = expandedBookingId === item._id;

                return (
                  <React.Fragment key={index}>
                    <tr className="border-b border-primary/20 bg-primary/5 even:bg-primary/10">
                      <td className="p-2 min-w-45 pl-5">{item.user?.name || "N/A"}</td>
                      <td className="p-2">{item.show?.movie?.title || "N/A"}</td>
                      <td className="p-2">{item.show?.showDateTime || "N/A"}</td>
                      <td className="p-2">{item.show?.theater?.name || "N/A"}</td>
                      <td className="p-2">{seatsDisplay}</td>
                      <td className="p-2">
                        {currency} {item.amount || "0"}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() =>
                            setExpandedBookingId(
                              isExpanded ? null : item._id
                            )
                          }
                          className="inline-flex items-center justify-center p-1 hover:bg-primary/20 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && item.show?.theater && (
                      <tr className="bg-primary/10 border-b border-primary/20">
                        <td colSpan="7" className="p-4">
                          <div className="bg-primary/5 rounded-lg p-4">
                            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                              <MapPin size={16} />
                              Theater Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-400">Theater Name</p>
                                <p className="text-white font-medium">
                                  {item.show.theater.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Location</p>
                                <p className="text-white font-medium">
                                  {item.show.theater.location}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Distance</p>
                                <p className="text-white font-medium">
                                  {item.show.theater.distance}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  No bookings found
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

export default ListBookings;
