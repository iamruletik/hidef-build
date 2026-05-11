export class Preloader {

  constructor() {
    this.preloaderTimeline = gsap.timeline().pause()
    this.randomPosition = gsap.utils.random(0.3, 1)
  }


  load() {

    let progressNumber = document.querySelector('.preloader-progress-bar-number')
    let preloaderProgressBar = document.querySelector('.preloader-progress-bar')

    this.preloaderTimeline.to(preloaderProgressBar, {
      xPercent: 100,
      duration: 0.3,
      ease: "none",
      onUpdate: function () {
        progressNumber.innerText = Math.round(this.progress() * 100) + "%"
      }
    })
  
    gsap.to(this.preloaderTimeline, {
      progress: this.randomPosition
    })

  }

  finish() {

    let preloaderWrapper = document.querySelector('.preloader-wrapper')

    gsap.to(this.preloaderTimeline, {
      progress: 1
    })

    gsap.to(preloaderWrapper, {
      delay: 0.3,
      yPercent: -100,
      duration: 0.5
    })

  }



}