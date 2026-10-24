import { useState } from "react";
import { CalendarClock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WEEKDAYS,
  WEEKLY_PAYMENT,
  formatShortDate,
  formatUsd,
  nextDebitDate,
  type AutoPay,
  type Weekday,
} from "@/lib/ownership";
import Sheet from "./sheet";

type View = "setup" | "manage" | "done";

type AutoPaySheetProps = {
  current: AutoPay | null;
  balance: number;
  onClose: () => void;
  onSave: (autoPay: AutoPay | null) => void;
};

export default function AutoPaySheet({ current, balance, onClose, onSave }: AutoPaySheetProps) {
  const [view, setView] = useState<View>(current ? "manage" : "setup");
  const [value, setValue] = useState(String(current?.amount ?? WEEKLY_PAYMENT));
  const [day, setDay] = useState<Weekday>(current?.day ?? "Monday");

  const amount = Number(value);
  const valid = amount >= WEEKLY_PAYMENT;
  const nextDebit = formatShortDate(nextDebitDate(day));

  const save = () => {
    onSave({ amount, day });
    setView("done");
  };

  return (
    <Sheet label="Auto-Pay" onClose={onClose}>
      {view === "manage" && current && (
        <div className="animate-in fade-in duration-300">
          <h3 className="text-xl font-bold text-gray-900">Auto-Pay</h3>
          <p className="text-sm text-[#909090] mt-1 mb-5">Your weekly fee is paid for you from your main account.</p>

          <div className="rounded-2xl bg-[#F2FBF5] p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-[#1B8036] mb-4">
              <span className="relative flex w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-[#01C259] animate-ping opacity-60" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-[#01C259]" />
              </span>
              Auto-Pay is on
            </p>
            <dl className="space-y-3 text-sm">
              {[
                ["Amount", `${formatUsd(current.amount)} / week`],
                ["Debit day", `Every ${current.day}`],
                ["Next debit", formatShortDate(nextDebitDate(current.day))],
                ["From", "Main account"],
              ].map(([term, detail]) => (
                <div key={term} className="flex justify-between">
                  <dt className="text-[#909090]">{term}</dt>
                  <dd className="font-medium text-gray-900">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Button
            type="button"
            onClick={() => setView("setup")}
            className="mt-6 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium cursor-pointer"
          >
            Edit schedule
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onSave(null);
              onClose();
            }}
            className="mt-3 w-full h-12 rounded-xl text-[#EC1111] hover:bg-red-50 hover:text-[#EC1111] cursor-pointer"
          >
            Turn off Auto-Pay
          </Button>
        </div>
      )}

      {view === "setup" && (
        <div className="animate-in fade-in duration-300">
          <h3 className="text-xl font-bold text-gray-900">{current ? "Edit Auto-Pay" : "Set up Auto-Pay"}</h3>
          <p className="text-sm text-[#909090] mt-1 mb-6">
            Never miss a week. We'll pay your 3rike fee from your main account automatically.
          </p>

          <label htmlFor="autopay-amount" className="block text-xs text-[#909090] mb-2">
            Amount each week
          </label>
          <div className="flex items-center gap-1 h-14 rounded-2xl bg-[#F3F5F9] px-4 focus-within:ring-2 focus-within:ring-[#01C259] transition-shadow">
            <span className="text-xl text-gray-400">$</span>
            <input
              id="autopay-amount"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
              className="flex-1 min-w-0 bg-transparent text-2xl font-bold text-gray-900 outline-none"
            />
          </div>
          <p className={`text-xs mt-2 ${valid ? "text-[#909090]" : "text-[#EC1111]"}`}>
            Minimum is your weekly fee of {formatUsd(WEEKLY_PAYMENT)}. Pay more to own it sooner.
          </p>

          <p id="autopay-day" className="text-xs text-[#909090] mt-5 mb-2">
            Debit day
          </p>
          <div role="radiogroup" aria-labelledby="autopay-day" className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={d === day}
                aria-label={d}
                onClick={() => setDay(d)}
                className={`h-11 rounded-xl text-xs cursor-pointer transition-all duration-200 ${
                  d === day
                    ? "bg-[#01C259] text-white font-medium scale-105 shadow-md shadow-[#01C259]/30"
                    : "bg-[#F3F5F9] text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>

          {valid && (
            <div className="mt-5 flex gap-2 rounded-xl border border-dashed border-[#1969FE] bg-[#E8F0FF80] p-3 text-xs text-[#1969FE]">
              <Info className="w-4 h-4 shrink-0 mt-px" />
              <p>
                You will be debited {formatUsd(amount)} every {day} from your main account. First debit: {nextDebit}.
              </p>
            </div>
          )}
          {valid && balance < amount && (
            <p className="mt-3 text-xs text-[#EE9C2E]">
              Your balance ({formatUsd(balance)}) is below this amount. Top up before {nextDebit} so the payment goes
              through.
            </p>
          )}

          <Button
            type="button"
            disabled={!valid}
            onClick={save}
            className="mt-6 w-full h-14 rounded-xl bg-[#01C259] hover:bg-[#00a049] text-white text-base font-medium disabled:bg-[#9fe0bb] disabled:opacity-100 cursor-pointer"
          >
            {current ? "Save changes" : "Turn on Auto-Pay"}
          </Button>
        </div>
      )}

      {view === "done" && (
        <div className="flex flex-col items-center text-center py-4 animate-in fade-in zoom-in-95 duration-500">
          <span className="w-18 h-18 rounded-full bg-[#E9F8EE] flex items-center justify-center mb-5">
            <CalendarClock className="w-9 h-9 text-[#01C259]" />
          </span>
          <h3 className="text-xl font-bold text-gray-900">Auto-Pay is on</h3>
          <p className="text-sm text-[#909090] mt-2 max-w-64">
            We'll debit {formatUsd(amount)} every {day}. Next debit: {nextDebit}.
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
