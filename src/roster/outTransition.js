export class ArtistToRosterTransition {

    constructor(barbaData) {
        this.floatingImage = document.querySelector('.roster-floating-image-container')
        this.dummy = document.querySelector('.dummy-floating-container')
        this.data = barbaData
    }

    animate() {

        console.log(this.data)



        try {

            this.animateList(this.data.next.container)

            let finPos = this.dummy.getBoundingClientRect()
            let slider = this.floatingImage.querySelector(`[data-slider-state="active"]`)
            let pagination = slider.querySelector('.swiper-pagination')
            pagination.style.opacity = 0

            gsap.to(this.floatingImage, {
                x: finPos.left,
                y: finPos.top,
                scale: 0.4,
                ease: "expo.inOut",
                duration: 0.7
            })

        }

        catch (error) {
            console.log(error)
        }


    }

    animateList(data) {

        try {
            let header = data.querySelector('.roster-list-table-header')
            let items = data.querySelectorAll('.roster-list-table-content-item')

            gsap.from(header, {
                autoAlpha: 0,
                y: -10
            })

            gsap.fromTo(header, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })

            gsap.from(items, {
                autoAlpha: 0,
                y: -10,
                stagger: 0.1
            })

            gsap.fromTo(items, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })

        } catch (error) {
            console.log(error)
        }


    }


}