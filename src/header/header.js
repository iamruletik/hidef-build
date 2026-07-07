import barba from '@barba/core'

export default function headerInit(lenis) {

    let headerLogo = document.querySelector(".hidef-logo-link")
    headerLogo.addEventListener("click", (e) => {
        //Already on main — don't swap containers, just scroll back to top
        let namespace = document.querySelector('[data-barba="container"]')?.dataset.barbaNamespace
        if (namespace === 'main') {
            lenis.scrollTo(0)
            return
        }
        barba.go("/")
    }, true)

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