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

        gsap.registerPlugin(TextPlugin, SplitText, CustomEase)

        console.log(menuEvents)

        this.menuContainer.classList.remove('w-condition-invisible')

        //Split each large-link label into letters with a solid double one letter-height BELOW, clipped by the
        //div's single-line slot. Done here up front so both the open reveal and the hover roll can drive them
        let revealEase = CustomEase.create("menuReveal", "0,0.5,0.5,1")
        let allChars = []

        this.menuLinks.forEach((link) => {
            let inner = link.querySelector('div')
            inner.style.overflow = 'hidden'

            let split = new SplitText(inner, { type: 'chars' })
            let charHeight = split.chars[0].offsetHeight

            split.chars.forEach((char) => {
                char.style.display = 'inline-block'
                char.style.textShadow = `0 ${charHeight}px 0 currentColor`
            })

            link._chars = split.chars
            allChars.push(...split.chars)
        })

        //Idle open state is yPercent -100: the double (which sits a letter-height below each char) fills the
        //slot, the real letter parked just above it. Hidden state is -200 — both pushed above the slot, empty.
        gsap.set(allChars, { yPercent: -200 })

        //Arrow (::before) hidden — animated in via a CSS var since GSAP can't touch pseudo-elements
        gsap.set(this.menuLinks, { '--arrow-o': 0 }, "<")

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

        //Reveal — the double descends from above into the slot (top -> bottom)
        this.menuAnimation.to(allChars, {
            yPercent: -100,
            stagger: 0.03,
            ease: revealEase
        }, "<")

        //Fade the "<" arrows in alongside
        this.menuAnimation.to(this.menuLinks, {
            '--arrow-o': 1,
            stagger: 0.03
        }, "<")

        this.menuAnimation.to(this.smallLinks, {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.2
        }, "<")


        let menuOpen = false

        //Click on Button
        this.menuButton.addEventListener('click', (e) => {
            //Ignore clicks while the open/close is still playing — spamming play/reverse leaves things half-set
            if (this.menuAnimation.isActive()) return

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

            //One-armed-bandit roll — real letter drops down from above into the slot, the double slides out the
            //bottom (top -> bottom). Rest shows the double (-100), hover lands on the real letter (0)
            link.addEventListener('mouseenter', (e) => {
                //Don't let the hover roll steal the letters while the menu itself is animating
                if (this.menuAnimation.isActive()) return
                gsap.fromTo(link._chars,
                    { yPercent: -100 },
                    { yPercent: 0, stagger: 0.03, ease: 'expo.inOut', overwrite: true }
                )
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