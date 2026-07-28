//GSAP and all its plugins became free as of 3.13, folded into the standard npm package —
//no more Club GreenSock license needed. Registered once here instead of every file calling
//registerPlugin on its own subset.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)

export { gsap, ScrollTrigger, SplitText, CustomEase }
