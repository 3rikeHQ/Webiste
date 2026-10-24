import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

// Photos from Wikimedia Commons; their licences ask for the credit shown below the gallery
const PHOTOS = [
  {
    src: "/fleet/tvs-king.jpg",
    name: "TVS King",
    alt: "Yellow and green TVS King tricycle parked on a street",
    author: "shankar s.",
    license: "CC BY 2.0",
    href: "https://commons.wikimedia.org/wiki/File:TVS_tuktuk_in_Chennai.jpg",
  },
  {
    src: "/fleet/keke-front.jpg",
    name: "Keke Napep",
    alt: "Front of a yellow keke tricycle",
    author: "Sardeeq",
    license: "CC0",
    href: "https://commons.wikimedia.org/wiki/File:Yellow_Keke_napep.jpg",
  },
  {
    src: "/fleet/bajaj-re.jpg",
    name: "Bajaj RE",
    alt: "Bajaj RE auto rickshaw",
    author: "Oleg Yunakov",
    license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:2005_Bajaj_RE_auto_rickshaw.jpg",
  },
  {
    src: "/fleet/bajaj-compact.jpg",
    name: "Bajaj RE Compact",
    alt: "Bajaj RE Compact auto rickshaw",
    author: "Oleg Yunakov",
    license: "CC BY-SA 4.0",
    href: "https://commons.wikimedia.org/wiki/File:2019_Bajaj_RE_Compact_auto_rickshaw.jpg",
  },
];

const wrap = (i: number) => (i + PHOTOS.length) % PHOTOS.length;

export default function FleetGallery() {
  const [active, setActive] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const touchX = useRef<number | null>(null);
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

  const credit = (
    <>
      Photo:{" "}
      <a href={photo.href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
        {photo.author}
      </a>
      , {photo.license}, via Wikimedia Commons
    </>
  );

  return (
    <div className="mt-4 mb-8">
      {/* Big photo: cross-fades between all four, which stay mounted */}
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        aria-label={`View ${photo.name} full screen`}
        className="group relative block w-full aspect-square rounded-3xl overflow-hidden bg-[#F3F5F9]"
        {...swipe}
      >
        {PHOTOS.map((p, i) => (
          <img
            key={p.src}
            src={p.src}
            alt={i === active ? p.alt : ""}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              i === active ? "opacity-100 scale-100" : "opacity-0 scale-110"
            }`}
          />
        ))}
        <span className="absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/60 to-transparent" />
        <span className="absolute top-4 right-4 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {active + 1}/{PHOTOS.length}
        </span>
        <span key={photo.name} className="absolute left-5 bottom-4 text-left text-white animate-rise-in">
          <span className="block text-[10px] uppercase tracking-widest text-[#D5FF19]">Fleet model</span>
          <span className="block text-lg font-bold">{photo.name}</span>
        </span>
        <span className="absolute right-4 bottom-4 w-9 h-9 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-md transition-transform group-hover:scale-110">
          <Expand className="w-4 h-4" />
        </span>
      </button>

      {/* Thumbnails */}
      <div className="flex gap-3 mt-4">
        {PHOTOS.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Show ${p.name}`}
            aria-current={i === active ? "true" : undefined}
            className={`relative flex-1 max-w-16 aspect-square rounded-xl overflow-hidden transition-all duration-300 ${
              i === active
                ? "ring-2 ring-[#01C259] ring-offset-2 scale-105 shadow-lg shadow-[#01C259]/25"
                : "opacity-50 hover:opacity-100 hover:-translate-y-0.5"
            }`}
          >
            <img src={p.src} alt="" draggable={false} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <p className="mt-3 text-[10px] text-gray-400">{credit}</p>

      {/* Full-screen view */}
      {isExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.name} photo`}
          className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200"
          {...swipe}
        >
          <div className="flex items-center justify-between px-5 pt-6 pb-4 text-white">
            <div>
              <p className="text-base font-semibold">{photo.name}</p>
              <p className="text-xs text-white/60">
                {active + 1} of {PHOTOS.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center">
            <img
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              draggable={false}
              className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-300"
            />
            <button
              type="button"
              onClick={() => setActive((i) => wrap(i - 1))}
              aria-label="Previous photo"
              className="absolute left-3 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => wrap(i + 1))}
              aria-label="Next photo"
              className="absolute right-3 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
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
                aria-label={`Show ${p.name}`}
                aria-current={i === active ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-[#01C259]" : "w-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <p className="px-5 pt-3 pb-6 text-center text-[10px] text-white/50">{credit}</p>
        </div>
      )}
    </div>
  );
}
