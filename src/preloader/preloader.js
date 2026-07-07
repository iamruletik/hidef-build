const RATIO = 170 / 260, H_FACTOR = 0.20

export class Preloader {


  constructor() {
    this.preloaderWrapper = document.querySelector('.preloader-wrapper')
    this.cutOut = this.preloaderWrapper.querySelector('#cut')
    this.imageContainer = this.preloaderWrapper.querySelector('.preloader-image-container')
    this.loadingText = this.preloaderWrapper.querySelector('.preloader-text-content')
    this.pt = gsap.timeline()
    this.textArray = [
      "FINDING THE RHYTM",
      "SETTING THE TONE",
      "CALIBRATING THE ENERGY",
      "LOADING A FEELING",
      "TUNING THE NIGHT",
      "BUILDING THE ATMOSPHERE",
    ]
  }


  load() {

    let phraseId = gsap.utils.random(0, 5, 1)
    console.log(phraseId)
    this.loadingText.innerHTML = this.textArray[phraseId]

    let attributes = this.calculateCutStart()

    this.imageContainer.style.width = attributes.width + "%"
    this.imageContainer.style.height = attributes.height + "%"

    let start = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    }

    this.pt.set(this.cutOut, { attr: start })

  }

  finish(onReveal) {

    this.pt.to(".preloader-color", {
      yPercent: 100,
      duration: 0.5
    })

    this.pt.to(".first-preloader-image", {
      delay: 0.25,
      yPercent: 100,
      duration: 0.5,
      scale: 1.02,
      ease: "circ.out"
    }, "<")

    this.pt.to(this.loadingText, {
      yPercent: 100,
      ease: "expo.inOut",
      duration: 0.3
    }, "<")

    

    this.pt.to(".other-preloader-image", {
      delay: 0.1,
      yPercent: 100,
      stagger: 0.3,
      scale: 1.02,
      duration: 0
    })

    //Small Rectangle
    this.pt.set(this.cutOut, { attr: this.calculateCutStart() })

    this.pt.set(".preloader-image-container", {
      autoAlpha: 0,
    })

    this.pt.to(this.loadingText, {
      yPercent: 250,
      ease: "expo.inOut"
    })


    //Fullscreen
    this.pt.to(this.cutOut, {
      attr: {
        x: "0%",
        y: "0%",
        width: "100%",
        height: "100%"
      },
      duration: 1,
      ease: 'expo.inOut',
      onStart: () => { if (onReveal) onReveal() },
      onComplete: () => this.preloaderWrapper.remove(),
    }, "<")

    let runningLine = document.querySelector('.running_line')

    if (runningLine) {

      let chars = runningLine.querySelectorAll('.char-svg')

      this.pt.from(chars, {
        delay: 0.3,
        yPercent: 100,
        stagger: 0.03
      }, "<")
    }


  //this.pt.pause(2)


  }

  calculateCutStart() {
    const hh = H_FACTOR * 100
    const hw = (window.innerHeight * H_FACTOR * RATIO / window.innerWidth) * 100


    return {
      x: (100 - hw) / 2,
      y: (100 - hh) / 2,
      width: hw,
      height: hh
    }
  }



}