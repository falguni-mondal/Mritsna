import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Dashboard = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(
      ".dash-anim",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: "power2.out", delay: 0.1 }
    );
  }, { scope: containerRef });

  const handleLogout = () => {
    // FUTURE REDUX RTK DISPATCH:
    // dispatch(logoutUser());
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[120px] lg:pt-[160px] pb-20 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
        
        {/* ========================================= */}
        {/* SIDEBAR NAVIGATION */}
        {/* ========================================= */}
        <aside className="w-full lg:w-[250px] shrink-0 lg:sticky lg:top-[120px] h-fit">
          <h1 className="dash-anim head-font text-3xl mb-10">My Account</h1>
          
          <nav className="flex flex-col gap-6">
            <Link to="/account" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a] flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-100 origin-left transition-transform duration-300" />
              Overview
            </Link>
            
            <Link to="/account/orders" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              Order History
            </Link>
            
            <Link to="/account/addresses" className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group">
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              Address Book
            </Link>

            <button 
              onClick={handleLogout}
              className="dash-anim text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 hover:opacity-100 transition-opacity flex items-center gap-4 group mt-8 text-left"
            >
              <span className="w-2 h-[1px] bg-[#1a1a1a] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
              Log Out
            </button>
          </nav>
        </aside>

        {/* ========================================= */}
        {/* MAIN CONTENT AREA */}
        {/* ========================================= */}
        <section className="flex-1 flex flex-col gap-16">
          
          <div className="dash-anim border-b border-black/10 pb-8">
            <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-4">Account Details</h2>
            <p className="text-xl head-font">Welcome back.</p>
            <p className="text-sm font-light mt-2 opacity-80">user@example.com</p>
          </div>

          <div className="dash-anim">
            <div className="flex justify-between items-end border-b border-black/10 pb-4 mb-8">
              <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">Recent Orders</h2>
              <Link to="/account/orders" className="text-[0.55rem] tracking-[0.1em] uppercase hover:opacity-60 transition-opacity border-b border-black">
                View All
              </Link>
            </div>
            
            <div className="w-full flex items-center justify-center py-20 bg-[#eeeeee]/50 rounded-[2px]">
              <p className="text-sm font-light opacity-50">You haven't placed any orders yet.</p>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
};

export default Dashboard;