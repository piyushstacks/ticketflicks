import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { StarIcon } from "lucide-react";
import { dummyFeedbackData } from "../../assets/assets";

const Feedbacks = () => {
  const { axios, getToken, user } = useAppContext();

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeFeedbacks = () => {
      try {
        setFeedbacks(dummyFeedbackData);
      } catch (error) {
        console.log("Error initializing dummy feedbacks:", error);
        setFeedbacks([]);
      }
    };

    initializeFeedbacks();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/admin/all-feedbacks", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        if (data.success) {
          setFeedbacks(data.feedbacks);
        } else {
          console.error("Failed to fetch feedbacks:", data.message);
        }
      } catch (error) {
        console.log("Error fetching feedbacks, using dummy data:", error);
        // Keep dummy data already set in state
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Feedbacks" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Username</th>
              <th className="p-2 font-medium">Message</th>
              <th className="p-2 font-medium">Rating</th>
              <th className="p-2 font-medium">Rated On</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {feedbacks.map((feedback, index) => (
              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5">{feedback.user?.name || "N/A"}</td>
                <td className="p-2">{feedback.message || "N/A"}</td>
                <td className="p-2 flex">
                  {[...Array(5)].map((_, index) => (
                    <StarIcon
                      key={index}
                      className={
                        index < (feedback.rating || 0)
                          ? "text-yellow-500 fill-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </td>
                <td className="p-2">
                  {feedback.createdAt ? new Date(feedback.createdAt).toLocaleString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default Feedbacks;
