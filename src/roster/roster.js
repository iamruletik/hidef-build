import { gsap, SplitText } from '../core/gsap'
import { BasePage } from '../core/BasePage'
import { createFloatingCursor } from '../core/sliderCursor'
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


export class RosterPage extends BasePage {

    constructor(barbaContainer) {
        super(barbaContainer)
        this.rosterItemsSelector = '.roster-list-table-content-item'
        this.rosterImagesSelector = '.roster-list-table-content-item-image'
        this.floatingWrapper = document.querySelector('.roster-floating-image-wrapper')
        this.rosterItemsHeader = barbaContainer.querySelector('.roster-list-table-header')
        this.dummy = document.querySelector('.dummy-floating-container')
    }

    setup() {
        //Runs on every viewport — flatten the CMS-generated specialty divs into one text line
        this.concatSpecialties()

        //≤991 has a different design — no floating hover wrapper at all. The whole interaction below is
        //hover-to-reveal, which touch doesn't have anyway, so skip it entirely on mobile.
        if (window.matchMedia('(max-width: 991px)').matches) return

        //Not wrapped in this.ctx.add() — createFloatingContainer's gsap.set and showSpecificImage's
        //hover tweens all target the persistent floating wrapper, which survives roster<->artist
        //navigation. Reverting them on this page's own destroy() would strip that wrapper's
        //positioning mid-transition. Its lifecycle is handled separately in index.js
        this.createFloatingContainer()
        this.createSliders(this.floatingWrapper, this.rosterItemsSelector, this.rosterImagesSelector)
        this.showSpecificImage(this.rosterItemsSelector)

        //Roster shares the floating wrapper with the artist page, so the cursor node may already exist —
        //keep it off here (the artist page turns it on). Off = native cursor + no interference with the
        //roster list's own hover-to-show-image
        if (this.floatingWrapper._cursorZones) this.floatingWrapper._cursorZones.style.pointerEvents = 'none'
    }

    //CMS loads each specialty as its own .artist-specialty div; with little space the flex items shrink
    //and read as separate chunks. Collapse each .roster-specialty-list into a single comma-joined text
    //line so it wraps fluidly like one paragraph. Real commas (no trailing) replace the .artist-specialty
    //div::after comma trick.
    concatSpecialties() {
        this.container.querySelectorAll('.roster-specialty-list').forEach((list) => {
            let specialties = [...list.querySelectorAll('.artist-specialty')]
                .map((s) => s.textContent.trim())
                .filter(Boolean)
            list.textContent = specialties.join(', ')
        })
    }

    createFloatingContainer() {



        if (!this.floatingWrapper) {

            console.log('NOT EXIST')

            let wrapper = document.createElement('div')
            wrapper.classList.add('roster-floating-image-wrapper')

            let container = document.createElement('div')
            container.classList.add('roster-floating-image-container')

            wrapper.append(container)
            document.body.prepend(wrapper)
            this.floatingWrapper = wrapper

            //One shared cursor inside the container, driving whichever slider is active (off on roster)
            wrapper._cursorZones = createFloatingCursor(container)


            let finPos = this.dummy.getBoundingClientRect()
            //console.log(finPos)

            gsap.set(container, { x: finPos.left, y: finPos.top, scale: 0.4 })



        } else {
            console.log('EXIST')
            this.floatingWrapper = document.querySelector('.roster-floating-image-wrapper')
        }
    }

    showSpecificImage(selector) {

        let rosterItems = this.container.querySelectorAll(selector)
        let sliderContainer = this.floatingWrapper.firstChild
        let allSliders = this.floatingWrapper.querySelectorAll('.slider-wrapper')

        //Container starts at the dummy position (near the bottom) — snap it into place on the first hover
        //instead of sliding all the way up, then animate normally after
        let firstHover = true

        rosterItems.forEach((artist) => {

            let artistName = artist.dataset.artistName

            let slider = this.floatingWrapper.querySelector(`[data-artist-name="${artistName}"]`)
            //console.log(slider)

            this.addListener(artist, 'mouseenter', (e) => {

                //let contPos = sliderContainer.getBoundingClientRect()
                let yMov = artist.getBoundingClientRect().top / 2

                gsap.to(sliderContainer, {
                    y: yMov,
                    duration: firstHover ? 0 : 0.3,
                    //overwrite: true
                })
                firstHover = false

                //Fast moves can skip mouseleave — hide every other slider so only the hovered one shows
                allSliders.forEach((other) => {
                    if (other === slider) return
                    gsap.set(other, { zIndex: 1 })
                    gsap.to(other, { duration: 0.3, autoAlpha: 0, overwrite: true })
                    other.dataset.sliderState = "hidden"
                })

                gsap.set(slider, { autoAlpha: 1, zIndex: 99, overwrite: true })

                slider.dataset.sliderState = "active"


            }, true)

            this.addListener(artist, 'mouseleave', (e) => {

                gsap.set(slider, { zIndex: 1 })
                gsap.to(slider, { duration: 0.3, autoAlpha: 0, overwrite: true })
                slider.dataset.sliderState = "hidden"

            }, true)

        })

    }


    createSliders(sliderContainer, imgContainersSelector, imgSelector) {


        let rosterItems = this.container.querySelectorAll(imgContainersSelector)

        rosterItems.forEach((artist) => {



            let artistName = artist.dataset.artistName

            let doesSliderExist = this.floatingWrapper.querySelector(`[data-artist-name="${artistName}"]`)

            if (!doesSliderExist) {
                //Create Slider Wrapper for Each Artist

                let sliderWrapper = document.createElement('div')
                sliderWrapper.classList.add('slider-wrapper')
                sliderWrapper.dataset.artistName = artistName
                //console.log(sliderWrapper)            

                let swiper = document.createElement('div')
                swiper.classList.add('swiper')



                let swiperWrapper = document.createElement('div')
                swiperWrapper.classList.add('swiper-wrapper')



                sliderWrapper.append(swiper)
                swiper.append(swiperWrapper)

                //console.log(sliderContainer.firstChild)

                sliderContainer.firstChild.append(sliderWrapper)


                //Add All Slides in Slider


                let images = artist.querySelectorAll('img')

                images.forEach((image) => {

                    let swiperSlide = document.createElement('div')
                    swiperSlide.classList.add('swiper-slide')

                    let img = document.createElement('img')
                    img.src = image.src

                    swiperSlide.append(img)
                    swiperWrapper.append(swiperSlide)

                })


                //Create Slider
                this.createOneSlider(sliderWrapper)
            }




        })

    }


    createOneSlider(sliderWrapper) {

        let slideCount = sliderWrapper.querySelectorAll('.swiper-slide').length

        //console.log(slideCount)

        if (slideCount > 0) {

            let swiperElement = sliderWrapper.querySelector('.swiper')

            let pagination = document.createElement('div')
            pagination.classList.add('artist-img-pagination')
            pagination.classList.add('swiper-pagination')

            swiperElement.append(pagination)

            //Loop/autoplay only make sense with more than one slide — CMS artists can have just one
            let multiple = slideCount > 1

            let swiper = new Swiper(swiperElement, {

                modules: [Navigation, Pagination, Autoplay],
                loop: multiple,
                snapToSlideEdge: true,
                speed: 400,
                pagination: {
                    el: '.artist-img-pagination',
                    type: "fraction"
                },
                autoplay: multiple && {
                    disableOnInteraction: false,
                    delay: 2000
                }

            })

            //Lives in the floating wrapper, which survives roster<->artist navigation — tracked on
            //the wrapper itself (not this.addSwiper) so it isn't destroyed by this page's own teardown.
            //Actually destroyed in index.js's shared floating-wrapper cleanup
            this.floatingWrapper._swipers = this.floatingWrapper._swipers || []
            this.floatingWrapper._swipers.push(swiper)

            //So the shared cursor can drive this slider when it's the active one
            sliderWrapper._swiper = swiper
        }

    }

    animateContent(data) {

        try {
            let header = data.querySelector('.artist-content-container-header')
            let text = data.querySelector('.artist-content-container-text')
            let counters = data.querySelectorAll('.artist-content-container-bottom-counters-item')
            let link = data.querySelector('.link-element')
            let tags = data.querySelector('.artist-specialty-tags')

            let splitHeader = SplitText.create(header, { type: "words" })

            gsap.from(splitHeader.words, {
                autoAlpha: 0,
                y: -10,
                stagger: {
                    amount: 0.5
                }
            })

            gsap.fromTo(splitHeader.words, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })


            let splitText = SplitText.create(text, { type: "words" })

            gsap.from(splitText.words, {
                autoAlpha: 0,
                y: -10,
                stagger: {
                    amount: 0.5
                }
            })


            gsap.fromTo(splitText.words, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })


            gsap.from(counters, {
                autoAlpha: 0,
                y: -10,
                stagger: 0.3
            })

            gsap.fromTo(counters, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })

            gsap.from(link, {
                autoAlpha: 0,
                y: -10
            })

            gsap.fromTo(link, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })

            gsap.from(tags, {
                autoAlpha: 0,
                y: -10
            })

            gsap.fromTo(tags, {
                filter: "blur(7px)",
            }, {
                filter: "blur(0px)",
            })


        } catch (error) {
            console.log(error)
        }



    }


}