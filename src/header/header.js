import barba from '@barba/core'

export default function headerInit() {

    let headerLogo = document.querySelector(".hidef-logo-link")
    console.log(headerLogo)

    headerLogo.addEventListener("click", (e) => {
        barba.go("/")
    }, true)
        
}