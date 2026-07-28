import { gsap } from '../core/gsap'
import { BasePage } from '../core/BasePage'
import { setupServiceFolders } from '../core/serviceCounts'
import { prepareFolder } from '../core/serviceFolders'
import { addLineReveal, addItemReveal } from '../core/textReveal'

export class ServicePage extends BasePage {

    constructor(barbaContainer, lenis) {
        super(barbaContainer)
        this.lenis = lenis //needed by the shared folder snap
        this.servicesFolders = barbaContainer.querySelectorAll('.services-sticky-container')
        this.foldersWrapper = barbaContainer.querySelector('.services-sticky-wrapper')
        this.folderWebflowContainer = this.foldersWrapper.querySelector('.w-dyn-list')
        this.mainScreen = barbaContainer.querySelector('.services-main-container')
    }

    setup() {
      this.ctx.add(() => {



        setupServiceFolders(this.container) //projects-per-service counts + placeholder-button hide, before the layout is torn down

        this.folderWebflowContainer.remove() //Remove Webflow Layout

        this.servicesFolders.forEach((folder) => {
            this.foldersWrapper.append(folder) //Move Nodes to the actual layout
            prepareFolder(this, folder)        //slider + cursor + content reveal + autoplay-on-view (shared)
        })
        
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        let folderPinHeight = (parseFloat(getComputedStyle(this.servicesFolders[0]).getPropertyValue('--top-folder-height')) || 0) * rootFontSize
        
        // Create a timeline linked to the page scroll
        let servicesTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.foldersWrapper,
               start: () => `top ${window.innerHeight * 0.1 + folderPinHeight}px`,
                end: () => `+=${window.innerHeight * 2 * this.servicesFolders.length}`, // Creates the scroll distance
                scrub: true, // Ties the animation smoothly to the scroll wheel
                pin: true,   // Pins the wrapper wrapper in place
                refreshPriority: 2
            }
        });

        // Animate each container up into view one by one
        this.servicesFolders.forEach((container, i) => {

            let right = container.querySelector('.service-content-right')

            if (i > 0) {
                servicesTimeline.from(container, {
                    yPercent: 100, // Starts below the screen
                    ease: "none"   // Keeps the movement uniform
                })
            }

            servicesTimeline.to(right, {
                yPercent: -60, // Starts below the screen 
                ease: "none"   // Keeps the movement uniform
            })
        });

        //No folder snap here — it conflicts with the services page's own scroll animation

        //Hero reveal built paused now — .from parks everything hidden immediately (behind the cover),
        //then it's played on enter after the preloader/transition lifts (see revealMainScreen, called
        //from revealPageContent in index.js). Cascades top-to-bottom.
        //Headline + headline-text are plain multi-line text → masked line split. The category list
        //items each already clip (overflow:hidden) and carry a counter ::before, so they must NOT be
        //SplitText'd — slide each item's inner up instead (addItemReveal)
        let mainScreenTimeline = gsap.timeline({ paused: true })

        let lineTargets = [
            this.container.querySelector('.services-main-container-headline h1'),
            this.container.querySelector('.services-content-headline-text')
        ].filter(Boolean)
        if (lineTargets.length) addLineReveal(mainScreenTimeline, lineTargets, { position: 0 })

        let categoryItems = this.container.querySelectorAll('.services-headline-category')
        if (categoryItems.length) addItemReveal(mainScreenTimeline, categoryItems, { position: '>-0.4' })

        this.mainScreenReveal = mainScreenTimeline

      })
    }

    //Played once the page is actually visible (after preloader on first load / as the cover lifts on nav)
    revealMainScreen() {
        if (this.mainScreenReveal) this.mainScreenReveal.play()
    }


}
