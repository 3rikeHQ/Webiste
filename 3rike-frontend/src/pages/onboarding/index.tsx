import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SLIDE_MS = 4500;

const onboardingData = [
    {
        image: "/onboarding-road.jpg",
        title: "Own a 3rike",
        description: "Get approved under 24hrs and own a bike.",
        fullBleed: true,
    },
    {
        image: "/onboarding2.svg",
        title: "Savings",
        description: "Save towards your goals with Target Savings and 3triky Lock.",
        fullBleed: false,
    },
    {
        image: "/onboarding3.svg",
        title: "Loans",
        description: "Get loans with flexible repayment.",
        fullBleed: false,
    },
    {
        image: "/onboarding4.svg",
        title: "Investment",
        description: "Own a 3rike with little as $50/Ghs 600.",
        fullBleed: false,
    },
];

// Slides cross-fade rather than slide: the incoming art settles in from a
// slight zoom and blur while the outgoing one drifts forward and fades.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function Onboarding() {
    const [currentScreen, setCurrentScreen] = useState(-1);
    // Bumped on every change so the progress bar restarts even on the same slide.
    const [cycle, setCycle] = useState(0);
    const [holding, setHolding] = useState(false);
    const navigate = useNavigate();
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentScreen(0);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const goTo = (index: number) => {
        setCurrentScreen((index + onboardingData.length) % onboardingData.length);
        setCycle((c) => c + 1);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.touches[0].clientX;
        setHolding(true);
    };

    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        setHolding(false);
        if (touchStartX.current === null) return;

        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;

        // swipe threshold
        if (diff > 50) {
            // swipe left → next
            goTo(currentScreen + 1);
        } else if (diff < -50) {
            // swipe right → previous
            goTo(currentScreen - 1);
        }

        touchStartX.current = null;
    };

    // --- SPLASH SCREEN ---
    if (currentScreen === -1) {
        return (
            <div className="fixed inset-0 w-full h-dvh flex items-center justify-center bg-white">
                <img src="/logo.svg" alt="3rike" className="w-60 h-60 animate-in fade-in zoom-in-90 duration-700" />
            </div>
        );
    }

    const screenData = onboardingData[currentScreen];

    return (
        <div
            className="fixed inset-0 w-full bg-black flex flex-col overflow-hidden animate-in fade-in duration-500"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={() => setHolding(false)}
        >
            {/* Every slide stays mounted so the images are loaded before their turn */}
            {onboardingData.map((slide, i) => {
                const isActive = i === currentScreen;
                return (
                    <div
                        key={slide.title}
                        aria-hidden={!isActive}
                        className="absolute inset-0 z-0 overflow-hidden"
                        style={{
                            opacity: isActive ? 1 : 0,
                            transition: `opacity 900ms ${EASE}`,
                        }}
                    >
                        {slide.fullBleed ? (
                            <>
                                <img
                                    src={slide.image}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{
                                        // Slow push-in while the slide is on screen; reset once it has faded out.
                                        transform: isActive ? "scale(1.12)" : "scale(1)",
                                        transition: isActive
                                            ? `transform ${SLIDE_MS + 900}ms linear`
                                            : "transform 0ms linear 900ms",
                                    }}
                                />
                                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-[linear-gradient(165deg,#2F6E3B_0%,#0E2B14_32%,#000_58%)] flex items-start justify-center pt-[14vh]">
                                <div
                                    className="w-[78%] max-w-90"
                                    style={{
                                        opacity: isActive ? 1 : 0,
                                        transform: isActive ? "none" : "translateY(24px) scale(0.86)",
                                        filter: isActive ? "blur(0)" : "blur(10px)",
                                        transition: `opacity 900ms ${EASE}, transform 1100ms ${EASE}, filter 900ms ${EASE}`,
                                    }}
                                >
                                    <img
                                        src={slide.image}
                                        alt=""
                                        className="w-full h-auto max-h-[46vh] object-contain animate-float"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Progress segments: tap one to jump to it */}
            <div className="relative z-10 w-full max-w-md mx-auto flex gap-1.5 px-6 pt-[max(1rem,env(safe-area-inset-top))]">
                {onboardingData.map((slide, i) => (
                    <button
                        key={slide.title}
                        type="button"
                        aria-label={`Show ${slide.title}`}
                        aria-current={i === currentScreen ? "step" : undefined}
                        onClick={() => goTo(i)}
                        className="relative flex-1 h-5 cursor-pointer bg-transparent border-none p-0"
                    >
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-white/25 overflow-hidden">
                            {i < currentScreen && <span className="absolute inset-0 bg-white" />}
                            {i === currentScreen && (
                                <span
                                    key={cycle}
                                    onAnimationEnd={() => goTo(currentScreen + 1)}
                                    className="absolute inset-0 origin-left bg-white"
                                    style={{
                                        animation: `step-progress ${SLIDE_MS}ms linear forwards`,
                                        animationPlayState: holding ? "paused" : "running",
                                    }}
                                />
                            )}
                        </span>
                    </button>
                ))}
            </div>

            {/* Bottom Content Area */}
            <div className="relative z-10 mt-auto px-6 pb-8 w-full max-w-md mx-auto flex flex-col justify-end">

                {/* Text Block: remounts per slide so it rises in each time */}
                <div key={currentScreen} className="mb-8 text-left" aria-live="polite">
                    <h1 className="animate-rise-in text-[2.6rem] font-bold text-white mb-2 leading-tight tracking-tight">
                        {screenData.title}
                    </h1>
                    <p className="animate-rise-in text-gray-200 text-sm pr-2 [animation-delay:120ms]">
                        {screenData.description}
                    </p>
                </div>

                {/* Buttons Block */}
                <div className="space-y-4 w-full">
                    <Button
                        onClick={() => navigate("/create-account-rider")}
                        className="w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#01a64c] text-white font-medium text-base shadow-none transition-colors"
                    >
                        Create account
                    </Button>

                    <Button
                        onClick={() => navigate("/login")}
                        className="w-full h-14 rounded-xl bg-[#3F443F] hover:bg-[#323632] text-[#01C259] font-medium text-base shadow-none flex justify-center items-center gap-1 transition-colors"
                    >
                        <span className="text-[#01C259]/80 font-normal">Already have an account?</span>
                        <span className="font-bold">Log in</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
