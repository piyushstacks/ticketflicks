import React from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext.jsx";
import toast from "react-hot-toast";

const Footer = () => {
  const { user } = useAppContext();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <footer className={`px-6 pt-8 md:px-16 lg:px-36 mt-40 w-full ${
      isDark ? 'text-gray-300' : 'text-gray-700 bg-gray-50'
    }`}>
      <div className={`flex flex-col md:flex-row justify-between w-full gap-10 border-b pb-14 ${
        isDark ? 'border-gray-500' : 'border-gray-300'
      }`}>
        <div className="md:max-w-96">
          <img 
            className={`w-36 h-auto transition-all duration-300 ${
              isDark ? '' : 'filter brightness-0 contrast-100'
            }`} 
            src={assets.logo} 
            alt="logo" 
          />
          <p className="mt-6 text-sm">
            TicketFlicks is an online movie ticket booking platform.
            <br />
            <span>
              {" "}
              Created By{" "}
              <span className="font-bold underline">
                Team Group 20 - SXCA
              </span>
            </span>{" "}
          </p>
          {/* <div className="flex items-center gap-2 mt-4">
            <img
              src={assets.googlePlay}
              alt="google play"
              className="h-9 w-auto"
            />
            <img src={assets.appStore} alt="app store" className="h-9 w-auto" />
          </div> */}
        </div>
        <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
          <div>
            <h2 className={`font-semibold mb-5 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Company</h2>
            <ul className="text-sm space-y-2">
              <li>
                <Link
                  onClick={() => {
                    scrollTo(0, 0);
                  }}
                  to="/"
                  className={isDark ? '' : 'text-gray-700 hover:text-primary'}
                >
                  Home
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (user) {
                      scrollTo(0, 0);
                      navigate("/feedback");
                    } else {
                      toast.error("You need to login/signup first");
                    }
                  }}
                  className={`cursor-pointer whitespace-nowrap ${
                    isDark ? '' : 'text-gray-700 hover:text-primary'
                  }`}
                >
                  <span className="max-md:hidden">Give</span> Feedback
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h2 className={`font-semibold mb-5 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>Get in touch</h2>
            <div className="text-sm space-y-2">
              <p className={isDark ? '' : 'text-gray-700'}>+91 9724176300 </p>
              <a
                href="mailto:ticketflicks@gmail.com"
                className="text-primary underline"
              >
                ticketflicks@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
      <p className={`pt-4 text-center text-sm pb-5 ${
        isDark ? '' : 'text-gray-600'
      }`}>
        Copyright {new Date().getFullYear()} © TicketFlicks. All Right Reserved.
      </p>
    </footer>
  );
};

export default Footer;
