export class Footer {

    constructor() {
        this.footerLogoInstance = document.querySelector('.footer-logo-instance-stretched')
        this.footerTrigger = document.querySelector('.footer-content-grid')
        this.footerEmail = document.querySelector('.footer-content-email-link')
        this.smallLinks = document.querySelectorAll('.footer-link')
        this.footerEndTrigger = document.querySelector('.footer-content-container')
        this.footerTimeline = gsap.timeline()
    }

    setup() {
        this.footerTimeline.to(this.footerLogoInstance, {
            scrollTrigger: {
                trigger: this.footerTrigger,
                endTrigger: this.footerEndTrigger,
                start: 'bottom bottom',
                end: 'bottom bottom',
                //markers: true,
                scrub: true
            },
            height: '100%',
            ease: "none"
        })


            this.footerEmail.addEventListener('mouseover', (e) => {
                gsap.to(this.footerEmail, {
                    filter: "blur(3px)",
                })
            })

            this.footerEmail.addEventListener('mouseout', (e) => {
                gsap.to(this.footerEmail, {
                    filter: "blur(0px)",
                })
            })

        this.smallLinks.forEach((link) => {

            link.addEventListener('mouseover', (e) => {
                gsap.to(link, {
                    filter: "blur(1.5px)",
                })
            })

            link.addEventListener('mouseout', (e) => {
                gsap.to(link, {
                    filter: "blur(0px)",
                })
            })

        })
    }

    update() {
        ScrollTrigger.refresh()
    }


}