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
const lenis = new Lenis()
// Use requestAnimationFrame to continuously update the scroll
function raf(time) {
    lenis.raf(time)
    requestAnimationFrame(raf)
}
requestAnimationFrame(raf)


headerInit()
createNoise()

//Preloader
let preloader = new Preloader()
preloader.load()

//Footer
let footer = new Footer()
footer.setup()

let menu = new Menu()
menu.setup(lenis)

let discoball = new Disco()
downloadDiscoModel(discomodel)
downloadHDRI(hdri)

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
        beforeLeave(data) { console.log("BEFORE LEAVE") },
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
            discoball.animate()
        },
        beforeLeave() {
            home = null
            discoball.killAnimate()
        }
    }, {
        //ROSTER PAGE
        namespace: 'roster',
        beforeEnter(data) {
            console.log("Barba Roster")
            rosterInit()
        }
    }, {
        //ARCHIVE PAGE
        namespace: 'archive',
        beforeEnter(data) {
            console.log("Barba Archive")
            archiveInit()
        }
    }, {
        //PROJECT PAGE
        namespace: 'project',
        beforeEnter(data) {
            console.log("Barba Project")
            projectInit()
        }
    }]
});



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
            const model = await discoball.loadModel(data)
            preloader.finish()
            discoball.run(model)
            //console.log(model)
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