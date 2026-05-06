export default function projectInit() {
    //Show scroll progress of a project
    let progressBarElement = document.querySelector('.project-progress-bar')
    let progressBarNumber = document.querySelector('.project-progress-bar-number')

    document.addEventListener("scroll", (event) => { 

    let progress = gsap.utils.mapRange(window.innerHeight, document.body.scrollHeight, 100, 0, window.scrollY+window.innerHeight)

    progressBarElement.style.transform = "translate(-" + progress + "%)"
    progressBarNumber.innerText = Math.abs(Math.round(progress-100)) + "%"

  })

}