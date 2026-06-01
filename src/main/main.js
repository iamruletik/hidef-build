export class mainView {

    constructor() {
        this.runningLineTimeline = gsap.timeline().pause()
        this.runningLine = document.querySelectorAll('.running_line_svg')
        this.eventCylinderItems = document.querySelectorAll('.event_archive-item')
        this.eventSection = document.querySelector(".event_archive-section")
        this.eventBanner = document.querySelector('.event_archive-banner')
        this.eventSliderWrapper = document.querySelector('.event_archive-slider-wrapper')
        this.eventSlider = document.querySelector('.event_archive-slider')
        this.eventSliderTimeline = gsap.timeline({            
            scrollTrigger: {
                trigger: this.eventSection,
                start: "top bottom",
                end: "bottom",
                scrub: 1,
                //markers: true
            }})
    }

    setup() {

        this.runningLineTimeline.to(this.runningLine, {
            xPercent: -100,
            ease: "none",
            duration: 50,
            repeat: -1
        })


        //Unhide All Slider Items
        this.eventCylinderItems.forEach((item) => {
            item.classList.remove("w-condition-invisible")
        })

        //Change Layout for CSS working properly
        this.eventBanner.prepend(this.eventSlider)
        this.eventSliderWrapper.remove()

        this.eventSliderTimeline.to(this.eventSlider, {
            rotationX: "-15deg",
            rotationZ: "-15deg",
            rotationY: "720deg",
        })
            .to(this.eventCylinderItems, {
                "--zTranslation": "35vw",
            },"<")


    }

    run() {
        this.runningLineTimeline.play()
    }

}