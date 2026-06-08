import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export class ServicePage {

    constructor(barbaContainer) {
        this.servicesFolders = barbaContainer.querySelectorAll('.services-sticky-container')
        this.foldersWrapper = barbaContainer.querySelector('.services-sticky-wrapper')
        this.folderWebflowContainer = this.foldersWrapper.querySelector('.w-dyn-list')
        this.mainScreen = barbaContainer.querySelector('.services-main-container')
    }

    setup() {



        this.folderWebflowContainer.remove() //Remove Webflow Layout

        this.servicesFolders.forEach((folder, i) => {

            this.foldersWrapper.append(folder) //Move Nodes to the actual layout

            let projectCount = folder.querySelector('.service-count-number')
            let dummyCountDiv = folder.querySelector('.services-projects-count')
            let dummyCount = dummyCountDiv.querySelectorAll('.w-dyn-item')

            console.log(dummyCount.length)
            projectCount.innerHTML = dummyCount.length




            let content = folder.querySelector('.service-content')
            let name = content.querySelector('.service-content-name')
            let slider = content.querySelector('.service-content-slider')
            let right = content.querySelector('.service-content-right')

            let contentGap = parseInt(window.getComputedStyle(right).gap, 10)
            let nameHeight = name.offsetHeight
            let contentHeight = content.offsetHeight
            let contentPaddingBottom = parseInt(window.getComputedStyle(content).paddingBottom, 10)
            let contentPaddingTop = parseInt(window.getComputedStyle(content).paddingTop, 10)
            let sliderNewHeight = content.offsetHeight - nameHeight - contentGap - contentPaddingBottom - contentPaddingTop

            //Recalculate height of slider
            slider.style.height = (100 * sliderNewHeight / window.innerHeight) + "vh"

            this.createSlider(slider)
        })


        // Create a timeline linked to the page scroll
        let servicesTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.foldersWrapper,
                start: "top 10%",
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


        this.animateMainScreen(this.mainScreen)

    }


    createSlider(sliderContainer) {

        let slideCount = sliderContainer.querySelectorAll('.swiper-slide').length

        //console.log(slideCount)

        if (slideCount > 0) {

            let swiperElement = sliderContainer.querySelector('.swiper')

            let pagination = document.createElement('div')
            pagination.classList.add('swiper-pagination')

            swiperElement.append(pagination)

            let swiper = new Swiper(swiperElement, {

                modules: [Navigation, Pagination, Autoplay],
                loop: true,
                snapToSlideEdge: true,
                speed: 400,
                pagination: {
                    el: '.swiper-pagination',
                    type: "fraction"
                },
                autoplay: {
                    disableOnInteraction: false,
                    delay: 2000
                }

            })
        }

    }

    animateMainScreen(container) {

        console.log('animating')

        let timeline = gsap.timeline()

        timeline.from(".services-headline-category div", {
            y: 100
        })
    }


}
