import { useEffect, type ReactNode } from "react";

type SheetProps = {
  label: string;
  onClose: () => void;
  children: ReactNode;
};

// Bottom sheet sized to the mobile frame. Mount it only while open so its
// contents start fresh every time.
export default function Sheet({ label, onClose, children }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={label}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200 cursor-default border-none"
      />
      <div className="relative w-full max-w-100 max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl px-6 pt-3 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto w-12 h-1.5 bg-gray-200 rounded-full mb-6" />
        {children}
      </div>
    </div>
  );
}
