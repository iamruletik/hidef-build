export class mainView {

    constructor() {
        this.runningLineTimeline = gsap.timeline().pause()
        this.runningLine = document.querySelectorAll('.running_line_svg')
    }

    setup() {

        this.runningLineTimeline.to(this.runningLine, {
            xPercent: -100,
            ease: "none",
            duration: 50,
            repeat: -1
        })

    }

    run() {
        this.runningLineTimeline.play()
    }

}