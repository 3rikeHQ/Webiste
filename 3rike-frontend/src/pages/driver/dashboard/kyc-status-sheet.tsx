import { useEffect, useRef, useState } from "react";
import { Check, Hourglass, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sheet from "@/components/bottom-sheet";

const STEPS = [
  { title: "Details submitted", text: "We received your KYC details." },
  { title: "Identity check", text: "Matching your ID card and selfie." },
  { title: "Approval", text: "Final review by the 3rike team." },
];

// Confetti pieces for the approval moment: [x, y, colour]
const BURST: [number, number, string][] = [
  [-90, -70, "#01C259"], [-40, -105, "#D5FF19"], [20, -110, "#F1B058"], [80, -80, "#01C259"],
  [105, -20, "#9747FF"], [90, 45, "#D5FF19"], [-100, 20, "#F1B058"], [-75, 70, "#9747FF"],
];

type KycStatusSheetProps = {
  onClose: () => void;
  onApproved: () => void;
};

// Mock review: "Refresh status" walks the remaining steps and approves.
export default function KycStatusSheet({ onClose, onApproved }: KycStatusSheetProps) {
  const [completed, setCompleted] = useState(1);
  const [checking, setChecking] = useState(false);
  const timers = useRef<number[]>([]);
  const approved = completed === STEPS.length;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const refresh = () => {
    setChecking(true);
    timers.current.push(
      window.setTimeout(() => setCompleted(2), 900),
      window.setTimeout(() => {
        setCompleted(3);
        setChecking(false);
      }, 1900),
    );
  };

  return (
    <Sheet label="Verification status" onClose={checking ? () => {} : onClose}>
      {approved ? (
        <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mb-6">
            {BURST.map(([x, y, color], i) => (
              <span
                key={i}
                className="animate-burst absolute left-1/2 top-1/2 w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full"
                style={{ backgroundColor: color, "--x": `${x}px`, "--y": `${y}px` } as React.CSSProperties}
              />
            ))}
            <img src="/success.svg" alt="" className="relative w-20 h-20" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">You're approved!</h3>
          <p className="text-sm text-[#909090] mt-2 max-w-64">
            Your KYC is verified. Let's get you on the road with your own 3rike.
          </p>
          <Button
            type="button"
            onClick={onApproved}
            className="mt-8 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium"
          >
            See my 3rike
          </Button>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <span className="relative w-12 h-12 rounded-2xl bg-[#FFF7EC] flex items-center justify-center">
              <span className="absolute inset-0 rounded-2xl bg-[#F1B058]/20 animate-ping" />
              <Hourglass className="relative w-6 h-6 text-[#EE9C2E]" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Verification in progress</h3>
              <p className="text-sm text-[#909090]">Usually done in under 24 hours.</p>
            </div>
          </div>

          <ol className="relative">
            {STEPS.map((step, i) => {
              const done = i < completed;
              const current = i === completed;
              return (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-100 overflow-hidden">
                      <span
                        className="absolute inset-x-0 top-0 bg-[#01C259] transition-[height] duration-700 ease-out"
                        style={{ height: i < completed - 1 ? "100%" : "0%" }}
                      />
                    </span>
                  )}
                  <span
                    className={`relative z-10 w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-500 ${
                      done
                        ? "bg-[#01C259] text-white scale-100"
                        : current
                          ? "bg-[#FFF7EC] ring-2 ring-[#F1B058]"
                          : "bg-gray-100"
                    }`}
                  >
                    {done ? (
                      <Check className="w-4 h-4 animate-in zoom-in duration-300" strokeWidth={3} />
                    ) : current ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F1B058] animate-pulse" />
                    ) : null}
                  </span>
                  <div className="pt-1">
                    <p className={`text-sm font-medium ${done || current ? "text-gray-900" : "text-gray-400"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-[#909090] mt-0.5">{current && checking ? "Checking now…" : step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <Button
            type="button"
            disabled={checking}
            onClick={refresh}
            className="mt-8 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium gap-2 disabled:opacity-90"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking status…" : "Refresh status"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={checking}
            onClick={onClose}
            className="mt-2 w-full h-12 rounded-xl text-gray-500"
          >
            Close
          </Button>
        </div>
      )}
    </Sheet>
  );
}
