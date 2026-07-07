export class Menu {

    constructor() {
        this.menuContainer = document.querySelector('.menu-wrapper')
        this.menuLinks = this.menuContainer.querySelectorAll('.menu-large-link')
        this.smallLinks = null
        this.menuButton = document.querySelector('.menu_button')
        this.menuAnimation = gsap.timeline().pause()
        this.menuDummy = document.querySelector('.menu-dummy')
    }

    getLinks() {

        let items = this.menuDummy.querySelectorAll(".menu-dummy-link")
        let linksContainer = this.menuContainer.querySelector(".menu-content-contacts-socials")

        items.forEach((link) => {

            let name = link.dataset.linkName
            let url = link.dataset.linkUrl

            let element = document.createElement('a')
            element.classList.add('link-element')
            element.classList.add('menu-small-link')
            element.href = url
            element.innerHTML = `<div>${name}</div`


            linksContainer.append(element)

        })

    }

    setup(lenis, menuEvents) {

        this.getLinks()

        this.smallLinks = this.menuContainer.querySelectorAll('.menu-small-link')

        gsap.registerPlugin(TextPlugin)

        console.log(menuEvents)

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

        this.menuAnimation.to("#menu-button-text", {
            text: "CLOSE",
            ease: "none",
            duration: 0.3
        }, "<")

        this.menuAnimation.to(this.menuLinks, {
            filter: "blur(0px)",
            autoAlpha: 1,
            stagger: 0.1
        }, "<")

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
                document.dispatchEvent(menuEvents.openMenu)

            } else if (menuOpen) {

                this.menuAnimation.reverse()
                menuOpen = false
                lenis.start()
                document.dispatchEvent(menuEvents.closeMenu)

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
                //Only revert the scene here for same-page links; barba handles the rest
                if (link.href === window.location.href) document.dispatchEvent(menuEvents.closeMenu)
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
                //Only revert the scene here for same-page links; barba handles the rest
                if (link.href === window.location.href) document.dispatchEvent(menuEvents.closeMenu)
            })

        })

    }

}