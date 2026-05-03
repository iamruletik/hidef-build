import barba from '@barba/core'
import './fluid.css'
import './preloader.css'
import Lenis from 'lenis'
import './lenis.css'
import './default_transition.css'
import rosterInit from './roster/roster'
import './roster/roster.css'
import headerInit from './header/header'
import './header/header.css'





if (LOCAL !== true) {

    //MAKE SURE THAT ONLY ONE SCRIPT WORKS BY SETTING LOCAL TO TRUE
    LOCAL = true

    headerInit()

    //Create Transition Div
    let transitionDiv = document.createElement("div")
    transitionDiv.classList.add("transition-wrapper")

    barba.init({
    prevent: null,
    preventRunning: false,
    transitions: [{
        name: 'default-transition',
        sync: false,
        before(data) {

            console.log("BEFORE")
            //CREATE TRANSITION DIV
            transitionDiv.innerHTML = `
            <div class="transition-container">
                <div class="transition-container-content">
                    <div class="transition-container-content-text"></div>
                </div>
            </div>
            `
            gsap.set(transitionDiv, {
                yPercent: 100
            })
            document.body.append(transitionDiv)

        },
        beforeLeave(data) { console.log("BEFORE LEAVE") },
        leave: (data) => {
        return new Promise(resolve => {
            console.log("LEAVE")
            gsap.to(data.current.container, {
                y: 100,
                autoAlpha: 0
            })
            gsap.to(transitionDiv, {
                yPercent: 0,
                ease: "expo.inOut",
                onComplete: () => { resolve() }
            })
        });
        },
        afterLeave(data) { console.log("AFTER LEAVE") },
        beforeEnter(data) {
            console.log("BEFORE ENTER")
            let text = document.querySelector(".transition-container-content-text")
             text.innerText = data.next.namespace.toUpperCase()
        },
        enter(data) { console.log("ENTER")},
        afterEnter(data) { console.log("AFTER ENTER") },
        after(data) {
            console.log("AFTER")

            gsap.to(transitionDiv, {
                //delay: 0.6,
                yPercent: -100,
                ease: "expo.inOut",
                onComplete: () =>  transitionDiv.remove()
            })

            gsap.from(data.next.container, {
                y: 100,
                autoAlpha: 0
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

        }
    }]
    });


    //INIT LENIS
      const lenis = new Lenis();
    
      // Use requestAnimationFrame to continuously update the scroll
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
    
      requestAnimationFrame(raf);



}