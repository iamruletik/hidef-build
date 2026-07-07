import barba from '@barba/core'
import discomodel from './glb/discoball_compressed.glb'
import hdri from './glb/output_lowres.hdr'
import './fluid.css'
import './general.css'
import './preloader/preloader.css'
import './lenis.css'
import './default_transition.css'
import './header/header.css'
import './roster/roster.css'
import './archive/archive.css'
import './archive/project.css'
import './services/services.css'
import './about/about.css'
import './noise/noise.css'
import './menu/menu.css'
import Lenis from 'lenis'
import { Preloader } from './preloader/preloader'
import { Menu } from './menu/menu'
import { AboutPage } from './about/about'
import { ArchivePage } from './archive/archive'
import { ProjectPage } from './archive/project'
import { ServicePage } from './services/services'
import { RosterPage } from './roster/roster'
import { ArtistPage } from './roster/artist'
import { RosterToArtistTransition } from './roster/inTransition'
import { ArtistToRosterTransition } from './roster/outTransition'
import createNoise from './noise/noise'
import headerInit from './header/header'
import projectInit from './archive/project'
import { MainPage } from './main/main'
import { Disco } from './main/discoball'
import { Footer } from './footer/footer'
import './footer/footer.css'    


//Footer Color Change
function setFooterColor(color) {
    document.documentElement.style.setProperty('--footer-color', color)
}


// Don't let the browser restore scroll on reload/back — we control it
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({ lerp: 0.075 })

// Lock scrolling through the preload — started again when the preloader finish animation completes
lenis.stop()

// First visit — start at the top
lenis.scrollTo(0, { immediate: true, force: true })

// The browser restores scroll a frame or two after load (once the page hits full height), overriding the
// line above. Pin to the top for a few frames after load — native + lenis — to win that race.
window.addEventListener('load', () => {
    let frames = 0
    function pinTop() {
        window.scrollTo(0, 0)
        lenis.scrollTo(0, { immediate: true, force: true })
        if (frames++ < 5) requestAnimationFrame(pinTop)
    }
    pinTop()
})

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => { lenis.raf(time * 1000)  })
gsap.ticker.lagSmoothing(0)


headerInit(lenis)
createNoise()

//Preloader
let preloader = new Preloader()
preloader.load()

//Footer
let footer = new Footer()
footer.setup(lenis)

let discoball = new Disco()
let discoScene = downloadDiscoModel(discomodel)
downloadHDRI(hdri)


let menuEvents = {
    openMenu: new CustomEvent('menuOpened', {
        detail: {
            name: 'Menu Opened'
        }
    }),
    closeMenu: new CustomEvent('menuClosed', {
        detail: {
            name: 'Menu Closed'
        }
    })
}

let menu = new Menu()
menu.setup(lenis, menuEvents)
let menuTimeline

//Hide the stacked slider cards while covered. zIndex 0 means unstack already started (see main.js) — leave it
function toggleStackedSliderCards(opacity) {
    let cards = document.querySelector('.slider_cards')
    if (cards && getComputedStyle(cards).zIndex !== '0') gsap.to(cards, { opacity: opacity, duration: 0.3 })
}

//Hide the running line while the menu is open. Queried fresh each open — barba swaps the container it lives in
let runningLineMenuTl

document.addEventListener('menuOpened', () => {
    menuTimeline = gsap.timeline({
        onReverseComplete: () => {
            toggleStackedSliderCards(1)
            menuTimeline.kill()
            console.log(menuTimeline)
        }
    })
    discoball.animateToMenu(menuTimeline)
    toggleStackedSliderCards(0)

    let runningLine = document.querySelector('.running_line')
    if (runningLine) {
        runningLineMenuTl = gsap.timeline()
        runningLineMenuTl.to(runningLine.querySelectorAll('.char-svg'), { yPercent: 120, stagger: 0.03, ease: "expo.inOut" })
        runningLineMenuTl.to(runningLine.querySelectorAll('.icon-svg'), { autoAlpha: 0 }, "<")
    }

    console.log('Menu Opened')
})

document.addEventListener('menuClosed', () => {
    discoball.revertMenuAnimation(menuTimeline)
    if (runningLineMenuTl) runningLineMenuTl.reverse()
    console.log('Menu Closed')
})

let defaultTransititonContainer = createTransitionContainer()

//Create Main View
let home



//Transitions Setup
barba.init({
    prevent: ({ el, event, href }) => {
        // Check if the clicked link's URL matches the current browser URL
        if (href === window.location.href) {
            event.preventDefault(); // Stop the native browser reload
            return true;            // Tells Barba to completely ignore this click
        }
    },
    preventRunning: true,
    transitions: [
        {
            name: 'roster-to-artist-transition',
            from: {
                namespace: ['roster']
            },
            to: {
                namespace: ['artist']
            },
            leave(data) {
                console.log("LEAVING ROSTER")
                lenis.scrollTo(0, { immediate: true })
                discoball.setToHeader()
            },
            after(data) {
                console.log("ENTERING ARTIST")
                let transition = new RosterToArtistTransition(data)
                transition.animate()

            }
        },
        {
            name: 'artist-to-roster-transition',
            from: {
                namespace: ['artist']
            },
            to: {
                namespace: ['roster']
            },
            leave(data) {
                console.log("LEAVING ARTIST")
                lenis.scrollTo(0, { immediate: true })
                discoball.setToHeader()
            },
            after(data) {
                console.log("ENTERING ROSTER")
                let transition = new ArtistToRosterTransition(data)
                transition.animate()

            }
        },
        {
            name: 'default-transition',
            sync: false,
            before(data) { console.log("BEFORE") },
            beforeLeave(data) {
                console.log("BEFORE LEAVE")
                console.log(data)
            },
            leave(data) {
                console.log("LEAVE")
                toggleStackedSliderCards(0)
                lenis.scrollTo(0, { immediate: true })
            },
            afterLeave(data) { console.log("AFTER LEAVE") },

            beforeEnter: (data) => {
                return new Promise(resolve => {
                    console.log("BEFORE ENTER")
                    //Get name of the nex page
                    let text = document.querySelector(".transition-container-content-text")
                    text.innerText = data.next.namespace.toUpperCase()
                    //Header pose the disco ball for every page except main (main runs its own scroll animation)
                    if (data.next.namespace !== 'main') discoball.animateToHeader()
                    leaveAnimation(data.current.container, defaultTransititonContainer, resolve)
                })
            },

            enter(data) { console.log("ENTER") },
            afterEnter(data) { console.log("AFTER ENTER") },

            after: (data) => {
                return new Promise(resolve => {
                    console.log("ENTER")

                    //Check if Roster Slider still exist 
                    let rosterSlider = document.querySelector('.roster-floating-image-wrapper')

                    //if (rosterSlider) { rosterSlider.remove() }

                    //Prime the page intro as the overlay begins lifting — snap-to-hidden stays behind the overlay,
                    //then it animates in as the page is revealed (no settled-then-animate flicker)
                    enterAnimation(data.current.container, defaultTransititonContainer, resolve, () => revealPageContent(data.next.container))
                    footer.update()

                    //Reveal the running line as the overlay lifts (first load is handled by the preloader)
                    revealRunningLine(data.next.container)
                })
            }
        }],

    views: [{
        //MAIN PAGE
        namespace: 'main',
        beforeEnter(data) {
            console.log("Barba Main")
            setFooterColor("#FF383C")

            home = new MainPage(data.next.container)
            home.setup()

        },
        afterEnter() {
            home.run()
            discoball.scrollHomeAnimation()
            console.log("Barba Main After Enter")
        },
        beforeLeave() {
            home = null
            discoball.destroyHomeAnimation()
        }
    }, {
        //ROSTER PAGE
        namespace: 'roster',
        beforeEnter(data) {
            console.log("Barba Roster")
            setFooterColor("#FF383C")
        },
        afterEnter(data) {
            let roster = new RosterPage(data.next.container)
            roster.setup()
        }
    }, {
        //ARCHIVE PAGE
        namespace: 'archive',
        beforeEnter(data) {
            console.log("Barba Archive")
            setFooterColor("#A7CEED")
        },
        afterEnter(data) {
            //console.log(document.querySelector('.archive-content-projects-list'))
            let archive = new ArchivePage(data.next.container)
            archive.setup(data.next.container)
        }
    }, {
        //PROJECT PAGE
        namespace: 'project',
        beforeEnter(data) {
            console.log("Barba Project")
            setFooterColor("#A7CEED")
        },
        afterEnter(data) {
            let project = new ProjectPage(data.next.container)
            project.setup()
            project.getAllAltTexts(data.next.container)
        }
    }, {
        //ABOUT PAGE
        namespace: 'about',
        beforeEnter(data) {
            console.log("Barba About")
            setFooterColor("#FCB8FA")
        },
        afterEnter(data) {
            let about = new AboutPage()
            about.setup()
        }
    }, {
        //SERVICES PAGE
        namespace: 'services',
        beforeEnter(data) {
            console.log("Barba Services")
            setFooterColor("#FF383C")

            let services = new ServicePage(data.next.container)
            services.setup()
            footer.update()

        }
    }, {
        //ARTIST PAGE
        namespace: 'artist',
        beforeEnter(data) {
            console.log("Barba ARTIST")
            setFooterColor("#FF383C")
        },
        afterEnter(data) {
            let artist = new ArtistPage(data.next.container)
            artist.setup()
        }
    }, {
        //PRIVACY PAGE
        namespace: 'privacy',
        beforeEnter(data) {
            console.log("Barba PRIVACY")
            setFooterColor("#FF383C")
        },
        afterEnter(data) {

        }
    }]
})


//Reset scroll to the top on every barba navigation (before the new page renders)
barba.hooks.beforeEnter(() => {
    lenis.scrollTo(0, { immediate: true })
})

//The floating image wrapper is shared across roster<->artist — remove it when leaving that pair for anything else
barba.hooks.beforeLeave((data) => {
    let rosterPages = ['roster', 'artist']
    if (rosterPages.includes(data.current.namespace) && !rosterPages.includes(data.next.namespace)) {
        let wrapper = document.querySelector('.roster-floating-image-wrapper')
        if (wrapper) wrapper.remove()
    }
})



//CREATE TRANSITION CONTAINER IN THE DOM
function createTransitionContainer() {

    //Create Element
    let transitionDiv = document.createElement("div")
    transitionDiv.classList.add("transition-wrapper")

    //Layout
    transitionDiv.innerHTML = `
        <div class="transition-container">
            <div class="transition-container-content">
                <div class="transition-container-content-text"></div>
            </div>
        </div>
        `

    gsap.set(transitionDiv, { yPercent: 100 })
    document.body.append(transitionDiv)

    return transitionDiv;
}

//DEFAULT BARBA LEAVE ANIMATION
function leaveAnimation(barbaContainer, transitionContainer, resolve) {
    let leave = gsap.timeline()
    leave.set(transitionContainer, { yPercent: 100 })
    //leave.to(barbaContainer, { y: 100, autoAlpha: 0 })
    leave.to(transitionContainer, { yPercent: 0, ease: "expo.inOut", onComplete: () => { resolve() } })
}

//DEFAULT BARBA ENTER ANIMATION
function enterAnimation(barbaContainer, transitionContainer, resolve, onReveal) {
    let enter = gsap.timeline()
    enter.from(barbaContainer, { y: 100, autoAlpha: 0 })
    enter.to(transitionContainer, {
        yPercent: -100,
        ease: "expo.inOut",
        //Fires while the overlay still covers the page, so the intro's snap-to-hidden happens unseen
        onStart: () => { if (onReveal) onReveal() },
        onComplete: () => { resolve() }
    })
}

//RUNNING LINE REVEAL — chars staggered in, icons fade in (same as the menu). Per-page, so every container has its own
function revealRunningLine(container) {
    let runningLine = container.querySelector('.running_line')
    if (!runningLine) return

    let chars = runningLine.querySelectorAll('.char-svg')
    let icons = runningLine.querySelectorAll('.icon-svg')

    let tl = gsap.timeline()
    tl.from(chars, { yPercent: 120, stagger: 0.03, ease: "expo.inOut" })
    tl.from(icons, { autoAlpha: 0 }, "<")
}

//Play the same intro the roster<->artist transitions use, for pages reached another way (direct load, default transition)
function revealPageContent(container) {
    let namespace = container?.dataset.barbaNamespace

    if (namespace === 'roster') {
        new ArtistToRosterTransition().animateList(container)
    } else if (namespace === 'artist') {
        gsap.registerPlugin(SplitText)
        new RosterToArtistTransition().animateContent(container)
    }
}

//Direct/first load: no transition runs, so trigger it off the preloader. Delayed so it fires partway into the
//cutOut reveal — when the page is actually visible, not at its first frame
function playInitialPageReveal() {
    let container = document.querySelector('[data-barba="container"]')
    if (!container) return

    gsap.delayedCall(0.4, () => revealPageContent(container))
}


//DOWNLOAD ASYNC GLTF MODEL
async function downloadDiscoModel(url) {
    try {

        const response = await fetch(url)

        if (response.ok) {
            console.log('GLTF is Downloaded')
            const data = await response.arrayBuffer()
            const scene = await discoball.loadModel(data)
            preloader.finish(() => { lenis.start(); playInitialPageReveal() })
            discoball.run(scene.children[0])

            //Position the ball for the initial page now that it's rendered (subpages start at the header)
            let namespace = document.querySelector('[data-barba="container"]')?.dataset.barbaNamespace
            if (namespace !== 'main') discoball.setToHeader()

            return scene
            // ...do something with the response
        } else {
            // Custom message for failed HTTP codes
            if (response.status === 404) throw new Error('404, Not found');
            if (response.status === 500) throw new Error('500, internal server error');
            // For any other server error
            throw new Error(response.status)
        }
    } catch (error) {
        console.error('Fetch', error)
        // Output e.g.: "Fetch Error: 404, Not found"
    }
}


//DOWNLOAD ASYNC HDRI
async function downloadHDRI(url) {
    const response = await discoball.loadHDRI(url)
}

