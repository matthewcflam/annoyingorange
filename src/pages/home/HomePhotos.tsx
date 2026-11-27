import PaperSheet from "../../components/paper/PaperSheet";
import { PHOTO_SHEETS } from "./homeSheets";

/**
 * The two prints top-right on home (Figma "Home Page Final"): the group photo
 * behind, running off the top edge, and the photo by the water in front,
 * each slightly turned, no tape. Placed by their centres in mockup px
 * (home.css); flat paper (paper/PaperSheet.tsx): clean prints, one small drop
 * shadow, each print's opacity from Figma (home.css `.home-photo--*`).
 */
export default function HomePhotos() {
  return (
    <div className="home-photos wall-solid" aria-hidden="true">
      {PHOTO_SHEETS.map((s) => (
        <PaperSheet key={s.id} sheet={s} className={`home-photo--${s.id}`} placed eager={s.id === "photo-me"} />
      ))}
    </div>
  );
}
