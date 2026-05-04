export default function preloaderInit() {

    let progressNumber = document.querySelector('.preloader-progress-bar-number')
    let preloaderTimeline = gsap.timeline().pause()

    preloaderTimeline.to(".preloader-progress-bar", {
      xPercent: 100,
      duration: 0.3,
      onUpdate: function() {
        progressNumber.innerText = Math.round(this.progress() * 100) + "%"
      }
    })
    preloaderTimeline.to(".preloader-wrapper", {
      yPercent: -100,
      duration: 0.5
    }) 
    
  document.addEventListener("DOMContentLoaded", (event) => {
    preloaderTimeline.play()
  });


}