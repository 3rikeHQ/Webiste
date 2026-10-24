import { Outlet } from "react-router-dom";

/**
 * Layout route for every app screen (auth, onboarding, driver) so the app is
 * a phone even on desktop. On phones it adds nothing. From `sm` up it centres
 * a 400px column: the transform makes the column the containing block for
 * `position: fixed`, so full-screen pages, sheets and modals stay inside it,
 * and the inner div does the scrolling so those overlays don't scroll away.
 */
export default function MobileLayout() {
  return (
    <div className="min-h-dvh sm:h-dvh sm:flex sm:justify-center sm:bg-[#F3F5F9]">
      <div className="w-full bg-white sm:max-w-100 sm:h-dvh sm:overflow-hidden sm:shadow-2xl sm:[transform:translateZ(0)]">
        <div className="sm:relative sm:h-full sm:overflow-y-auto sm:overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
