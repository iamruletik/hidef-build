import barba from '@barba/core'

export default function headerInit() {

    let headerLogo = document.querySelector(".hidef-logo-link")
    headerLogo.addEventListener("click", (e) => { barba.go("/") }, true)

    //Header Timeline

    let descriptor = document.querySelector(".logo_description")
    let main = document.querySelector("main")
    let ht = gsap.timeline({
                scrollTrigger: {
                    trigger: main,
                    start: "top top",
                    end: "+=400",
                    scrub: 0.5
                }
    })
    
    ht.to(headerLogo, {
        scale: 0.5
    })
    ht.to(descriptor, {
        xPercent: -100
    }, "<")
}