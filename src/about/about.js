import { gsap } from '../core/gsap'
import { BasePage } from '../core/BasePage'

export class AboutPage extends BasePage {

    constructor(barbaContainer) {
        super(barbaContainer)
        this.video = document.querySelector(".experience-content-video-container")
        this.experienceContent = document.querySelector(".experience-content")
        this.mainContainer = document.querySelector(".about-content-wrapper")
        this.wheelContainer = document.querySelector(".wheel-content")
        this.wheelSvg = document.querySelector(".wheel-svg")
        this.bigImage = document.querySelector(".quality-content-image")
        this.bigImageWrapper = document.querySelector(".quality-content-wrapper")

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
        })
    }


    setup() {

        this.videoTimeline.set(this.video, { scale: 0.25, duration: 50 })
        this.videoTimeline.to(this.video, { scale: 1, duration: 50 })


        this.wheelTimeline.to(this.video, { scale: 0.5, duration: 39 })
        this.wheelTimeline.to(this.mainContainer, { backgroundColor: "#0c0c0c", duration: 1 }, "<")
        this.wheelTimeline.fromTo(this.wheelSvg, { rotation: 60 }, { rotation: -120, duration: 60 }, "<")
        this.wheelTimeline.set(this.mainContainer, { backgroundColor: "#ffffff" })

        this.bigImageTimeline.to(this.bigImage, {
            yPercent: -25
        })

    }


}