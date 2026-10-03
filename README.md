# The London Case — composition draft (real assets, v10)

Open `index.html` directly in a browser. No server, no internet, no build
step.

## Latest changes (v10)

1. **Text cleared of the torn paper flap.** The lower-left corner of the
   right-hand page has a torn flap that reaches ~57% of the dossier width —
   it was sitting over the first letters of the wish lines. The report box
   now starts at `58%` (`--dossier-report-x`) and is `28%` wide, which also
   centers it on the page header's own axis (~72%).
2. **Everything after "СТАТУС СПРАВИ: РОЗКРИТО" is centered** — the
   "головна знахідка" line, the wish, "Не втрачай свою цікавість." and the
   closing line — so the personal part reads as a closing note under the
   evidence log. The evidence list and the two labels stay left-aligned.
3. **CASE CLOSED moved slightly lower** (`top: 92.5%`) so it can't graze
   the last line at small viewports. Checked in Chromium at 1280×720,
   1366×768, 1600×900 and 1920×1080 — no clipped content at any of them.

## Previous changes (v9)

Root-caused the report text actually running past its safe area (visible
on a real machine even though my own Chromium render looked fine): the
long paragraphs were set in `'Courier New', 'Courier Prime', monospace`,
and a monospace font's fixed character width varies a lot by platform —
real "Courier New" on Windows runs noticeably wider per character than
whatever Linux/Mac substitutes in when it's missing, so text that fit in
my test environment ran into the red cord and the wax tags on an actual
Windows machine.

Fix: the long-form text (evidence list, status line, the wish, the closing
line) now uses the project's ordinary proportional serif
(`--font-body`: Georgia/Times New Roman) instead of monospace — a
proportional font is both narrower and far more consistent across
platforms. The two short uppercase labels (`РЕЧОВІ ДОКАЗИ`,
`СТАТУС СПРАВИ: РОЗКРИТО`) keep the typewriter/monospace accent, since at
one line each they're in no danger of overflowing regardless of which
"Courier New" substitute shows up. `--dossier-report-w` also came back
down from `34%` to `30%` for a real safety margin before the cord/tags,
independent of font metrics. Verified with a real Chromium render (not
just the earlier static PIL preview) at 1600×900, 1366×768, and 1280×720.

## Previous changes (v8)

Layout-only fixes to the v7 dossier scene, checked against a real Chromium
render (not just the static PIL preview) — nothing about the dossier's
content, position, or the rest of the game changed.

1. **Photo no longer pokes past its frame.** The photo box was sized to
   the transparent window's outer bounding box, but that window is a
   slightly rotated/torn-paper shape — so a plain rectangle at its exact
   bbox showed a sliver of photo past the drawn photo-corners at two
   corners. `--dossier-photo-x/-y/-w/-h` are now inset further inside the
   window (measured by eroding the transparent-pixel mask, not just its
   bbox), so the photo sits cleanly inside the frame at any viewport.
   `--photo-y` also moved from `22%` to `12%` to bring more of the face
   into frame.
2. **Report text widened and tightened.** `--dossier-report-w` grew from
   `31%` to `34%` (as far right as it can go before the red cord/wax
   tags), and every paragraph's `line-height` dropped from ~1.65 to
   ~1.45–1.48. The wish paragraph now wraps to 3 long lines instead of
   4–5 short ones. `text-align:left` is explicit (no `justify` was ever
   used), and every report line shares the same left edge — none had a
   per-element indent to begin with.
3. **No more stamp/text collision.** This mostly resolved itself once the
   text got shorter (above) — the report block now finishes well clear of
   **CASE CLOSED** at every viewport tested (1366×768 and 1600×900).

## Previous changes (v7)

Two changes: the opening scene lost its coffee steam, and the ending was
completely rebuilt around a real detective dossier.

1. **Coffee steam removed.** The cup itself, the rain, and every other
   ambient effect on the board are untouched — only the steam (DOM
   container, CSS rules/keyframes, `initSteam()`, and its `GAME_CONFIG.steam`
   tuning block) is gone.

2. **New final scene: the case dossier.** The old white "final letter" card
   is gone. In its place, `#dossier` — sized to the `London_Final_Dossier`
   artwork's own aspect ratio (so it scales as one piece at any viewport,
   same technique as `.lockbox`/`.stage` elsewhere) — layers three things:
   - `assets/images/dossier/photo.jpg` (your photo), positioned via
     `object-fit:cover` in the transparent "evidence photo" window already
     cut into the dossier art. Reframe it any time via `--photo-x`/`--photo-y`
     in `css/style.css` (currently `50% 22%`, biased toward the top of the
     portrait so the hat/face read clearly).
   - The dossier art itself (`assets/images/dossier/dossier.png`), on top,
     so its own photo-corners/paperclip/frame overlap the photo naturally.
   - The report text — evidence recap, case status, and the birthday
     wish — as real HTML/CSS on the blank right-hand page, not baked into
     the image, so it's easy to edit later.

   Everything reveals on a fixed timeline (`DOSSIER_TIMELINE` in
   `js/game.js`) once the scene appears: dossier → photo → evidence list →
   status → the wish → **CASE CLOSED** stamp → **ПОВЕРНУТИСЯ НА МАПУ**
   button. Change the pacing by editing the `delayMs` values there — nothing
   else needs to change. The investigation itself (clues, code `674`,
   right/wrong-answer handling, the box → envelope hand-off) is untouched.

3. **Return button is now Ukrainian** ("ПОВЕРНУТИСЯ НА МАПУ") and still
   calls the same `returnToJourney()` stub — only the label changed.

## Previous changes (v6)

A new interactive object: **the sealed letter itself now lives inside the
code box**, and taking it is what carries you into the next scene — instead
of the scene change happening automatically on a timer.

1. **Sealed letter added to the open box.** Once the box is unlocked and
   swings open (`.lockbox.is-open`), a new item — `#box-envelope`, using
   your `letter_close.png` — fades in, resting in the velvet-lined lid
   interior (`--box-envelope-x/-y/-w` in `css/style.css`). It's invisible
   and unclickable before the box opens, and hovering it lifts/glows the
   same way the desk evidence does.
2. **The board no longer fades out on its own.** Previously `unlockSuccess()`
   auto-advanced to the envelope scene ~2.6s after the code was solved.
   Now it only opens the box and stops — the player has to actually click
   the letter sitting inside it (`initBoxEnvelope()` / `takeEnvelopeFromBox()`
   in `js/game.js`) to trigger the fade-to-black and the scene change. This
   also guards against double-triggering with an `envelopeTaken` flag.
3. **Envelope scene rebuilt around your two envelope images.** The old
   CSS-drawn flap-and-wax-seal animation (`.envelope-flap`/`.envelope-seal`)
   is gone. `#envelope` now crossfades between `letter_close.png` and
   `letter_open.png` directly — since the two images have different aspect
   ratios, both are centered independently inside a fixed-size container
   (`.envelope-img`, `top/left:50%` + `translate(-50%,-50%)`,
   `max-width/max-height:100%`) rather than sharing one box's dimensions,
   so neither image gets stretched or cropped.

Both new images live in `assets/images/envelope/` and are reused in both
places (the box and the envelope scene) — one crop, two spots.

## Previous changes (v5)

Two fixes to the coffee steam added in the previous pass:

1. **Origin moved off the cup itself.** The steam's starting point
   (`--steam-y`) was measured slightly too low, at 84.7% of the board —
   which sat inside the cup's rim rather than above the coffee. Re-measured
   directly against the cup in `Game_Board.png`: it's now 82.2%, right at
   the back edge of the rim, with a clear gap before the porcelain. The
   column was also narrowed (`--steam-w`: 7% → 6%) so wisps can't drift
   sideways into the rim either.
2. **Redesigned to actually look like steam**, not a soft blurry blob.
   Each wisp is now a tall, tapered vertical trail (built from a gradient,
   not a round `radial-gradient`) that curls with an S-shaped sway
   (alternating left/right drift via extra keyframe stops), stretches
   taller and narrower as it rises (`scaleX`/`scaleY`), rotates slightly for
   a twisting look, and blurs progressively more as it climbs — mimicking
   real steam diffusing into the air rather than just fading in place.
   `initSteam()` in `js/game.js` also now varies each wisp's height, not
   just its width, for a less uniform cluster.

## Previous changes (v4)

**Coffee steam added.** Soft wisps rise off the teacup on the desk
(bottom-right of the board), built the same way as the window rain: several
independent wisps (`initSteam()` in `js/game.js`), each with its own
randomized size, rise speed, sway and opacity, looping continuously.
Positioned via `--steam-x/--steam-y/--steam-w/--steam-h` at the top of
`css/style.css`, and tunable via `GAME_CONFIG.steam` in `js/game.js` (wisp
count, min/max duration).

## Previous changes (v3)

1. **Password changed to `674`** (was `754`) — see `GAME_CONFIG.password` at
   the top of `js/game.js`.
2. **The digit windows now fade out when the box opens.** Previously the
   drum digits stayed visible on top of the open-box artwork forever;
   `.lockbox.is-open .drums` now fades their opacity to 0 over 0.4s (roughly
   matching the 0.55s closed→open crossfade), and the drums are also
   click-disabled once open so there's nothing live left to interact with
   on an already-solved box.

## What changed in this pass

1. **Newspaper / watch / letter swapped** for the new versions you attached
   (the Snoopy & Woodstock set). Same crop treatment as before — tight alpha
   bounding box, small padding — so the drop-shadow follows each item's real
   silhouette. Composition coordinates (position/size/rotation) are
   untouched, since the new art has the same aspect ratios as before.

   Two notes on the new art itself (not something I changed, just flagging
   in case it's not intentional):
   - The new **newspaper** headline is now "Mysterious Detectives Spotted in
     London" and no longer contains the `SEVEN` acrostic riddle text from
     the brief — so the "→ 7" clue text isn't in this image anymore.
   - The new **watch** hint reads "Don't ask what time it is. Ask what time
     has lost. Look twice." instead of "Time lies. The hands do not. X − V" —
     so the "→ 5" riddle path has changed too.
   I didn't rewrite the puzzle logic to match (password is still hard-coded
   as `754` in `GAME_CONFIG`, independent of what's printed on the images) —
   just say if you'd like the code/hints reconciled with the new artwork's
   text, or if these images are still placeholders themselves.

2. **Rain rebuilt from scratch.** The old version was a repeating diagonal
   gradient (visibly "striped"). It's now ~45 individual raindrop elements
   generated in JS (`initRain()` in `js/game.js`), each with its own random
   length, thickness, speed, opacity, and slight rightward drift so they
   don't fall in sync or in a visible pattern. Still clipped precisely to
   the window pane in the board photo, still nearly free (pure CSS
   transform/opacity animation, no canvas). Tune density/speed via
   `GAME_CONFIG.rain` at the top of `js/game.js`.

3. **Red threads and the "examined" mark removed.** Clicking a clue still
   privately marks it as viewed (`gameState.newspaperViewed` etc. — this is
   what unlocks the code box once all three are found), but nothing is drawn
   on the board to show it: no thread, no stamp, no icon. The board looks
   exactly the same before and after you've examined something.

## Composition variables (unchanged)

Still at the top of `css/style.css`:

```css
--newspaper-x: 29%;  --newspaper-y: 43%;  --newspaper-w: 25%;  --newspaper-rot: -3deg;
--watch-x:     74%;  --watch-y:     28%;  --watch-w:     16%;  --watch-rot:      4deg;
--letter-x:    71%;  --letter-y:    61%;  --letter-w:    19%;  --letter-rot:     3deg;
--box-x:       50%;  --box-y:       83%;  --box-w:       27%;
```

## Everything else (unchanged from the previous pass)

- Password / birthday message / sound file paths → `GAME_CONFIG` at the top
  of `js/game.js`.
- `assets/audio/` — drop matching `.mp3` files in; missing ones are silently
  skipped.
- `returnToJourney()` at the bottom of `js/game.js` is still an empty hook
  — tell me how it should hand off to the PowerPoint and I'll wire it in.
