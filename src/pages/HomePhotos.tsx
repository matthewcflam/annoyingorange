import PaperSheet from "./paper/PaperSheet";
import { PHOTO_SHEETS, PHOTO_TAPES } from "./paper/sheets";

/**
 * The taped photos top-right on home (Figma "Home Page Final"): three prints
 * of one photo, each cropped the same way, rotated and overlapping, held by
 * two strips of masking tape. Placed by their centres in mockup px (home.css);
 * flat paper (paper/PaperSheet.tsx): clean prints, textured tape, one small
 * drop shadow. Back to front, then the tape.
 */
export default function HomePhotos() {
  return (
    <div className="home-photos" aria-hidden="true">
      {[...PHOTO_SHEETS, ...PHOTO_TAPES].map((s) => (
        <PaperSheet key={s.id} sheet={s} placed eager={s.id === "photo-2"} />
      ))}
    </div>
  );
}
