import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_SCORE,
  formatShortDate,
  formatUsd,
  nextDebitDate,
  WEEKLY_PAYMENT,
  type AutoPay,
  type Weekday,
} from "@/lib/ownership";
import { me, listPayments, payNow, saveAutoPay, clearAutoPay, type Payment } from "@/lib/api";
import PayNowSheet from "./pay-now-sheet";
import AutoPaySheet from "./auto-pay-sheet";

type Tier = {
  label: string;
  color: string;
  bar: string;
  weeksToGo: number;
};

function tierFor(score: number): Tier {
  if (score >= 700) return { label: "Perfect Ride.", color: "#0066FF", bar: "#01C259", weeksToGo: 30 };
  if (score >= 400) return { label: "Good standing", color: "#0066FF", bar: "#01C259", weeksToGo: 30 };
  if (score >= 300) return { label: "Doing good", color: "#F1B058", bar: "#F1B058", weeksToGo: 40 };
  return { label: "keep going", color: "#EC1111", bar: "#EC1111", weeksToGo: 50 };
}

type Toast = { id: number; text: string; tone: "ok" | "error" };

export default function ThreeDetails() {
  const navigate = useNavigate();
  const [score, setScoreState] = useState(0);
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [autoPay, setAutoPay] = useState<AutoPay | null>(null);
  const [sheet, setSheet] = useState<"pay" | "autopay" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const tier = tierFor(score);
  const progressPct = Math.min(100, (score / MAX_SCORE) * 100);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const eligibleForLoan = score >= 400;

  const refresh = async () => {
    try {
      const [session, pays] = await Promise.all([me(), listPayments()]);
      setScoreState(session.user.score);
      setBalance(session.balance);
      setAutoPay(
        session.autopay
          ? { amount: session.autopay.amount, day: session.autopay.weekday as Weekday }
          : null
      );
      setPayments(pays.payments);
    } catch {
      setScoreState(0);
      setBalance(0);
      setPayments([]);
      setAutoPay(null);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([me(), listPayments()])
      .then(([session, pays]) => {
        if (!active) return;
        setScoreState(session.user.score);
        setBalance(session.balance);
        setAutoPay(
          session.autopay
            ? { amount: session.autopay.amount, day: session.autopay.weekday as Weekday }
            : null
        );
        setPayments(pays.payments);
      })
      .catch(() => {
        if (!active) return;
        setScoreState(0);
        setBalance(0);
        setPayments([]);
        setAutoPay(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const showToast = (text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now();
    setToast({ id, text, tone });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 2600);
  };

  const handlePay = async (amount: number) => {
    await payNow(amount);
    await refresh();
  };

  const handleSaveAutoPay = async (next: AutoPay | null) => {
    try {
      if (next) await saveAutoPay(next.amount, next.day);
      else await clearAutoPay();
      setAutoPay(next);
      if (!next) showToast("Auto-Pay turned off");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update Auto-Pay", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-100 bg-white shadow-2xl overflow-hidden min-h-200 relative pb-16 px-5 pt-6">

        {/* Header */}
        <div className="flex items-center justify-center relative mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute left-0 bg-[#E9F8EE] rounded-full hover:bg-[#d8f1e0] w-10 h-10 cursor-pointer"
            type="button"
          >
            <img src="/rounded-back.svg" alt="back" className="w-10 h-10" />
          </Button>
          <h1 className="font-light text-lg text-gray-800">3rike Details</h1>
        </div>

        {/* Vehicle card */}
        <div className="relative w-full rounded-3xl bg-[#1B8036] overflow-hidden p-5 text-white mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <img
            src="/future-main-bg.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
          />

          <div className="relative z-10 flex items-center justify-center h-44">
            <img src="/future-3rike2.svg" alt="Your 3rike" className="h-full object-contain" />
          </div>

          <div className="relative mx-2 z-10 mt-2 flex items-end justify-between">
            <div>
              <p className="text-xs text-white/90">Weekly Payment</p>
              <div className="text-lg font-bold flex items-center">
                <img src="/future-dolls.png" alt="$" />
                <span>{WEEKLY_PAYMENT}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/90">Main account</p>
              <p className="text-sm font-medium">{formatUsd(balance)}</p>
            </div>
          </div>

          <div className="relative mx-2 z-10 mt-3 flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setSheet("pay")}
              className="flex-1 bg-white/10 hover:bg-white/20 hover:text-white text-white border border-white/40 rounded-full h-10 gap-2 text-sm cursor-pointer active:scale-95 transition-transform"
            >
              <img src="/future-pay.svg" alt="" />
              Pay Now
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSheet("autopay")}
              aria-pressed={!!autoPay}
              className={`flex-1 rounded-full h-10 gap-2 text-sm cursor-pointer border active:scale-95 transition-all ${
                autoPay
                  ? "bg-white text-[#1B8036] border-white hover:bg-white/90 hover:text-[#1B8036]"
                  : "bg-white/10 hover:bg-white/20 hover:text-white text-white border-white/40"
              }`}
            >
              {autoPay ? <RefreshCw className="w-4 h-4" /> : <img src="/future-refresh.svg" alt="" />}
              {autoPay ? "Auto-Pay on" : "Auto-Pay"}
            </Button>
          </div>
        </div>

        {autoPay && (
          <button
            type="button"
            onClick={() => setSheet("autopay")}
            className="w-full flex items-center gap-2 rounded-xl bg-[#F2FBF5] px-3 py-2 mb-6 text-xs text-[#1B8036] cursor-pointer animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <span className="w-2 h-2 rounded-full bg-[#01C259]" />
            {formatUsd(autoPay.amount)} every {autoPay.day} · Next {formatShortDate(nextDebitDate(autoPay.day))}
          </button>
        )}
        {!autoPay && <div className="mb-6" />}

        {/* Ownership progress */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ownership Progress</h2>

        <div className="bg-[#F2FBF5] rounded-2xl p-5 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-[#909090] mb-1">Eligible Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {score}
                <span className="text-base font-light text-gray-500"> /{MAX_SCORE}</span>
              </p>
            </div>
            <div className="text-right space-y-2.5">
              <p className="text-sm font-normal" style={{ color: tier.color }}>
                {tier.label}
              </p>
              <p className="text-xs text-[#909090]">{tier.weeksToGo} weeks to go</p>
            </div>
          </div>

          {/* progress bar */}
          <div className="w-full h-3 rounded-full bg-white overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%`, backgroundColor: tier.bar }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#909090] mb-0.5">Total Paid</p>
              <p className="text-base font-bold text-[#01C259]">{formatUsd(totalPaid)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#909090] mb-0.5">3rike Condition</p>
              <p className="text-base font-bold text-[#01C259]">Excellent</p>
            </div>
          </div>
        </div>

        {eligibleForLoan && (
          <div className="flex justify-end mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full border border-[#01C259] text-[#01C259] text-xs font-medium bg-white">
              Eligible for Loan
            </span>
          </div>
        )}

        {/* Recent payments */}
        <h2 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Recent payments</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-[#909090]">No payments yet. Your weekly payment is {formatUsd(WEEKLY_PAYMENT)}.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <p className="text-sm text-gray-800">{p.type === "autopay" ? "Auto-Pay" : "Pay Now"}</p>
                  <p className="text-xs text-[#909090]">{formatShortDate(p.createdAt)} · Main account</p>
                </div>
                <p className="text-sm font-semibold text-[#01C259]">{formatUsd(p.amount)}</p>
              </li>
            ))}
          </ul>
        )}

        {toast && (
          <div
            key={toast.id}
            role="status"
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-60 rounded-full px-4 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
              toast.tone === "ok" ? "bg-[#1B8036]" : "bg-[#EC1111]"
            }`}
          >
            {toast.text}
          </div>
        )}
      </div>

      {sheet === "pay" && <PayNowSheet balance={balance} onClose={() => setSheet(null)} onPay={handlePay} />}
      {sheet === "autopay" && (
        <AutoPaySheet
          current={autoPay}
          balance={balance}
          onClose={() => setSheet(null)}
          onSave={handleSaveAutoPay}
        />
      )}
    </div>
  );
}
