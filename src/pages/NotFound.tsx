import { Navigate, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { PageContent, PageHeader } from "@/components/ui/page";

/**
 * Unknown URL. Old links from the static build (e.g. /dashboard.html?openChat=1)
 * are redirected to their new route, keeping any query string.
 */
export default function NotFoundPage() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  const legacy = pathname.match(/^\/(.*)\.html$/);
  if (legacy) {
    const page = legacy[1] === "index" ? "" : legacy[1];
    return <Navigate to={`/${page}${search}`} replace />;
  }

  return (
    <>
      <PageHeader title="Page not found" />
      <PageContent chatPad={false} className="px-3 pt-10 text-center">
        <p className="mb-6 text-[14px] leading-normal text-muted">We couldn't find that page. It may have moved.</p>
        <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
      </PageContent>
    </>
  );
}
