import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navmenu from "./Navmenu";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Refs for Animations
  const navbarRef = useRef(null);
  const navContainerRef = useRef(null);
  const underlineRef = useRef(null);
  const isHovering = useRef(false);

  const navigations = [
    { name: "shop", path: "/shop" },
    { name: "collection", path: "/collection" },
    { name: "about", path: "/about" },
    { name: "contact us", path: "/contact" },
  ];

  const serviceNavs = [
    { name: "account", path: "/account" },
    { name: "cart", path: "/cart" },
    { name: "wishlist", path: "/wishlist" },
  ];

  // --- 1. Initial Load Animation ---
  useGSAP(() => {
    // Hide navbar above the screen initially
    gsap.set(navbarRef.current, { yPercent: -30, opacity: 0 });

    // Slide down just as the Hero animation finishes
    gsap.to(navbarRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      delay: 0.8, // Timed perfectly to overlap the end of the Hero timeline
    });
  }, { scope: navbarRef });

  // --- 2. Magic Line Hover Animation ---
  const { contextSafe } = useGSAP({ scope: navContainerRef });

  const handleItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;

    // If it's a fresh entry (or quick re-entry), instantly snap to the left edge
    if (!isHovering.current) {
      gsap.set(underlineRef.current, { left: 0, width: 0 });
      isHovering.current = true;
    }

    // Slide to the hovered item.
    gsap.to(underlineRef.current, {
      left: targetLeft,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true, 
    });
  });

  const handleNavLeave = contextSafe(() => {
    isHovering.current = false;
    const containerWidth = navContainerRef.current.offsetWidth;

    // Shoot off to the far right, shrink to 0, and fade out
    gsap.to(underlineRef.current, {
      left: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  return (
    <div ref={navbarRef} className="navbar w-full fixed top-0 left-0 z-[99999]">
      <div
        className="w-full py-4 px-6 lg:px-10 flex justify-between items-center txt-light"
        id="navbar-content"
      >
        {/* Desktop Left Navigation */}
        <nav className="w-1/3 hidden lg:block" id="desktop-first-nav">
          <ul 
            ref={navContainerRef}
            onMouseLeave={handleNavLeave}
            className="nav-list flex items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
          >
            {/* The Animated Magic Underline */}
            <li
              ref={underlineRef}
              className="absolute -bottom-2 h-[1px] bg-light opacity-0 pointer-events-none"
              style={{ left: 0, width: 0 }}
            />

            {navigations.map(({ name, path }) => (
              <li 
                key={`${name}-desk-nav`} 
                className="nav-list-item"
                onMouseEnter={handleItemEnter}
              >
                <Link 
                  to={path}
                  className="hover:opacity-70 transition-opacity duration-300 py-1"
                >
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logo */}
        <div className="logo lg:w-1/3 flex justify-start lg:justify-center items-center">
          <Link to="/">
            <img className="w-20 lg:w-36" src="/logo_white.svg" alt="Mritsna Logo" />
          </Link>
        </div>

        {/* Desktop Right Navigation */}
        <nav className="w-1/3 hidden lg:block" id="desktop-second-nav">
          <ul className="nav-list flex justify-end items-center gap-10 uppercase text-[0.7rem] tracking-wider">
            <li className="nav-list-item brac-elem flex justify-center gap-1 cursor-pointer hover:opacity-70 transition-opacity duration-300">
              <span className="inline-flex w-1 border-y border-l border-[rgba(248,248,248,0.4)] rounded-[1px]"></span>
              <span>search</span>
              <span className="inline-flex w-1 border-y border-r border-[rgba(248,248,248,0.4)] rounded-[1px]"></span>
            </li>
            {serviceNavs.map(({ name, path }) => (
              <li key={`${name}-desk-nav`} className="nav-list-item">
                <Link 
                  className="brac-elem flex justify-center gap-1 hover:opacity-70 transition-opacity duration-300" 
                  to={path}
                >
                  <span className="inline-flex w-1 border-y border-l border-[rgba(248,248,248,0.4)] rounded-[1px]"></span>
                  {name}
                  <span className="inline-flex w-1 border-y border-r border-[rgba(248,248,248,0.4)] rounded-[1px]"></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile Right Section: Search + Hamburger */}
        <div className="flex items-center gap-5 lg:hidden">
          {/* Mobile Search Icon */}
          <div className="cursor-pointer text-xl flex items-center justify-center hover:opacity-70 transition-opacity duration-300">
            <Icon icon="iconamoon:search" />
          </div>

          {/* Hamburger Nav Icon */}
          <div
            onClick={() => setIsOpen((prev) => !prev)}
            className="nav-icon w-7 h-2 flex flex-col justify-between cursor-pointer"
          >
            <span
              className="block h-[1.5px] bg-light transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]"
            />
            <span
              className="block h-[1.5px] bg-light transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)]"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      <Navmenu isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
};

export default Navbar;