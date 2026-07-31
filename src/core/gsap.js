//GSAP and all its plugins became free as of 3.13, folded into the standard npm package —
//no more Club GreenSock license needed. Registered once here instead of every file calling
//registerPlugin on its own subset.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

//Mobile URL bar show/hide changes viewport height and makes ScrollTrigger refresh mid-scroll — pins
//recalc and jump. Ignore those small height changes (real resize/orientation still refreshes). NOT
//normalizeScroll: that hijacks touch scrolling and would fight Lenis (which drives ScrollTrigger.update).
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, SplitText, CustomEase }
