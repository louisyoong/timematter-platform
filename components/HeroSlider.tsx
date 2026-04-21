import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const banners = [
  {
    image: "/images/banner-1.jpg",
    title: "Connecting Hearts Across Generations",
    subtitle:
      "Find meaningful activities and build lasting friendships within your community.",
  },
  {
    image: "/images/banner-2.jpg",
    title: "Wellness Workshops for Active Living",
    subtitle:
      "Join our physical and mental health programs designed specifically for seniors.",
  },
  {
    image: "/images/banner-3.jpg",
    title: "Share Your Wisdom, Learn New Skills",
    subtitle:
      "From technology basics to traditional crafts, there is always something new to explore.",
  },
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[400px] md:h-[600px] overflow-hidden group">
      {banners.map((banner, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
            idx === current
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-10"
          }`}
        >
          <div className="absolute inset-0 bg-black/40 z-10"></div>
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg max-w-4xl">
              {banner.title}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl drop-shadow-md">
              {banner.subtitle}
            </p>
            <a
              href="#/find-events"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold transition-all transform hover:scale-105 shadow-xl"
            >
              Explore Events
            </a>
          </div>
        </div>
      ))}

      <button
        onClick={() =>
          setCurrent((current - 1 + banners.length) % banners.length)
        }
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={30} />
      </button>
      <button
        onClick={() => setCurrent((current + 1) % banners.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={30} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === current ? "bg-emerald-500 w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
