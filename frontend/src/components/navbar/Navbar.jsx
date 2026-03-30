import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigations = [
    {
      name: "shop",
      path: "/shop",
    },
    {
      name: "collection",
      path: "/collection",
    },
    {
      name: "about",
      path: "/about",
    },
    {
      name: "contact us",
      path: "/contact",
    },
  ];
  const services = [
    {
      name: "cart",
      path: "/account/cart",
      icon: "iconamoon:shopping-bag-light",
    },
    {
      name: "account",
      path: "/account",
      icon: "iconamoon:profile-light",
    },
  ];
  const serviceNavs = [
    {
      name: "account",
      path: "/account",
    },
    {
      name: "cart",
      path: "/cart",
    },
    {
      name: "wishlist",
      path: "/wishlist",
    },
  ];

  return (
    <div className="navbar w-full py-3 px-3 lg:px-10 flex justify-between items-center txt-light fixed top-0 left-0 z-999999999">
      <nav className="w-1/3 hidden lg:block" id="desktop-first-nav">
        <ul className="nav-list flex items-center gap-10 uppercase text-[0.7rem]">
          {navigations.map(({ name, path }) => (
            <li key={`${name}-desk-nav`} className="nav-list-item">
              <Link to={path}>{name}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="logo lg:w-1/3 flex justify-center items-center">
        <Link to="/">
          <img className="w-20 lg:w-36" src="/logo_white.svg" alt="" />
        </Link>
      </div>

      {/* <div
                className="w-1/3 flex justify-end items-center gap-6 text-[1.4rem]"
                id="services-nav"
            >
                <span>
                    <Icon className="text-[1.3rem]" icon="iconamoon:search" />
                </span>
                {services.map(({ name, icon, path }) => (
                    <Link to={path} key={`${name}-desk-service-icon`}>
                        <Icon icon={icon} />
                    </Link>
                ))}
            </div> */}

      <nav className="w-1/3 hidden lg:block" id="desktop-second-nav">
        <ul className="nav-list flex justify-end items-center gap-10 uppercase text-[0.7rem]">
          <li className="nav-list-item brac-elem flex justify-center gap-1 cursor-pointer">
            <span className="inline-flex w-1 border-y border-l rounded-[1px]"></span>
            <span>search</span>
            <span className="inline-flex w-1 border-y border-r rounded-[1px]"></span>
          </li>
          {serviceNavs.map(({ name, path }) => (
            <li key={`${name}-desk-nav`} className="nav-list-item">
              <Link className="brac-elem flex justify-center gap-1" to={path}>
                <span className="inline-flex w-1 border-y border-l rounded-[1px]"></span>
                {name}
                <span className="inline-flex w-1 border-y border-r rounded-[1px]"></span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="nav-icon lg:hidden flex justify-center items-center">
        <div
          onClick={() => setIsOpen(prev => !prev)}
          className="w-7 h-2 flex flex-col justify-between cursor-pointer"
        >
          <span
            className={`block h-[1.5px] bg-white/80 transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${
              isOpen ? "rotate-45 translate-y-[7px]" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] bg-white/80 transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] ${
              isOpen ? "-rotate-45 -translate-y-[7px]" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
