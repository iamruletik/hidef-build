import { gsap, SplitText, CustomEase } from '../core/gsap'

export class Menu {

    constructor() {
        this.menuContainer = document.querySelector('.menu-wrapper')
        this.menuLinks = this.menuContainer.querySelectorAll('.menu-large-link')
        this.smallLinks = null
        this.menuButton = document.querySelector('.menu_button')
        this.menuButtonText = this.menuButton.querySelector('#menu-button-text')
        this.menuAnimation = gsap.timeline().pause()
        this.containerAnimation = gsap.timeline().pause()
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
            element.innerHTML = `<div>${name}</div>`


            linksContainer.append(element)

        })

    }

    //Build the MENU<->CLOSE button swap: #menu-button-text becomes a fixed-height mask holding two
    //absolutely-positioned, centered labels (each split to chars). The button widens by animating the
    //mask's width between the two measured word widths. Driven by this.buttonTl — play = open (CLOSE),
    //reverse = close (MENU). Reverse of the open timeline, per design
    setupMenuButton() {
        let mask = this.menuButtonText
        let ease = 'expo.inOut'

        let makeLabel = (text) => {
            let label = document.createElement('div')
            label.textContent = text
            label.setAttribute('aria-hidden', 'true') //visual only — button is labelled below
            label.style.position = 'absolute'
            label.style.top = '0'
            label.style.whiteSpace = 'nowrap'
            return label
        }

        let menuLabel = makeLabel('MENU')
        let closeLabel = makeLabel('CLOSE')

        mask.textContent = ''
        mask.append(menuLabel, closeLabel)

        //Measure each word's natural width BEFORE centering — left/right:0 below would force full-mask width
        let menuWidth = menuLabel.offsetWidth
        let closeWidth = closeLabel.offsetWidth
        let lineHeight = menuLabel.offsetHeight

        //Mask: fixed height so the absolute labels don't collapse it, width starts at MENU and animates
        mask.style.position = 'relative'
        mask.style.overflow = 'hidden'
        mask.style.height = lineHeight + 'px'
        mask.style.width = menuWidth + 'px'

        //Labels span the mask and center their text, so they stay centered as the mask widens
        let labels = [menuLabel, closeLabel]
        labels.forEach((label) => {
            label.style.left = '0'
            label.style.right = '0'
            label.style.textAlign = 'center'
        })

        //Keep the button labelled for screen readers (visual labels are aria-hidden)
        let anchor = this.menuButton.querySelector('.default-button')
        if (anchor) anchor.setAttribute('aria-label', 'Menu')

        let menuChars = new SplitText(menuLabel, { type: 'chars' }).chars
        let closeChars = new SplitText(closeLabel, { type: 'chars' }).chars

        //inline chars don't take transforms — same as the menu-link chars above
        gsap.set([...menuChars, ...closeChars], { display: 'inline-block' })
        gsap.set(closeChars, { yPercent: 100 }) //CLOSE parked below the mask

        this.buttonTl = gsap.timeline({ paused: true })
        this.buttonTl.to(menuChars, { yPercent: -100, stagger: 0.03, ease }, 0)  //MENU up & out
        this.buttonTl.to(mask, { width: closeWidth, ease }, 0)                    //button widens
        this.buttonTl.to(closeChars, { yPercent: 0, stagger: 0.03, ease }, 0)     //CLOSE up & in
    }

    setup(lenis, menuEvents) {

        this.getLinks()

        this.smallLinks = this.menuContainer.querySelectorAll('.menu-small-link')

        console.log(menuEvents)

        this.menuContainer.classList.remove('w-condition-invisible')

        this.setupMenuButton()

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

        //Reveal — the double descends from above into the slot (top -> bottom)
        this.menuAnimation.to(allChars, {
            yPercent: -100,
            stagger: 0.02,
            ease: revealEase
        }, "<")

        //Fade the "<" arrows in alongside
        this.menuAnimation.to(this.menuLinks, {
            '--arrow-o': 1,
            //stagger: 0.02
        }, "<")

        this.menuAnimation.to(this.smallLinks, {
            yPercent: 0,
            autoAlpha: 1,
            stagger: 0.1
        }, "<")

        //Separate timeline so it can be held open (see navigatingAway below) instead of always
        //reversing in lockstep with the content — moving to another page needs the container to
        //stay visible until the transition overlay has covered the screen, not fade with the rest
        this.containerAnimation.to(this.menuContainer, {
            autoAlpha: 1
        })


        let menuOpen = false

        //Container only starts fading once the content has actually finished retracting — sequential,
        //not simultaneous, so the backdrop doesn't disappear while letters/arrows are still closing
        const closeContainer = () => {
            if (this.menuAnimation.isActive()) {
                this.menuAnimation.eventCallback('onReverseComplete', () => this.containerAnimation.reverse())
            } else {
                this.containerAnimation.reverse()
            }
        }

        //Closes the content reveal always. The container fade only joins in when staying on this
        //page (button toggle, same-page link) — navigating away holds the container visible so it
        //never fades out before the transition overlay has covered the screen (see 'transitionCovered')
        const closeMenu = (navigatingAway) => {
            this.menuAnimation.reverse()
            if (!navigatingAway) closeContainer()
        }

        //Once the overlay has covered the screen, the container is safely hidden either way —
        //snap it closed instantly (no animation, nothing left to see) if it was held open
        document.addEventListener('transitionCovered', () => {
            this.containerAnimation.pause(0)
        })

        //Transitions with no overlay (roster<->artist crossfade) can't hide the container behind
        //anything, so it has to actually play its close animation instead of being held then snapped
        document.addEventListener('menuAnimatedClose', () => {
            closeContainer()
        })

        //Click on Button
        this.menuButton.addEventListener('click', (e) => {
            //Ignore clicks while the open/close is still playing — spamming play/reverse leaves things half-set
            if (this.menuAnimation.isActive()) return

            if (!menuOpen) {

                this.menuAnimation.play()
                this.containerAnimation.play()
                this.buttonTl.play()
                menuOpen = true
                lenis.stop()
                document.dispatchEvent(menuEvents.openMenu)

            } else if (menuOpen) {

                closeMenu(false)
                this.buttonTl.reverse()
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
                let navigatingAway = link.href !== window.location.href
                closeMenu(navigatingAway)
                this.buttonTl.reverse() //reset the button to MENU — clicking a link also closes the menu
                menuOpen = false
                lenis.start()
                //Navigating away freezes the ball's menu pose instead of animating it back — the
                //destination page's own transition repositions it right after anyway
                document.dispatchEvent(navigatingAway ? new CustomEvent('menuNavigatingClose') : menuEvents.closeMenu)
            })

        })


        this.smallLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                let navigatingAway = link.href !== window.location.href
                closeMenu(navigatingAway)
                this.buttonTl.reverse() //reset the button to MENU — clicking a link also closes the menu
                menuOpen = false
                lenis.start()
                document.dispatchEvent(navigatingAway ? new CustomEvent('menuNavigatingClose') : menuEvents.closeMenu)
            })

        })

    }

}