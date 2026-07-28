import { gsap, ScrollTrigger } from '../core/gsap'
import barba from '@barba/core'

export default function headerInit(lenis) {

    let headerLogo = document.querySelector(".hidef-logo-link")
    let descriptor = document.querySelector(".logo_description")

    headerLogo.addEventListener("click", (e) => {
        //Already on main — don't swap containers, just scroll back to top
        let namespace = document.querySelector('[data-barba="container"]')?.dataset.barbaNamespace
        if (namespace === 'main') {
            lenis.scrollTo(0)
            return
        }
        barba.go("/")
    }, true)

    //Header shrink: logo scales down and the descriptor slides out once scrolled past the top, then
    //grows back to full when the footer is reached. <main> is the barba container (swapped on every
    //navigation), so the trigger anchored to it dies after the first page — rebuild on each enter
    let shrinkTl, scrollST, footerST

    function buildHeaderScroll() {
        if (scrollST) scrollST.kill()
        if (footerST) footerST.kill()
        if (shrinkTl) shrinkTl.kill() //reverse (beforeLeave) already restored full state — no set/jump needed

        let main = document.querySelector("main")           //fresh container each page
        let footer = document.querySelector(".footer-wrapper") //persistent
        if (!main) return

        //Full -> shrunk, paused; driven by the two triggers below
        shrinkTl = gsap.timeline({ paused: true })
        shrinkTl.to(headerLogo, { scale: 0.5 })
        shrinkTl.to(descriptor, { xPercent: -100 }, "<")

        //Shrink once scrolled past the top; full again at the very top
        scrollST = ScrollTrigger.create({
            trigger: main,
            start: "top+=100 top",
            onEnter: () => shrinkTl.play(),
            onLeaveBack: () => shrinkTl.reverse()
        })

        //Full again when the footer reaches view; shrink again on the way back up
        if (footer) {
            footerST = ScrollTrigger.create({
                trigger: footer,
                start: "top bottom",
                onEnter: () => shrinkTl.reverse(),
                onLeaveBack: () => shrinkTl.play()
            })
        }
    }

    //Header floats above the transition cover, so it stays visible during a page change. If it's
    //currently shrunk, grow it smoothly back to full now (over the cover) instead of letting the
    //afterEnter rebuild snap it. barba order: beforeLeave -> ... -> afterEnter, so this finishes
    //during the cover, before the rebuild
    barba.hooks.beforeLeave(() => { if (shrinkTl) shrinkTl.reverse() })

    barba.hooks.afterEnter(() => buildHeaderScroll())
    buildHeaderScroll() //first load
}