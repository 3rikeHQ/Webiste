import { useState } from "react";
import { subscribeWaitlist } from "@/lib/api";

const WAITLIST_KEY = "3rike.waitlist";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Hero = () => {
  const [joined, setJoined] = useState<string | null>(() => {
    try {
      return localStorage.getItem(WAITLIST_KEY);
    } catch {
      return null;
    }
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await subscribeWaitlist(value);
    } catch {
      // backend may be unavailable; still record locally below
    }
    try {
      localStorage.setItem(WAITLIST_KEY, value);
    } catch {
      // ignore storage failures
    }
    setJoined(value);
    setLoading(false);
  };

  return (
    <div className="flex flex-col text-center justify-center items-center pt-28 md:pt-48 pb-12 md:pb-20 px-4">
      <span
        className="border border-[#E2F490] bg-white rounded-full px-4 md:px-6 py-2 text-[#666666] text-sm md:text-md mb-6 md:mb-10 animate-[fade-in_0.6s_ease-out_0.2s_both]"
      >
        Sustainable and Inclusive Finance
      </span>

      <div>
        <h1 className="text-[48px] sm:text-[72px] md:text-[90px] lg:text-[110px] leading-[1.05] font-semibold text-[#1A1A1A] tracking-tight font-hepta space-y-2 md:space-y-6">
          <div className="animate-[fade-in_0.8s_ease-out_0.4s_both]">
            Own the <span className="text-[#829E04]">Ride</span>
          </div>
          <div className="animate-[fade-in_0.8s_ease-out_0.6s_both]">
            Power the <span className="text-[#829E04]">Future</span>
          </div>
        </h1>

        <p className="text-[#666666] text-base md:text-lg max-w-2xl mx-auto mt-6 md:mt-10 leading-relaxed px-0 md:px-2 animate-[fade-in_0.8s_ease-out_0.8s_both]">
          Helping Africa's mobility workers own electric vehicles and build financial identity, while offering investors predictable yields from real-world, green assets.
        </p>

        {joined ? (
          <div className="mt-8 md:mt-10 text-[#829E04] text-base md:text-lg font-medium animate-[fade-in_0.8s_ease-out_1s_both]">
            You're on the waitlist! We'll be in touch soon.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mx-auto mt-8 md:mt-10 flex flex-col sm:flex-row w-full max-w-2xl border border-[#E2F490] rounded-lg overflow-hidden animate-[fade-in_0.8s_ease-out_1s_both]"
          >
            <input
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-5 text-base md:text-lg text-[#1A1A1A] placeholder:text-[#999999] bg-white outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#829E04] text-white text-base md:text-lg font-medium px-6 md:px-10 py-4 md:py-5 cursor-pointer hover:bg-[#6f8703] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Joining…" : "Join waitlist"}
            </button>
          </form>
        )}

        {error && !joined && (
          <p className="mt-4 text-sm md:text-base text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
};

export default Hero;
