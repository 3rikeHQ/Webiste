import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

// Fleet tricycles: passenger models first, then cargo
const PHOTOS = [
  { src: "/fleet/tvs-king-yellow.webp", name: "TVS King", color: "Yellow", alt: "Yellow TVS King passenger tricycle" },
  { src: "/fleet/bajaj-re-yellow.webp", name: "Bajaj RE", color: "Yellow", alt: "Yellow Bajaj RE passenger tricycle with a black canopy" },
  { src: "/fleet/tvs-king-cng-green.webp", name: "TVS King CNG", color: "Green", alt: "Green and yellow TVS King CNG passenger tricycle" },
  { src: "/fleet/passenger-tricycle-black-roof.webp", name: "Passenger Tricycle", color: "Yellow & black", alt: "Yellow passenger tricycle with a black canopy" },
  { src: "/fleet/passenger-tricycle-yellow.webp", name: "Passenger Tricycle", color: "Yellow", alt: "Yellow passenger tricycle with a yellow roof and riders on board" },
  { src: "/fleet/tvs-king-kargo-yellow.webp", name: "TVS King Kargo", color: "Yellow", alt: "Yellow TVS King Kargo tricycle with a closed cargo box" },
  { src: "/fleet/tvs-king-kargo-white.webp", name: "TVS King Kargo", color: "White", alt: "White TVS King Kargo tricycle with a closed cargo box" },
];

const wrap = (i: number) => (i + PHOTOS.length) % PHOTOS.length;

// Soft studio light behind the cut-out tricycles
const STUDIO_BG = "bg-[radial-gradient(circle_at_50%_30%,#FFFFFF_0%,#F3F5F9_55%,#E6EBF2_100%)]";

export default function FleetGallery() {
  const [active, setActive] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const touchX = useRef<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const photo = PHOTOS[active];

  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      touchX.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) > 40) setActive((i) => wrap(i + (dx < 0 ? 1 : -1)));
    },
  };

  useEffect(() => {
    if (!isExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
      if (e.key === "ArrowRight") setActive((i) => wrap(i + 1));
      if (e.key === "ArrowLeft") setActive((i) => wrap(i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isExpanded]);

  // Keep the active thumbnail in view in the scrolling strip
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  return (
    <div className="mt-4 mb-8">
      {/* Big photo: cross-fades between all of them, which stay mounted */}
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-label={`View ${photo.name} full screen`}
        className={`group relative block w-full aspect-square rounded-3xl overflow-hidden ${STUDIO_BG}`}
        {...swipe}
      >
        {/* Floor shadow */}
        <span className="absolute left-1/2 bottom-[19%] w-[64%] h-[7%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-lg" />
        {PHOTOS.map((p, i) => (
          <img
            key={p.src}
            src={p.src}
            alt={i === active ? p.alt : ""}
            draggable={false}
            className={`absolute left-[9%] top-[8%] w-[82%] h-[71%] object-contain object-bottom transition-all duration-700 ease-out ${
              i === active ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-6 scale-95"
            }`}
          />
        ))}
        <span className="absolute top-4 right-4 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          {active + 1}/{PHOTOS.length}
        </span>
        <span key={active} className="absolute left-5 bottom-4 text-left animate-rise-in">
          <span className="block text-[10px] uppercase tracking-widest font-medium text-[#01C259]">
            Fleet model · {photo.color}
          </span>
          <span className="block text-lg font-bold text-gray-900">{photo.name}</span>
        </span>
        <span className="absolute right-4 bottom-4 w-9 h-9 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
          <Expand className="w-4 h-4" />
        </span>
      </button>

      {/* Thumbnails: scroll sideways when they don't all fit */}
      <div
        ref={stripRef}
        className="relative flex gap-3 mt-3 -mx-1 px-1 py-2 overflow-x-auto snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${p.name}, ${p.color.toLowerCase()}`}
            aria-current={i === active ? "true" : undefined}
            className={`relative shrink-0 w-16 h-16 snap-start rounded-xl overflow-hidden bg-[#F3F5F9] transition-all duration-300 ${
              i === active
                ? "ring-2 ring-[#01C259] ring-offset-2 scale-105 shadow-lg shadow-[#01C259]/25"
                : "opacity-50 hover:opacity-100 hover:-translate-y-0.5"
            }`}
          >
            <img src={p.src} alt="" draggable={false} className="w-full h-full object-contain p-1.5" />
          </button>
        ))}
      </div>

      {/* Full-screen view */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.name} photo`}
          className={`fixed inset-0 z-50 flex flex-col animate-in fade-in duration-200 ${STUDIO_BG}`}
          {...swipe}
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <div>
              <p className="text-base font-bold text-gray-900">{photo.name}</p>
              <p className="text-xs text-gray-500">
                {photo.color} · {active + 1} of {PHOTOS.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
              className="w-10 h-10 rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-6">
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              draggable={false}
              className="max-w-full max-h-[80%] object-contain drop-shadow-[0_28px_20px_rgba(0,0,0,0.18)] animate-in fade-in zoom-in-95 duration-300"
            />
            <button
              type="button"
              onClick={() => setActive((i) => wrap(i - 1))}
              aria-label="Previous photo"
              className="absolute left-3 w-10 h-10 rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => wrap(i + 1))}
              aria-label="Next photo"
              className="absolute right-3 w-10 h-10 rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-50 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 pt-5">
            {PHOTOS.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show ${p.name}, ${p.color.toLowerCase()}`}
                aria-current={i === active ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-[#01C259]" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          <div className="pb-8" />
        </div>
      )}
    </div>
  );
}
