import { Icon } from "@iconify/react";
import React from "react";
import { Link } from "react-router-dom";

const Homepage = () => {
  return (
    <div className="w-full" id="homepage">
      <section
        className="w-full lg:h-screen relative flex justify-between px-48 txt-light"
        id="home-hero"
      >
        <div className="hero-left flex flex-col justify-center">
          <div className="hero-heading-container w-full mb-6">
            <h1 className="hero-heading text-6xl head-font flex flex-col gap-1">
              <div>
                <div>Crafted in Silence.</div>
              </div>
              <div>
                <div>Felt in Every Detail.</div>
              </div>
            </h1>
          </div>

          <div className="hero-subheading w-[50ch] mb-6">
            Handcrafted pottery designed to bring warmth, texture, and timeless
            elegance into your space.
          </div>

          <div className="hero-button uppercase">
            <Link
              className="w-48 flex items-center justify-center py-4 rounded bg-(--accent) hover:bg-(--dimaccent) transition-all duration-500"
              to="/shop"
            >
              {/* <span className="inline-flex py-6 w-1.5 border-y border-l rounded-[1.5px]"></span> */}
              <span className="flex items-center gap-1 text-[0.7rem] tracking-wider">explore now <Icon className="text-sm" icon="iconamoon:arrow-right-1" /> </span>
              {/* <span className="inline-flex py-6 w-1.5 border-y border-r rounded-[1.5px]"></span> */}
            </Link>
          </div>
        </div>

        <div className="hero-right flex flex-col items-end justify-end mb-5">
          <h2 className="uppercase mb-1 text-[0.7rem] tracking-wider">Exclusive of this month.</h2>
          <div className="hero-product-wrapper flex flex-col items-end justify-end backdrop-blur-5xl bg-[linear-gradient(90deg,rgba(248,248,248,0.15)_0%,rgba(170,170,170,0.10)_50%,rgba(0,0,0,0.05)_100%)] rounded-md p-[1px]">
            <Link
              to="/"
              className="hero-product w-96 p-5 backdrop-blur-3xl rounded-md"
            >
              <div
                className="w-full aspect-square rounded-md overflow-hidden"
                id="hero-product-img"
              >
                <img
                  className="w-full object-cover"
                  src="/hero_product.png"
                  alt="hero-product"
                />
              </div>
              <div className="hero-prod-desc mt-3">
                <div className="product-category uppercase text-[0.7rem] tracking-wider">
                  Decorative Base
                </div>
                <div className="hero-prod-heading flex justify-between items-center">
                  <h2 className="product-name text-2xl head-font">
                    Alpha Product
                  </h2>
                  <div className="hero-prod-rating h-fit flex gap-1">
                    <span className="inline-flex py-2 w-1 border-y border-l rounded-[1.5px]"></span>
                    <div className="flex items-center gap-1 text-xs leading-none">
                      <Icon icon="iconamoon:star-fill" />
                      <span>4.8</span>
                    </div>
                    <span className="inline-flex py-2 w-1 border-y border-r rounded-[1.5px]"></span>
                  </div>
                </div>
                <div className="hero-prod-price px-10 py-3 border w-fit mt-5">
                  ₹ 140.00
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Homepage;
