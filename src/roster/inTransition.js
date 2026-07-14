

export class RosterToArtistTransition {

    constructor(barbaData) {
        this.floatingImage = document.querySelector('.roster-floating-image-container')
        this.data = barbaData
    }

    animate() {

        gsap.registerPlugin(SplitText)

        console.log(this.data)

        this.animateContent(this.data.next.container)

        try {

            let scaleFactorY = window.innerHeight / this.floatingImage.offsetHeight
            let scaleFactorX = (window.innerWidth / 2) / this.floatingImage.offsetWidth

            let slider = this.floatingImage.querySelector(`[data-slider-state="active"]`)
            let pagination = slider.querySelector('.swiper-pagination')
            pagination.style.opacity = 1

            gsap.to(this.floatingImage, {
                x: "50vw",
                y: 0,
                scale: 1,
                ease: "expo.inOut",
                duration: 0.7,
                autoAlpha: 1,
                overwrite: true
            })

        } catch (error) {
            console.log(error)
        }



    }

    animateContent(data) {

        try {
            let header = data.querySelector('.artist-content-container-header')
            let text = data.querySelector('.artist-content-container-text')
            let link = data.querySelectorAll('.default-button')
            let tags = data.querySelector('.artist-specialty-tags')

            let splitHeader = SplitText.create(header, { type: "words" })

            gsap.from(splitHeader.words, {
                autoAlpha: 0,
                y: -10,
                stagger: {
                    amount: 0.5
                }
            })

            gsap.fromTo(splitHeader.words, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })


            let splitText = SplitText.create(text, { type: "words" })

            gsap.from(splitText.words, {
                autoAlpha: 0,
                y: -10,
                stagger: {
                    amount: 0.5
                }
            })


            gsap.fromTo(splitText.words, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })

            gsap.from(link, {
                autoAlpha: 0,
                y: -10
            })


            gsap.from(tags, {
                autoAlpha: 0,
                y: -10
            })

            gsap.fromTo(tags, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })


        } catch (error) {
            console.log(error)
        }



    }




}
