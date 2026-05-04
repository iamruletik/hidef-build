import barba from '@barba/core'
import './fluid.css'
import './preloader.css'
import Lenis from 'lenis'
import './lenis.css'
import './default_transition.css'
import headerInit from './header/header'
import './header/header.css'
import rosterInit from './roster/roster'
import './roster/roster.css'
import archiveInit from './archive/archive'
import './archive/archive.css'




if (LOCAL !== true) {

    //MAKE SURE THAT ONLY ONE SCRIPT WORKS BY SETTING LOCAL TO TRUE
    LOCAL = true

    headerInit()

    //Create Transition Div
    let defaultTransititonContainer = createTransitionContainer()


    //Transitions Setup
    barba.init({
    prevent: null,
    preventRunning: false,
    transitions: [{
        name: 'default-transition',
        sync: false,
        before(data) { console.log("BEFORE") },
        beforeLeave(data) { console.log("BEFORE LEAVE") },
        leave(data) { console.log("LEAVE")},
        afterLeave(data) { console.log("AFTER LEAVE") },

        beforeEnter: (data) =>  {
            return new Promise(resolve => {
                console.log("BEFORE ENTER")
                //Get name of the nex page
                let text = document.querySelector(".transition-container-content-text")
                text.innerText = data.next.namespace.toUpperCase()
                leaveAnimation(data.current.container, defaultTransititonContainer, resolve)
            })
        },

        enter(data) { console.log("ENTER")},
        afterEnter(data) { console.log("AFTER ENTER") },

        after: (data) => {
            return new Promise(resolve => {
                console.log("ENTER")
                enterAnimation(data.current.container, defaultTransititonContainer, resolve)
            })
        }
    }],

    views: [{
        //MAIN PAGE
        namespace: 'main',
        beforeEnter(data) {
            console.log("Barba Main")
        }
    },{
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
        
        gsap.set(transitionDiv, { yPercent: 100})
        document.body.append(transitionDiv)

        return transitionDiv;
    }
    
    //DEFAULT BARBA LEAVE ANIMATION
    function leaveAnimation(barbaContainer, transitionContainer, resolve) {
        let leave = gsap.timeline()
            leave.set(transitionContainer, { yPercent: 100})
            leave.to(barbaContainer, { y: 100, autoAlpha: 0 })
            leave.to(transitionContainer, { yPercent: 0, ease: "expo.inOut", onComplete: () => { resolve() }})
    }

    //DEFAULT BARBA ENTER ANIMATION
    function enterAnimation(barbaContainer, transitionContainer, resolve) {
        let enter = gsap.timeline()
            enter.from(barbaContainer, { y: 100, autoAlpha: 0 })
            enter.to(transitionContainer, { yPercent: -100, ease: "expo.inOut", onComplete: () => { resolve() }})
    }




    //INIT LENIS
    const lenis = new Lenis()
    // Use requestAnimationFrame to continuously update the scroll
    function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
}
