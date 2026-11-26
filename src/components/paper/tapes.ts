/**
 * The two strips of masking tape (tape-long.png, tape-short.png), baked with
 * fibre and --tape-tint (the `tape` preset, vite.config.ts). Every page
 * imports them from here, so each is one download site-wide. `w` is 2x the
 * widest box a strip is shown in; `paperFibre` is that box's width.
 */
import tapeLong from "../../../assets-src/images/tape-long.png?w=270&paperFibre=135&tape";
import tapeShort from "../../../assets-src/images/tape-short.png?w=176&paperFibre=88&tape";

export const TAPE_LONG = tapeLong;
export const TAPE_SHORT = tapeShort;
