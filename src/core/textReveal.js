import { gsap, SplitText } from './gsap'

//Add a masked line reveal for `targets` to timeline `tl` at `position`. Splits into lines clipped by a
//per-line mask and rolls them up from below. For multi-line TEXT (headlines, paragraphs).
//Do NOT use on elements whose CSS decorates inner divs (e.g. `div::before` counters) — SplitText wraps
//the text in extra divs, which multiplies those pseudo-elements. Use addItemReveal for those.
//linesClass is opt-in: pass 'reveal-line' only for tight-line-height headlines whose glyphs would clip
//against the mask (see general.css) — it adds padding that looks wrong on normal-line-height text.
export function addLineReveal(tl, targets, { duration = 0.8, stagger = 0.05, ease = 'power2.out', position, linesClass } = {}) {
    let split = new SplitText(targets, { type: 'lines', mask: 'lines', ...(linesClass ? { linesClass } : {}) })
    tl.from(split.lines, { yPercent: 100, duration, stagger, ease }, position)
    return split
}

//Add a masked reveal for a list of single-line items that are ALREADY clipped (overflow:hidden on the
//item itself). Slides each item's inner element up — no SplitText, so inner-div CSS (counters, ::before)
//is left intact.
export function addItemReveal(tl, items, { duration = 0.8, stagger = 0.05, ease = 'power2.out', position } = {}) {
    let inners = [...items].map((item) => item.firstElementChild).filter(Boolean)
    tl.from(inners, { yPercent: 100, duration, stagger, ease }, position)
    return inners
}

//Standalone convenience: a masked line reveal as its own paused timeline.
export function revealLines(targets, options = {}) {
    let tl = gsap.timeline({ paused: true })
    addLineReveal(tl, targets, options)
    return tl
}
