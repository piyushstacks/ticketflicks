import React from "react";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";
import TrailersSection from "../components/TrailersSection";
import UpcomingFeaturedSection from "../components/UpcomingFeaturedSection";

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <TrailersSection />
      <UpcomingFeaturedSection />
    </>
  );
};

export default Home;
