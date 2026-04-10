import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navmenu from "./Navmenu";

// Register the plugin
gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Refs for Animations & Structure
  const navbarRef = useRef(null);
  
  // Left Nav Refs
  const navContainerRef = useRef(null);
  const underlineRef = useRef(null);
  const isHovering = useRef(false);

  // Right Nav Refs
  const rightNavContainerRef = useRef(null);
  const rightUnderlineRef = useRef(null);
  const isRightHovering = useRef(false);

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

  // --- 1. Initial Load Animation & Scroll Blend ---
  const { contextSafe } = useGSAP(() => {
    gsap.set(navbarRef.current, { yPercent: -30, opacity: 0 });

    gsap.to(navbarRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      delay: 2.4, 
    });

    ScrollTrigger.create({
      start: () => window.innerHeight * 0.9, 
      onEnter: () => navbarRef.current?.classList.add("mix-blend-difference"),
      onLeaveBack: () => navbarRef.current?.classList.remove("mix-blend-difference"),
      invalidateOnRefresh: true, 
    });
  }, { scope: navbarRef });

  // --- 2. Left Nav Hover Animation ---
  const handleItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;

    if (!isHovering.current) {
      gsap.set(underlineRef.current, { left: 0, width: 0 });
      isHovering.current = true;
    }

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

    gsap.to(underlineRef.current, {
      left: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  // --- 3. Right Nav Hover Animation ---
  const handleRightItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const containerWidth = rightNavContainerRef.current.offsetWidth;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;
    
    const targetRight = containerWidth - (targetLeft + targetWidth);

    if (!isRightHovering.current) {
      gsap.set(rightUnderlineRef.current, { right: 0, left: "auto", width: 0 });
      isRightHovering.current = true;
    }

    gsap.to(rightUnderlineRef.current, {
      right: targetRight,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true, 
    });
  });

  const handleRightNavLeave = contextSafe(() => {
    isRightHovering.current = false;
    const containerWidth = rightNavContainerRef.current.offsetWidth;

    gsap.to(rightUnderlineRef.current, {
      right: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  // NOTE: Wrapped the return in a Fragment <> so Navmenu sits outside the blended navbarRef
  return (
    <>
      <div ref={navbarRef} className="navbar w-full fixed top-0 left-0 z-[99999] transition-colors">
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
              <li
                ref={underlineRef}
                className="absolute -bottom-1 h-px bg-light opacity-0 pointer-events-none"
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
                    className="hover:opacity-70 transition-opacity duration-300 py-1 inline-block"
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
              <img className="w-22 lg:w-36" src="/logo_white.svg" alt="Mritsna Logo" />
            </Link>
          </div>

          {/* Desktop Right Navigation */}
          <nav className="w-1/3 hidden lg:block" id="desktop-second-nav">
            <ul 
              ref={rightNavContainerRef}
              onMouseLeave={handleRightNavLeave}
              className="nav-list flex justify-end items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
            >
              <li
                ref={rightUnderlineRef}
                className="absolute -bottom-1 h-px bg-light opacity-0 pointer-events-none"
                style={{ right: 0, width: 0 }}
              />

              <li 
                className="nav-list-item"
                onMouseEnter={handleRightItemEnter}
              >
                <span className="cursor-pointer hover:opacity-70 transition-opacity duration-300 py-1 inline-block">
                  search
                </span>
              </li>
              
              {serviceNavs.map(({ name, path }) => (
                <li 
                  key={`${name}-desk-nav`} 
                  className="nav-list-item"
                  onMouseEnter={handleRightItemEnter}
                >
                  <Link 
                    className="hover:opacity-70 transition-opacity duration-300 py-1 inline-block" 
                    to={path}
                  >
                    {name}
                    {name === "cart" && (
                      <span className="ml-1 tracking-widest font-medium opacity-80">
                        [{cartCount}]
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Right Section: Search + Hamburger */}
          <div className="flex items-center gap-5 lg:hidden">
            <div className="cursor-pointer text-xl flex items-center justify-center hover:opacity-70 transition-opacity duration-300">
              <Icon icon="iconamoon:search" />
            </div>

            <div
              onClick={() => setIsOpen((prev) => !prev)}
              className="nav-icon w-7 h-2 flex flex-col justify-between cursor-pointer"
            >
              <span
                className={`block h-[1.5px] bg-light transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${isOpen ? "rotate-45 translate-y-[3px]" : ""}`}
              />
              <span
                className={`block h-[1.5px] bg-light transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${isOpen ? "-rotate-45 -translate-y-[3px]" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Overlay is now outside the blended parent! */}
      <Navmenu isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default Navbar;