import React from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

const Footer = () => {
  const { user } = useAppContext();
  const navigate = useNavigate();

  return (
    <footer
      className="mt-24 w-full"
      style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }}
    >
      <div className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="md:max-w-sm">
            <img
              className="w-32 h-auto dark:invert-0"
              src={assets.logo}
              alt="TicketFlicks"
              style={{ filter: "var(--logo-filter, none)" }}
            />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              TicketFlicks is an online movie ticket booking platform.
              <br />
              Created by{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                Team Group 20 - SXCA
              </span>
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16 md:gap-24">
            <div>
              <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
                Company
              </h3>
              <ul className="text-sm flex flex-col gap-2.5">
                <li>
                  <Link
                    onClick={() => scrollTo(0, 0)}
                    to="/"
                    className="transition-colors duration-200 hover:text-accent"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    onClick={() => scrollTo(0, 0)}
                    to="/movies"
                    className="transition-colors duration-200 hover:text-accent"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Movies
                  </Link>
                </li>
                <li>
                  <Link
                    onClick={() => scrollTo(0, 0)}
                    to="/theatres"
                    className="transition-colors duration-200 hover:text-accent"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Theatres
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
                    className="cursor-pointer transition-colors duration-200 hover:text-accent"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Feedback
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>
                Contact
              </h3>
              <div className="text-sm flex flex-col gap-2.5">
                <p style={{ color: "var(--text-secondary)" }}>+91 9724176300</p>
                <a
                  href="mailto:ticketflicks@gmail.com"
                  className="text-accent hover:underline"
                >
                  ticketflicks@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-4 sm:px-6 md:px-12 lg:px-20 xl:px-36 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
          Copyright {new Date().getFullYear()} TicketFlicks. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
