import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

/**
 * Full-bleed on real mobile browsers (the deployment target). On wide desktop
 * windows only, the app is shown as a centred card for easy previewing — never
 * a fake phone bezel, since a real device already has its own screen edges.
 */
export function AppShell() {
  const { pathname } = useLocation();

  // a new page starts at the top, like a full page load did
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-bg desk:min-h-[calc(100dvh-56px)] desk:overflow-hidden desk:rounded-[28px] desk:shadow-device print:min-h-0 print:max-w-none print:rounded-none print:shadow-none">
      <div className="relative flex flex-1 flex-col px-[18px] pt-[18px]">
        <Outlet />
      </div>
    </div>
  );
}
