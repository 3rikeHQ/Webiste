import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLATE, WEEKLY_PAYMENT, formatUsd } from "@/lib/ownership";
import Sheet from "@/components/bottom-sheet";

type Step = "amount" | "confirm" | "processing" | "done";

const QUICK_WEEKS = [1, 2, 4];

type PayNowSheetProps = {
  balance: number;
  onClose: () => void;
  // Debits the main account; throws if the payment can't go through.
  onPay: (amount: number) => Promise<void>;
};

export default function PayNowSheet({ balance, onClose, onPay }: PayNowSheetProps) {
  const [step, setStep] = useState<Step>("amount");
  const [value, setValue] = useState(String(WEEKLY_PAYMENT));
  const [failed, setFailed] = useState(false);

  const amount = Number(value);
  const weeks = Math.floor(amount / WEEKLY_PAYMENT);
  const error =
    !(amount > 0)
      ? "Enter how much you want to pay."
      : amount > balance
        ? "Not enough in your main account. Deposit to continue."
        : null;

  const confirm = () => {
    setStep("processing");
    window.setTimeout(async () => {
      try {
        await onPay(amount);
        setStep("done");
      } catch {
        setFailed(true);
        setStep("amount");
      }
    }, 1200);
  };

  // Keep the sheet open while the payment is going through.
  const close = () => step !== "processing" && onClose();

  return (
    <Sheet label="Pay Now" onClose={close}>
      {step === "amount" && (
        <div className="animate-in fade-in duration-300">
          <h3 className="text-xl font-bold text-gray-900">Pay towards your 3rike</h3>
          <p className="text-sm text-[#909090] mt-1 mb-6">
            Your weekly fee is {formatUsd(WEEKLY_PAYMENT)}. Pay ahead to finish sooner.
          </p>

          <label htmlFor="pay-amount" className="block text-xs text-[#909090] mb-2">
            Amount
          </label>
          <div className="flex items-center gap-1 h-16 rounded-2xl bg-[#F3F5F9] px-4 focus-within:ring-2 focus-within:ring-[#01C259] transition-shadow">
            <span className="text-2xl text-gray-400">$</span>
            <input
              id="pay-amount"
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => {
                setFailed(false);
                setValue(e.target.value.replace(/[^0-9.]/g, ""));
              }}
              className="flex-1 min-w-0 bg-transparent text-3xl font-bold text-gray-900 outline-none"
            />
          </div>

          <div className="flex gap-2 mt-3">
            {QUICK_WEEKS.map((w) => {
              const quick = w * WEEKLY_PAYMENT;
              const selected = amount === quick;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setFailed(false);
                    setValue(String(quick));
                  }}
                  className={`flex-1 rounded-2xl border px-2 py-2 text-xs leading-tight cursor-pointer transition-colors ${
                    selected
                      ? "border-[#01C259] bg-[#E9F8EE] text-[#1B8036] font-medium"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-sm font-semibold">${quick}</span>
                  <span className="block text-[11px] opacity-80">{w === 1 ? "1 week" : `${w} weeks`}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 p-3">
            <span className="w-9 h-9 rounded-xl bg-[#E9F8EE] flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5 text-[#01C259]" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-800">Main account</p>
              <p className="text-xs text-[#909090]">Balance {formatUsd(balance)}</p>
            </div>
            {!error && <p className="text-xs text-[#909090]">After: {formatUsd(balance - amount)}</p>}
          </div>

          {(failed || (error && value !== "")) && (
            <p className="text-sm text-[#EC1111] mt-3" role="alert">
              {failed ? "We couldn't take that payment. Check your balance and try again." : error}
            </p>
          )}

          <Button
            type="button"
            disabled={!!error}
            onClick={() => setStep("confirm")}
            className="mt-6 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium disabled:bg-[#9fe0bb] disabled:opacity-100 cursor-pointer"
          >
            Continue
          </Button>
        </div>
      )}

      {(step === "confirm" || step === "processing") && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <h3 className="text-xl font-bold text-gray-900 text-center">Confirm payment</h3>
          <p className="text-4xl font-bold text-gray-900 text-center mt-4">{formatUsd(amount)}</p>
          <p className="text-sm text-[#909090] text-center mt-1 mb-6">
            {weeks > 0 ? `Covers ${weeks === 1 ? "1 week" : `${weeks} weeks`} of payments` : "Part payment towards this week"}
          </p>

          <dl className="rounded-2xl bg-[#F2FBF5] p-4 space-y-3 text-sm">
            {[
              ["Paying for", PLATE],
              ["From", "Main account"],
              ["Balance after", formatUsd(balance - amount)],
            ].map(([term, detail]) => (
              <div key={term} className="flex justify-between">
                <dt className="text-[#909090]">{term}</dt>
                <dd className="font-medium text-gray-900">{detail}</dd>
              </div>
            ))}
          </dl>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={step === "processing"}
              onClick={() => setStep("amount")}
              className="flex-1 h-14 rounded-xl border border-gray-200 text-gray-700 cursor-pointer"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={step === "processing"}
              onClick={confirm}
              className="flex-1 h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white font-medium cursor-pointer disabled:opacity-80"
            >
              {step === "processing" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Paying…
                </>
              ) : (
                "Confirm payment"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-500">
          <img src="/success.svg" alt="" className="w-18 h-18 mb-5" />
          <h3 className="text-xl font-bold text-gray-900">Payment successful</h3>
          <p className="text-sm text-[#909090] mt-2 max-w-64">
            {formatUsd(amount)} has been paid towards {PLATE} from your main account.
          </p>
          <Button
            type="button"
            onClick={onClose}
            className="mt-8 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium cursor-pointer"
          >
            Done
          </Button>
        </div>
      )}
    </Sheet>
  );
}
