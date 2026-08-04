import { gsap, ScrollTrigger } from '../core/gsap'
import { BasePage } from '../core/BasePage'
import { addLineReveal, addItemReveal } from '../core/textReveal'

export class AboutPage extends BasePage {

    constructor(barbaContainer) {
        super(barbaContainer)
        this.video = document.querySelector(".experience-content-video-container")
        this.experienceContent = document.querySelector(".experience-content")
        this.mainContainer = document.querySelector(".about-content-wrapper")
        this.wheelContainer = document.querySelector(".wheel-content")
        this.wheelSvg = document.querySelector(".wheel-svg")
        this.bigImageWrapper = document.querySelector(".quality-content-wrapper")
        this.qualityImages = ["apic-1", "apic-2", "apic-3", "apic-4"]
            .map((className) => this.bigImageWrapper.querySelector(`.${className}`))

        //Wrapped in ctx.add so gsap.context actually tracks these — they're built here in the
        //constructor rather than setup(), which is the one place ctx.add can't just wrap a whole method
        this.ctx.add(() => {
            this.videoTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: this.experienceContent,
                    scrub: true,
                    start: "top top",
                    end: "bottom bottom",
                    //markers: true
                }
            })
            this.wheelTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: this.wheelContainer,
                    scrub: true,
                    start: "top bottom",
                    end: "bottom bottom",
                    //markers: true
                }
            })
            this.bigImageTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: this.bigImageWrapper,
                    scrub: true,
                    start: "top center",
                    end: "bottom bottom",
                    //markers: true
                }
            })
            this.qualityImagesTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: this.bigImageWrapper,
                    scrub: true,
                    start: "top bottom",
                    end: "+=400%",
                    //markers: true
                }
            })
        })
    }


    setup() {

        this.videoTimeline.set(this.video, { scale: 0.25, duration: 50 })
        this.videoTimeline.to(this.video, { scale: 1, duration: 50 })


        this.wheelTimeline.to(this.video, { scale: 0.5, duration: 39 })
        this.wheelTimeline.to(this.mainContainer, { backgroundColor: "#0c0c0c", duration: 1 }, "<")
        this.wheelTimeline.fromTo(this.wheelSvg, { rotation: 60 }, { rotation: -120, duration: 60 }, "<")
        this.wheelTimeline.set(this.mainContainer, { backgroundColor: "#ffffff" })

        //Distinct end distance + duration per image so they travel different amounts at
        //different rates within the same scrubbed range — that's what reads as parallax.
        //translateY (via gsap's y shorthand) instead of bottom so this doesn't depend on
        //the element actually being position: absolute — transforms work regardless.
        const travelDistances = ["80vh", "140vh", "100vh", "120vh"]
        const durations = [40, 65, 30, 55]

        this.qualityImagesTimeline.fromTo(this.qualityImages,
            { y: "100vh" },
            {
                y: (i) => `-${travelDistances[i]}`,
                duration: (i) => durations[i],
                stagger: 10
            }, 0)

        //Splitting this early (right on mount) measures line breaks against mobile layout that isn't
        //settled yet — waiting on fonts didn't fix it, so the real split is deferred all the way to
        //revealMainScreen() below, once the page has actually been sitting there rendered. Hide via
        //plain autoAlpha now (no SplitText needed for that) so nothing flashes un-split/unhidden behind
        //the cover in the meantime.
        this.heroTextTargets = [
            this.container.querySelector('.about-content-headline-header'),
            ...this.container.querySelectorAll('.about-content-headline-description-text'),
            ...this.container.querySelectorAll('.about-headline-category')
        ].filter(Boolean)

        this.ctx.add(() => gsap.set(this.heroTextTargets, { autoAlpha: 0 }))

        //Experience section — split the h2/text divs directly, not their wrapping containers (same
        //deepSlice-cloning risk as the hero headline). Revealed once, on scroll into view.
        let experienceHeader = this.container.querySelector('.expirience-content-description-element-header h2')
        let experienceText = this.container.querySelector('.expirience-content-description-element-text div')
        let experienceLineTargets = [experienceHeader, experienceText].filter(Boolean)

        if (experienceLineTargets.length) {
            this.ctx.add(() => {
                let experienceRevealTimeline = gsap.timeline({ paused: true })
                addLineReveal(experienceRevealTimeline, experienceLineTargets, { position: 0 })

                ScrollTrigger.create({
                    trigger: this.experienceContent,
                    start: 'top 60%',
                    once: true,
                    onEnter: () => experienceRevealTimeline.play()
                })
            })
        }

        //Quality section — .roster-list-table-header-item is a reused icon+label row (display:flex),
        //so split its text div directly rather than the flex row itself. The description div is a
        //plain (classless) child, not itself flex, so no override needed there.
        let qualityContent = this.container.querySelector('.quality-content')
        let qualityLabel = qualityContent?.querySelector('.roster-list-table-header-item div:not(.icon-dot-svg)')
        let qualityText = qualityContent?.querySelector(':scope > div:not(.roster-list-table-header-item)')
        let qualityLineTargets = [qualityLabel, qualityText].filter(Boolean)

        if (qualityContent && qualityLineTargets.length) {
            this.ctx.add(() => {
                let qualityRevealTimeline = gsap.timeline({ paused: true })
                addLineReveal(qualityRevealTimeline, qualityLineTargets, { position: 0 })

                ScrollTrigger.create({
                    trigger: qualityContent,
                    start: 'top 60%',
                    once: true,
                    onEnter: () => qualityRevealTimeline.play()
                })
            })
        }

    }

    //Played once the page is actually visible (after preloader on first load / as the cover lifts on nav).
    //Masked line reveal built here rather than in setup() — see the setup() comment on heroTextTargets.
    revealMainScreen() {
        this.ctx.add(() => {
            let mainScreenTimeline = gsap.timeline({ paused: true })

            //Split the h1 itself, not its wrapping div — splitting the div (whose only child is one h1
            //spanning multiple lines) made deepSlice clone the h1 once per line, so each line ended up
            //independently styled by the browser's/Webflow's own h1 rules instead of a plain line wrapper
            let headline = this.container.querySelector('.about-content-headline-header h1')

            if (headline) {
                //Force block for the same reason as the description text below — SplitText assumes normal
                //block text flow when it inserts each line as a direct child of the split target
                headline.style.display = 'block'
                let headlineSplit = addLineReveal(mainScreenTimeline, headline, { position: 0, linesClass: 'about-headline-header-line' })
                //text-indent only meant for the visual first line, but SplitText turns each line into
                //its own block box, and text-indent inherits into all of them — reset it past line 1
                headlineSplit.lines.slice(1).forEach((line) => { line.style.textIndent = '0' })
            }

            //Two elements share this class (desktop/mobile variants of the same copy) — only split the
            //one that's actually rendered, SplitText can't measure line breaks on a display:none element
            let descriptionTexts = [...this.container.querySelectorAll('.about-content-headline-description-text')]
            let visibleDescriptionText = descriptionTexts.find((el) => el.offsetParent !== null)

            if (visibleDescriptionText) {
                //.mobile variant is display:flex in Webflow (just for the padding-left indent) — SplitText
                //inserts each line as a direct child, and flex items size to content instead of stretching
                //full-width like block children do, which is what was causing the mis-wrapped/gappy lines
                visibleDescriptionText.style.display = 'block'
                addLineReveal(mainScreenTimeline, visibleDescriptionText, { position: 0 })
            }

            let categoryItems = this.container.querySelectorAll('.about-headline-category')
            if (categoryItems.length) addItemReveal(mainScreenTimeline, categoryItems, { position: '>-0.4' })

            gsap.set(this.heroTextTargets, { autoAlpha: 1 })
            mainScreenTimeline.play()
        })
    }


}