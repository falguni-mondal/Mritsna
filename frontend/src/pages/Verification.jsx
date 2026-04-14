import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Verification = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  
  // ==========================================
  // STATES
  // ==========================================
  // OTP State
  const [code, setCode] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // NEW: Email Modal States
  const [displayedEmail, setDisplayedEmail] = useState("your@email.com"); // Mock initial email
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");

  // ==========================================
  // ANIMATIONS & TIMERS
  // ==========================================
  useGSAP(() => {
    gsap.fromTo(
      ".auth-anim",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", delay: 0.2 }
    );
  }, { scope: containerRef });

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // ==========================================
  // OTP LOGIC
  // ==========================================
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newCode = [...code];
    newCode[index] = element.value;
    setCode(newCode);

    // Auto-advance
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Auto-revert on backspace
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.some(char => isNaN(char))) return;

    const newCode = [...code];
    pastedData.forEach((char, i) => {
      newCode[i] = char;
      if (inputRefs.current[i]) {
        inputRefs.current[i].value = char;
      }
    });
    setCode(newCode);
    
    const focusIndex = pastedData.length < 6 ? pastedData.length : 5;
    inputRefs.current[focusIndex].focus();
  };

  // ==========================================
  // SUBMIT & UPDATE LOGIC
  // ==========================================
  const handleResend = () => {
    // FUTURE REDUX: dispatch(resendVerificationEmail(displayedEmail));
    setTimeLeft(60);
    setCanResend(false);
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    const verificationCode = code.join("");
    
    if (verificationCode.length === 6) {
      // FUTURE REDUX: dispatch(verifyEmail(verificationCode));
      console.log("Verifying code:", verificationCode);
      navigate("/account"); 
    }
  };

  // THE FIX: In-Place Modal Submit Logic
  const handleNewEmailSubmit = (e) => {
    e.preventDefault();
    if (!newEmailInput) return;

    // 1. FUTURE REDUX: dispatch(updateGhostAccountEmail({ newEmail: newEmailInput }))
    
    // 2. Update local UI state
    setDisplayedEmail(newEmailInput);
    
    // 3. Reset the verification environment
    setCode(new Array(6).fill(""));
    setTimeLeft(60);
    setCanResend(false);
    setNewEmailInput("");
    setIsModalOpen(false);
  };

  // Format timer as 0:00
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] flex items-center justify-center pt-[100px] pb-20 px-6 relative">
        <div className="w-full max-w-[400px] flex flex-col">
          
          <div className="mb-12 text-center">
            <h1 className="auth-anim head-font text-4xl lg:text-5xl tracking-wide mb-4">Verify</h1>
            <p className="auth-anim text-sm font-light opacity-60 tracking-widest uppercase leading-relaxed">
              Enter the 6-digit code sent to<br />
              <span className="font-bold opacity-100 text-[#1a1a1a] tracking-normal lowercase">{displayedEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-10 w-full">
            
            <div className="auth-anim flex justify-between gap-2 sm:gap-4" onPaste={handlePaste}>
              {code.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp"
                  maxLength="1"
                  ref={(el) => (inputRefs.current[index] = el)}
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 sm:w-14 sm:h-16 bg-transparent border-b border-black/20 text-center text-2xl font-light focus:outline-none focus:border-black transition-colors"
                  autoComplete="off"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={code.join("").length !== 6}
              className="auth-anim mt-2 w-full bg-[#1a1a1a] text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
          </form>

          <div className="auth-anim mt-12 text-center border-t border-black/10 pt-8">
            {canResend ? (
              <button 
                onClick={handleResend}
                className="inline-block border-b border-black text-[0.65rem] font-bold tracking-[0.2em] uppercase pb-1 hover:opacity-60 transition-opacity"
              >
                Resend Code
              </button>
            ) : (
              <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-50">
                Resend code in <span className="opacity-100 text-black ml-1">{formatTime(timeLeft)}</span>
              </p>
            )}
            
            <div className="mt-8">
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[0.55rem] tracking-[0.1em] uppercase opacity-40 hover:opacity-100 transition-opacity"
              >
                Change Email Address
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================= */}
      {/* UPDATE EMAIL MODAL OVERLAY */}
      {/* ========================================= */}
      <div 
        className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 transition-all duration-300
          ${isModalOpen ? "opacity-100 pointer-events-auto backdrop-blur-sm bg-black/40" : "opacity-0 pointer-events-none bg-black/0"}
        `}
      >
        <div 
          className={`bg-white w-full max-w-[400px] p-8 lg:p-10 shadow-2xl relative transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
            ${isModalOpen ? "translate-y-0 scale-100" : "translate-y-8 scale-95"}
          `}
        >
          {/* Close Button */}
          <button 
            onClick={() => setIsModalOpen(false)}
            className="absolute top-6 right-6 text-xl opacity-40 hover:opacity-100 transition-opacity"
          >
            <Icon icon="ph:x-light" />
          </button>

          <h2 className="head-font text-3xl mb-2">Update Email</h2>
          <p className="text-xs font-light opacity-60 uppercase tracking-widest mb-10">
            We will send a new code to this address.
          </p>

          <form onSubmit={handleNewEmailSubmit} className="flex flex-col gap-8 w-full">
            <div className="relative flex flex-col">
              <label className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">New Email Address</label>
              <input 
                type="email" 
                required
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="w-full bg-transparent border-b border-black/20 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                placeholder={displayedEmail}
              />
            </div>

            <button 
              type="submit" 
              className="mt-2 w-full bg-[#1a1a1a] text-white py-4 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors"
            >
              Request New Code
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Verification;