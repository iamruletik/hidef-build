import barba from '@barba/core'
import discomodel from './glb/discoball.glb'
import hdri from './glb/hdri.hdr'
import './fluid.css'
import './general.css'
import './preloader/preloader.css'
import './lenis.css'
import './default_transition.css'
import './header/header.css'
import './roster/roster.css'
import './archive/archive.css'
import './services/services.css'
import './about/about.css'
import './noise/noise.css'
import './menu/menu.css'
import { Preloader } from './preloader/preloader'
import createNoise from './noise/noise'
import headerInit from './header/header'
import { Menu } from './menu/menu'
import rosterInit from './roster/roster'
import archiveInit from './archive/archive'
import projectInit from './archive/project'
import { mainView } from './main/main'
import { Disco } from './main/discoball'
import { Footer } from './footer/footer'
import Lenis from 'lenis'

//INIT LENIS
// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({ lerp: 0.1 })

// Synchronize Lenis scrolling with GSAP's ScrollTrigger plugin
lenis.on('scroll', ScrollTrigger.update)

// Add Lenis's requestAnimationFrame (raf) method to GSAP's ticker
// This ensures Lenis's smooth scroll animation updates on each GSAP tick
gsap.ticker.add((time) => {
    lenis.raf(time * 1000) // Convert time from seconds to milliseconds
})

// Disable lag smoothing in GSAP to prevent any delay in scroll animations
gsap.ticker.lagSmoothing(0)


headerInit()
createNoise()

//Preloader
let preloader = new Preloader()
preloader.load()

//Footer
let footer = new Footer()
footer.setup()

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

document.addEventListener('menuOpened', () => {
    menuTimeline = gsap.timeline({
        onReverseComplete: () => {
            menuTimeline.kill()
            console.log(menuTimeline)
        }
    })
    discoball.animateToMenu(menuTimeline)
    console.log('Menu Opened')
})

document.addEventListener('menuClosed', () => {
    discoball.revertMenuAnimation(menuTimeline)
    console.log('Menu Closed')
})

let defaultTransititonContainer = createTransitionContainer()

//Create Main View
let home



//Transitions Setup
barba.init({
    prevent: null,
    preventRunning: false,
    transitions: [{
        name: 'default-transition',
        sync: false,
        before(data) { console.log("BEFORE") },
        beforeLeave(data) { 
            console.log("BEFORE LEAVE")
            console.log(data)
         },
        leave(data) { console.log("LEAVE") },
        afterLeave(data) { console.log("AFTER LEAVE") },

        beforeEnter: (data) => {
            return new Promise(resolve => {
                console.log("BEFORE ENTER")
                //Get name of the nex page
                let text = document.querySelector(".transition-container-content-text")
                text.innerText = data.next.namespace.toUpperCase()
                leaveAnimation(data.current.container, defaultTransititonContainer, resolve)
            })
        },

        enter(data) { console.log("ENTER") },
        afterEnter(data) { console.log("AFTER ENTER") },

        after: (data) => {
            return new Promise(resolve => {
                console.log("ENTER")
                enterAnimation(data.current.container, defaultTransititonContainer, resolve)
                footer.update()
            })
        }
    }],

    views: [{
        //MAIN PAGE
        namespace: 'main',
        beforeEnter(data) {
            console.log("Barba Main")
            home = new mainView()
            home.setup()
        },
        afterEnter() {
            home.run()
            discoball.scrollHomeAnimation()
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
            rosterInit()
            discoball.animateToHeader()
        }
    }, {
        //ARCHIVE PAGE
        namespace: 'archive',
        beforeEnter(data) {
            console.log("Barba Archive")
            archiveInit()
            discoball.animateToHeader()
        }
    }, {
        //PROJECT PAGE
        namespace: 'project',
        beforeEnter(data) {
            console.log("Barba Project")
            projectInit()
            discoball.animateToHeader()
        }
    }, {
        //ABOUT PAGE
        namespace: 'about',
        beforeEnter(data) {
            console.log("Barba About")
           discoball.animateToHeader()
        }
    }, {
        //SERVICES PAGE
        namespace: 'services',
        beforeEnter(data) {
            console.log("Barba Services")
            discoball.animateToHeader()
        }
    }, {
        //ARTIST PAGE
        namespace: 'artist',
        beforeEnter(data) {
            console.log("Barba ARTIST")
            discoball.animateToHeader()
        }
    }]
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
    leave.to(barbaContainer, { y: 100, autoAlpha: 0 })
    leave.to(transitionContainer, { yPercent: 0, ease: "expo.inOut", onComplete: () => { resolve() } })
}

//DEFAULT BARBA ENTER ANIMATION
function enterAnimation(barbaContainer, transitionContainer, resolve) {
    let enter = gsap.timeline()
    enter.from(barbaContainer, { y: 100, autoAlpha: 0 })
    enter.to(transitionContainer, { yPercent: -100, ease: "expo.inOut", onComplete: () => { resolve() } })
}


//DOWNLOAD ASYNC GLTF MODEL
async function downloadDiscoModel(url) {
    try {

        const response = await fetch(url)

        if (response.ok) {
            console.log('GLTF is Downloaded')
            const data = await response.arrayBuffer()
            const scene = await discoball.loadModel(data)
            preloader.finish()
            discoball.run(scene.children[0])
            discoball.createShaderPlane()
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

