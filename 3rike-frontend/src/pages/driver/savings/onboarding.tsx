import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Illustrations: Microsoft Fluent Emoji 3D (MIT licence), in public/savings.
const onboardingData = [
    {
        image: "/savings/target.png",
        accents: ["/savings/coin.png", "/savings/money-bag.png"],
        title: "Target Savings",
        description: "Set a goal like rent, a car or 3rike parts, and save towards it daily or weekly.",
        color: "bg-[#BBE6C3]",
    },
    {
        image: "/savings/lock.png",
        accents: ["/savings/coin.png", "/savings/chart-up.png"],
        title: "3triky Lock",
        description: "Lock your savings away and earn interest until the date you choose.",
        color: "bg-[#7BCD8A]",
    },
];

export default function SavingsOnboarding() {
    const [currentScreen, setCurrentScreen] = useState(0);
    const navigate = useNavigate()


    const screenData = onboardingData[currentScreen];
    const isLastScreen = currentScreen === onboardingData.length - 1;

    const handleDashboard = () => {
        navigate("/driver/savings/dashboard")
    };

    return (
        <div
            className="fixed inset-0 bg-white flex flex-col p-3 overflow-y-auto"

        >

            <div className="relative flex items-center pt-10 p-6">
                {/* Back button */}
                {/* Back button */}
                <Button
                    variant="link"
                    onClick={() => {
                        if (currentScreen === 0) {
                            navigate(-1); // go back in browser history
                        } else {
                            setCurrentScreen(prev => prev - 1);
                        }
                    }}
                    className="pt-10 pb-5 absolute left-6 top-1/2 -translate-y-1/2"
                >
                    <img src="/rounded-back.svg" alt="Back" className="w-10 h-10" />
                </Button>


                {/* Centered title */}
                <p className="mx-auto font-medium text-md text-center">
                    Savings
                </p>
            </div>
            {/* Image Section */}
            <div className={`relative w-full h-[min(462px,52dvh)] min-h-60 shrink-0 rounded-4xl ${screenData.color} mb-6 overflow-hidden transition-colors duration-500`}>
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/25" />
                <div className="absolute -bottom-20 -left-12 w-64 h-64 rounded-full bg-white/20" />
                <div key={currentScreen} className="absolute inset-0 animate-in fade-in zoom-in-90 duration-500">
                    <img
                        src={screenData.image}
                        alt=""
                        className="absolute left-1/2 top-1/2 w-[min(12rem,22dvh)] h-[min(12rem,22dvh)] -translate-x-1/2 -translate-y-1/2 drop-shadow-xl"
                    />
                    <img
                        src={screenData.accents[0]}
                        alt=""
                        className="absolute right-[14%] top-[16%] w-16 h-16 rotate-12 animate-float drop-shadow-lg"
                    />
                    <img
                        src={screenData.accents[1]}
                        alt=""
                        className="absolute left-[12%] bottom-[14%] w-20 h-20 -rotate-6 animate-float [animation-delay:-2s] drop-shadow-lg"
                    />
                </div>
            </div>

            <div key={`text-${currentScreen}`} className="px-3">
                <h2 className="animate-rise-in text-2xl font-semibold text-gray-900">{screenData.title}</h2>
                <p className="animate-rise-in [animation-delay:100ms] text-sm text-[#909090] mt-2 max-w-80">
                    {screenData.description}
                </p>
            </div>



            {/* Footer: stays in the flow so it never covers the text on short screens */}
            <div className="mt-auto flex justify-end px-3 pt-4 pb-6">
                    <Button
                        variant="link"
                        onClick={() => {
                            if (isLastScreen) {
                                handleDashboard(); // 🔁 change this route
                            } else {
                                setCurrentScreen(prev => prev + 1);
                            }
                        }}
                        className="w-auto py-6 rounded-xl text-[#01C259]  font-light text-lg shadow-none flex items-center gap-0.5"
                    >
                        {isLastScreen ? "Continue" : "Next"}
                        <img
                            src="/double_arrow_right.svg"
                            alt="arrow"
                            className="w-5 h-5"
                        />
                    </Button>
            </div>

        </div>
    );
}
