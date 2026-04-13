import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const SignIn = () => {
  const containerRef = useRef(null);
  const iconRef = useRef(null); 
  const [showPassword, setShowPassword] = useState(false);

  useGSAP(() => {
    gsap.fromTo(
      ".auth-anim",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    
    // Quick 360-degree GSAP flip on the native span wrapper
    gsap.fromTo(iconRef.current, 
      { rotationY: 0 }, 
      { rotationY: 180, duration: 0.4, ease: "power2.inOut", clearProps: "all" }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // FUTURE REDUX RTK DISPATCH
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] flex items-center justify-center pt-[100px] pb-20 px-6">
      <div className="w-full max-w-[400px] flex flex-col">
        
        <div className="mb-12 text-center">
          <h1 className="auth-anim head-font text-4xl lg:text-5xl tracking-wide mb-4">Sign In</h1>
          <p className="auth-anim text-sm font-light opacity-60 tracking-widest uppercase">
            Access your curated selection
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
          <div className="auth-anim relative flex flex-col">
            <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="auth-anim relative flex flex-col">
            <div className="flex justify-between items-end mb-2">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50">Password</label>
              <Link to="/account/recover" className="text-[0.55rem] tracking-[0.1em] uppercase opacity-40 hover:opacity-100 transition-opacity">
                Forgot?
              </Link>
            </div>
            
            <div className="relative w-full">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-transparent border-b border-black/20 py-3 pr-12 text-sm focus:outline-none focus:border-black transition-colors"
              />
              
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 text-black opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                {/* THE FIX: Reverted to Iconify but kept the span wrapper for GSAP */}
                <span ref={iconRef} className="flex items-center justify-center text-lg">
                  <Icon icon={showPassword ? "ph:eye-slash-light" : "ph:eye-light"} />
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-anim mt-4 w-full bg-[#1a1a1a] text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="auth-anim mt-12 text-center border-t border-black/10 pt-8">
          <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-50 mb-4">
            Don't have an account?
          </p>
          <Link 
            to="/account/signup" 
            className="inline-block border-b border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 hover:opacity-60 transition-opacity"
          >
            Create Account
          </Link>
        </div>

      </div>
    </main>
  );
};

export default SignIn;