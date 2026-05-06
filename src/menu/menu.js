export class Menu {

    constructor() {
        this.menuContainer = document.querySelector('.menu-wrapper')
        this.menuLinks = document.querySelectorAll('.menu-large-link')
        this.smallLinks = document.querySelectorAll('.menu-small-link')
        this.menuButton = document.querySelector('.menu_button')
        this.runningLine = document.querySelector('.running_line')
        this.menuAnimation = gsap.timeline().pause()

    }

    setup(lenis) {

        this.menuContainer.classList.remove('w-condition-invisible')

        gsap.set(this.menuLinks, {
            filter: "blur(10px)",
            autoAlpha: 0
        })

        gsap.set(this.menuContainer, {
            autoAlpha: 0
        })

        gsap.set(this.smallLinks, {
            autoAlpha: 0,
            yPercent: -100
        })

        this.menuAnimation.to(this.menuContainer, {
            autoAlpha: 1
        })

        console.log(this.runningLine)

        if (this.runningLine) {
            this.menuAnimation.to(this.runningLine, {
                autoAlpha: 0
            }, "<")
        }

        this.menuAnimation.to(this.menuLinks, {
            filter: "blur(0px)",
            autoAlpha: 1,
            stagger: 0.1
        })
        this.menuAnimation.to(this.smallLinks, {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.2
        }, "<")

        let menuOpen = false

        //Click on Button
        this.menuButton.addEventListener('click', (e) => {
            if (!menuOpen) {

                this.menuAnimation.play()
                menuOpen = true
                lenis.stop()

            } else if (menuOpen) {

                this.menuAnimation.reverse()
                menuOpen = false
                lenis.start()

            }

        }, true)


        this.menuLinks.forEach((link) => {

            link.addEventListener('mouseover', (e) => {
                gsap.to(link, {
                    filter: "blur(3px)",
                })
            })

            link.addEventListener('mouseout', (e) => {
                gsap.to(link, {
                    filter: "blur(0px)",
                })
            })

            link.addEventListener('click', (e) => {
                this.menuAnimation.reverse()
                menuOpen = false
                lenis.start()
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

            link.addEventListener('click', (e) => {
                this.menuAnimation.reverse()
                menuOpen = false
                lenis.start()
            })

        })

    }

}