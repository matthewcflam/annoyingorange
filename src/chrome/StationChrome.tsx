import { useCallback, useState } from "react";
import { useRoute } from "../lib/router";
import MapBox from "../components/MapBox";

/**
 * Chrome on station pages: the Map box top-right (the site's navigation).
 * Mounted while the route is a station page, so it persists from one station
 * to the next. The social links live in the footer's Connections box
 * (pages/SiteFooter.tsx); the name top-left goes home (pages/StationLayout.tsx).
 */
export default function StationChrome() {
  const route = useRoute();
  // The map is open on the page it was opened on, so a page change (under
  // the transition cover) closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === route;
  const setOpen = useCallback((v: boolean) => setOpenOn(v ? route : null), [route]);

  return <MapBox open={open} onOpenChange={setOpen} />;
}
