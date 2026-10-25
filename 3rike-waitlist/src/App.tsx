import { useState } from "react";
import { subscribeWaitlist } from "./lib/api";

const STORAGE_KEY = "3rike.waitlist";

type Status = "idle" | "loading" | "done" | "error";

function readStoredEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeEmail(email: string) {
  try {
    localStorage.setItem(STORAGE_KEY, email);
  } catch {
    // ignore storage failures
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function App() {
  const [joined, setJoined] = useState<string | null>(() => readStoredEmail());
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await subscribeWaitlist(value);
      storeEmail(value);
      setJoined(value);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  const showThanks = status === "done" || joined !== null;

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navbar */}
      <div className="px-4 lg:px-[78px] pt-4 relative z-50">
        <div className="mx-auto flex h-20 justify-between items-center px-6 lg:px-10 rounded-2xl border border-[#E2F490] bg-[#F5F5F0]">
          <a href="https://www.3rike.com" className="flex items-center shrink-0 cursor-pointer">
            <img
              src="/new_3rike_logo.png"
              alt="3riKE Logo"
              className="h-12 md:h-16 w-auto object-contain"
            />
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col text-center justify-center items-center pt-12 md:pt-20 pb-20 md:pb-32 px-4">
        <span className="border border-[#E2F490] bg-white rounded-full px-4 md:px-6 py-2 text-[#666666] text-sm md:text-md mb-6 md:mb-10">
          Sustainable and Inclusive Finance
        </span>

        <h1 className="text-[48px] sm:text-[72px] md:text-[90px] lg:text-[110px] leading-[1.05] font-semibold text-[#1A1A1A] tracking-tight font-hepta space-y-2 md:space-y-6">
          <div>
            Own the <span className="text-[#829E04]">Ride</span>
          </div>
          <div>
            Power the <span className="text-[#829E04]">Future</span>
          </div>
        </h1>

        <p className="text-[#666666] text-base md:text-lg max-w-2xl mx-auto mt-6 md:mt-10 leading-relaxed px-2">
          3rike empowers electric tricycle and motorcycle drivers to achieve
          ownership while giving investors access to real-world income
          generating mobility assets driving a greener future.
        </p>

        {showThanks ? (
          <div className="mt-8 md:mt-12 w-full max-w-2xl border border-[#E2F490] rounded-lg bg-white px-6 py-12 md:py-16 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#829E04] mb-6">
              <svg
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h2 className="font-hepta text-2xl md:text-4xl font-semibold text-[#1A1A1A]">
              You're on the waitlist!
            </h2>
            <p className="text-[#666666] text-base md:text-lg mt-4 max-w-md mx-auto leading-relaxed">
              Thanks for joining. We'll be in touch soon{joined ? ` at ${joined}` : ""}.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 md:mt-12 flex flex-col sm:flex-row w-full max-w-2xl border border-[#E2F490] rounded-lg overflow-hidden"
            noValidate
          >
            <input
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-5 text-base md:text-lg text-[#1A1A1A] placeholder:text-[#999999] bg-white outline-none"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-[#829E04] text-white text-base md:text-lg font-medium px-6 md:px-10 py-4 md:py-5 cursor-pointer hover:bg-[#6f8703] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Joining…" : "Join waitlist"}
            </button>
          </form>
        )}

        {status === "error" && !showThanks && (
          <p className="mt-4 text-sm md:text-base text-red-600">{message}</p>
        )}
      </div>
    </div>
  );
}
