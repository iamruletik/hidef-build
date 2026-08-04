import { gsap, ScrollTrigger } from './core/gsap'
import { createViews } from './core/PageRegistry'
import barba from '@barba/core'
import discomodel from './glb/discoball_compressed_new.glb'
import hdri from './glb/output_lowres.hdr'
import './fluid.css'
import './general.css'
import './templates.css'
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


// Don't let the browser restore scroll on reload/back — we control it
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({ lerp: 0.07 })

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
gsap.ticker.add((time) => { lenis.raf(time * 1000) })
gsap.ticker.lagSmoothing(0)


headerInit(lenis)

//Apple WebKit gate — navigator.vendor is the most stable "is this Safari's engine" signal (not UA-spoofable;
//'Apple Computer, Inc.' only on macOS/iOS/iPadOS Safari, and on iOS all browsers are WebKit anyway, which is
//what we want gated). Tags <html> so CSS can drop the #goo SVG filter, and skips the always-on noise loop —
//both are expensive on WebKit's compositor
let isSafari = navigator.vendor === 'Apple Computer, Inc.'
if (isSafari) document.documentElement.classList.add('is-safari')

if (!isSafari) createNoise() //noise canvas hammers putImageData 24fps — off on Safari

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

    runningLineMenuTl = animateRunningLine(document.querySelector('.running_line'), 'hide')

    console.log('Menu Opened')
})

document.addEventListener('menuClosed', () => {
    discoball.revertMenuAnimation(menuTimeline)
    if (runningLineMenuTl) runningLineMenuTl.reverse()
    console.log('Menu Closed')
})

//Navigating away: the destination page's own transition (animateToHeader/setToHeader, or main's
//home-scrub) repositions the ball right after this anyway — reversing menuTimeline first just races
//against it for the full ~1s reverse (this was the main-departure bug: ball visibly snapped between
//the two, running line flashed back in only to vanish again). Freeze instead of animating back —
//whatever comes next just picks up from wherever the ball is already sitting
document.addEventListener('menuNavigatingClose', () => {
    if (menuTimeline) menuTimeline.pause().kill()
})

let defaultTransititonContainer = createTransitionContainer()

let { views: pageViews, instances: pageInstances } = createViews([
    {
        //MAIN PAGE
        namespace: 'main',
        footerColor: '#FF383C',
        mountOn: 'beforeEnter',
        create: (data) => {
            let page = new MainPage(data.next.container, lenis)
            page.setup()
            return page
        },
        onAfterEnter: (data, instance) => {
            //Everything that should be SEEN happens in the ball-intro's onComplete — i.e. the moment
            //the cover comes off. The `after` hook runs while the cover is still up and it stays up for
            //the whole 1.5s ball intro, so revealing there just burns the animation behind the cover
            discoball.scrollHomeAnimation(() => {
                defaultTransititonContainer.remove()
                defaultTransititonContainer = createTransitionContainer()

                //footer.update() is a ScrollTrigger.refresh() — MUST happen here, not in the after hook.
                //A refresh while the cover is up re-evaluates the stacked-cards intro trigger and can
                //fire its drop/unstack behind the cover (that's the "cards just appear" bug). Deferred
                //to now, cover off + layout final, so the intro plays visibly on lift or waits for scroll
                footer.update()

                gsap.set(data.next.container, { autoAlpha: 1 })
                instance.run()
                //First load's running line is revealed by the preloader — only reveal here on an actual
                //navigation, else the two stack (preloader rolls chars in, then this .from snaps them
                //back to hidden and re-staggers)
                if (data.current && data.current.namespace) {
                    animateRunningLine(data.next.container.querySelector('.running_line'), 'reveal')
                }
                instance.revealHeroBottom()
            })
        },
        onBeforeLeave: () => {
            let ballToHeader = discoball.destroyHomeAnimation()

            let runningLine = document.querySelector('.running_line')
            if (!runningLine) return

            //Hide animation plays RIGHT AWAY (same as clicking the menu) — not delayed until the ball
            //reaches the header
            animateRunningLine(runningLine, 'hide')

            //z-index is the ONLY thing tied to the ball reaching the header — the running line renders
            //above the ball, so drop it below the cover (9996) right before the cover appears (which is
            //right after the ball settles into header pose, see leave()'s startCover)
            ballToHeader.then(() => { runningLine.style.zIndex = 9995 })
        }
    },
    { namespace: 'roster', PageClass: RosterPage, footerColor: '#FF383C' },
    { namespace: 'archive', PageClass: ArchivePage, footerColor: '#A7CEED' },
    { namespace: 'project', PageClass: ProjectPage, footerColor: '#A7CEED' },
    { namespace: 'about', PageClass: AboutPage, footerColor: '#FCB8FA' },
    {
        //SERVICES PAGE
        namespace: 'services',
        footerColor: '#FF383C',
        mountOn: 'beforeEnter',
        //create factory (not PageClass) so lenis can be passed — the shared folder snap needs it
        create: (data) => {
            let page = new ServicePage(data.next.container, lenis)
            page.setup()
            return page
        },
        onAfterEnter: () => footer.update()
    },
    { namespace: 'artist', PageClass: ArtistPage, footerColor: '#FF383C' },
    { namespace: 'privacy', footerColor: '#FF383C' }
])

//Reset scroll to the top on every barba navigation, before the new page renders. Registered BEFORE
//barba.init() so it fires ahead of any view's own beforeEnter (e.g. MainPage's setup(), which measures
//layout/creates ScrollTriggers against the CURRENT scroll position) — same-name hooks fire in
//registration order, so this being registered later meant pages could measure against stale scroll
//left over from the previous page, causing scroll-triggered reveals to snap instead of animate
barba.hooks.beforeEnter((data) => {
    lenis.scrollTo(0, { immediate: true })

    //Hide main's incoming container while the ball does its 1.5s intro — the running line sits above
    //the transition cover, so its at-rest state would show before its reveal. Shown again at cover-lift
    //(onAfterEnter). Navigation only — first load has no data.current and is handled by the preloader
    if (data.current && data.current.namespace && data.next.namespace === 'main') {
        gsap.set(data.next.container, { autoAlpha: 0 })
    }
})

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
        //Custom roster<->artist transitions run on desktop only. On ≤991 they're omitted from the array so
        //barba falls back to default-transition (mobile has no floating wrapper to animate). Barba ignores a
        //`custom` guard when from/to are set, so gating by conditional registration is the reliable way.
        //Evaluated once at load — a desktop<->mobile resize without reload won't re-gate.
        ...(window.matchMedia('(max-width: 991px)').matches ? [] : [
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
                discoball.animateToHeader()
                //No overlay here to hide behind — if the menu triggered this, its container needs to
                //actually play its close animation now, not stay held open waiting for a cover
                document.dispatchEvent(new CustomEvent('menuAnimatedClose'))
                //No cover to hide behind either way — safe to destroy the outgoing page right away
                document.dispatchEvent(new CustomEvent('safeToDestroy'))
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
                discoball.animateToHeader()
                //No overlay here to hide behind — if the menu triggered this, its container needs to
                //actually play its close animation now, not stay held open waiting for a cover
                document.dispatchEvent(new CustomEvent('menuAnimatedClose'))
                //No cover to hide behind either way — safe to destroy the outgoing page right away
                document.dispatchEvent(new CustomEvent('safeToDestroy'))
            },
            after(data) {
                console.log("ENTERING ROSTER")
                let transition = new ArtistToRosterTransition(data)
                transition.animate()

            }
        },
        ]),
        {
            name: 'default-transition',
            sync: false,
            before(data) { console.log("BEFORE") },
            beforeLeave(data) {
                console.log("BEFORE LEAVE")
                console.log(data)
            },
            //Overlay covers the screen HERE, while the old container is still mounted and visible —
            //so the user sees the transition cover immediately on click, never a bare/stuck old page.
            //sync:false means barba waits for this promise before removing the old container, so it's
            //already hidden behind the overlay by the time that happens
            leave(data) {
                return new Promise(resolve => {
                    toggleStackedSliderCards(0)

                    //Touch has no hover-prefetch, so when leave fires the next page often isn't fetched yet —
                    //data.next.namespace is empty, which blanked the cover label AND mis-branched the main
                    //check below. sync:false loads the next page concurrently with leave, so hold here (that's
                    //what the leave Promise is for) until it's ready, then set the label + run the ball/cover.
                    whenNextReady(data).then(() => {
                        //Set on THIS cover container (it's remove()/recreate()d on main entry, so a global
                        //querySelector can hit a stale node)
                        let text = defaultTransititonContainer.querySelector(".transition-container-content-text")
                        if (text) text.innerText = (data.next.namespace || '').toUpperCase()

                        let startCover = () => leaveAnimation(data.current.container, defaultTransititonContainer, resolve)

                        //Ball finishes its move to header pose BEFORE the overlay starts covering — sequential,
                        //not simultaneous, so the two motions don't visually clash mid-move
                        if (data.next.namespace !== 'main') {
                            //Leaving main already triggers its own animateToHeader() via onBeforeLeave
                            //(destroyHomeAnimation) — reuse that same timeline instead of starting a second,
                            //concurrent one on the same properties (they'd fight over scene.position/plane.scale)
                            let ballTimeline = data.current.namespace === 'main' ? discoball.headerTimeline : discoball.animateToHeader()
                            ballTimeline.eventCallback('onComplete', startCover)
                        } else {
                            startCover()
                        }
                    })
                })
            },
            afterLeave(data) { console.log("AFTER LEAVE") },

            beforeEnter(data) { console.log("BEFORE ENTER") },

            enter(data) { console.log("ENTER") },
            afterEnter(data) { console.log("AFTER ENTER") },

            after: (data) => {
                return new Promise(resolve => {
                    console.log("ENTER")
                    lenis.scrollTo(0, { immediate: true })
                    //Check if Roster Slider still exist
                    let rosterSlider = document.querySelector('.roster-floating-image-wrapper')

                    //if (rosterSlider) { rosterSlider.remove() }

                    if (data.next.namespace === 'main') {
                        //No lift animation, NO reveals, and NO footer.update() here — the cover stays up
                        //through the whole 1.5s ball intro. Anything visual (reveals) would play unseen,
                        //and footer.update()'s ScrollTrigger.refresh() would fire the stacked-cards intro
                        //behind the cover. All of it moves to onAfterEnter's ball-intro onComplete (cover off)
                        resolve()
                    } else {
                        //Prime the page intro as the overlay begins lifting — snap-to-hidden stays behind the overlay,
                        //then it animates in as the page is revealed (no settled-then-animate flicker)
                        enterAnimation(data.current.container, defaultTransititonContainer, resolve, () => revealPageContent(data.next.container))
                        footer.update()

                        //Reveal the running line as the overlay lifts (first load is handled by the preloader)
                        animateRunningLine(data.next.container.querySelector('.running_line'), 'reveal')
                    }
                })
            }
        }],

    views: pageViews
})

//The floating image wrapper is shared across roster<->artist — remove it when leaving that pair for anything else.
//Its Swiper instances (stashed on the wrapper by RosterPage/ArtistPage as they're created) run their own
//autoplay timers that don't stop just because the DOM node they're in gets removed — kill them explicitly first.
//Deferred until 'transitionCovered' (the overlay has fully covered the screen) instead of removing it here —
//beforeLeave fires long before that, so removing it immediately meant the user saw the wrapper vanish
//first, then the cover catch up moments later
barba.hooks.beforeLeave((data) => {
    let rosterPages = ['roster', 'artist']
    if (rosterPages.includes(data.current.namespace) && !rosterPages.includes(data.next.namespace)) {
        document.addEventListener('transitionCovered', () => {
            let wrapper = document.querySelector('.roster-floating-image-wrapper')
            if (wrapper) {
                if (wrapper._swipers) wrapper._swipers.forEach((swiper) => { if (!swiper.destroyed) swiper.destroy() })
                wrapper.remove()
            }
        }, { once: true })
    }
})



//Barba exposes no "next loaded" promise. With sync:false the next page loads concurrently with leave(),
//so its namespace/container fill in on the same data.next object mid-leave. Resolve once that happens
//(desktop is usually instant thanks to hover-prefetch; touch waits the fetch). Safety cap so a failed/slow
//fetch can't hang the transition forever.
function whenNextReady(data) {
    return new Promise(resolve => {
        if (data.next.namespace) return resolve()
        let start = performance.now()
        let check = () => {
            if (data.next.namespace || performance.now() - start > 3000) return resolve()
            requestAnimationFrame(check)
        }
        requestAnimationFrame(check)
    })
}

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
    leave.to(transitionContainer, {
        yPercent: 0,
        ease: "expo.inOut",
        onComplete: () => {
            //Fires the moment the screen is fully covered (barba proceeds to enter right after this
            //resolves) — anything that needs to happen hidden, unseen by the user, listens for this
            document.dispatchEvent(new CustomEvent('transitionCovered'))
            //Safe to run any visually-destructive cleanup now (e.g. ctx.revert() snapping animated
            //properties back) — screen is fully hidden either way
            document.dispatchEvent(new CustomEvent('safeToDestroy'))
            resolve()
        }
    })
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

//RUNNING LINE HIDE/REVEAL — chars roll out/in (yPercent 120), icons fade. Builds + plays the
//timeline and returns it (so the menu can hold onto it and reverse). direction: 'hide' | 'reveal'
function animateRunningLine(runningLine, direction) {
    if (!runningLine) return null

    let chars = runningLine.querySelectorAll('.char-svg')
    let icons = runningLine.querySelectorAll('.icon-svg')

    let tl = gsap.timeline()
    if (direction === 'hide') {
        tl.to(chars, { yPercent: 120, stagger: 0.03, ease: "expo.inOut" })
        tl.to(icons, { autoAlpha: 0 }, "<")
    } else {
        tl.from(chars, { yPercent: 120, stagger: 0.03, ease: "expo.inOut" })
        tl.from(icons, { autoAlpha: 0 }, "<")
    }

    return tl
}

//Play the same intro the roster<->artist transitions use, for pages reached another way (direct load, default transition)
function revealPageContent(container) {
    let namespace = container?.dataset.barbaNamespace

    if (namespace === 'roster') {
        new ArtistToRosterTransition().animateList(container)
    } else if (namespace === 'artist') {
        new RosterToArtistTransition().animateContent(container)
    } else if (namespace === 'main' && pageInstances.main) {
        pageInstances.main.revealHeroBottom()
    } else if (namespace === 'services' && pageInstances.services) {
        pageInstances.services.revealMainScreen()
    } else if (namespace === 'about' && pageInstances.about) {
        pageInstances.about.revealMainScreen()
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
            preloader.finish(() => { lenis.start(); playInitialPageReveal(); })
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

