import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


export class RosterPage {

    constructor(barbaContainer) {
        this.container = barbaContainer
        this.rosterItemsSelector = '.roster-list-table-content-item'
        this.rosterImagesSelector = '.roster-list-table-content-item-image'
        this.floatingWrapper = document.querySelector('.roster-floating-image-wrapper')
        this.rosterItemsHeader = barbaContainer.querySelector('.roster-list-table-header')
        this.dummy = document.querySelector('.dummy-floating-container')
    }

    setup() {

        this.createFloatingContainer()
        this.createSliders(this.floatingWrapper, this.rosterItemsSelector, this.rosterImagesSelector)
        this.showSpecificImage(this.rosterItemsSelector)

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

        rosterItems.forEach((artist) => {

            let artistName = artist.dataset.artistName

            let slider = this.floatingWrapper.querySelector(`[data-artist-name="${artistName}"]`)
            //console.log(slider)

            artist.addEventListener('mouseenter', (e) => {

                //let contPos = sliderContainer.getBoundingClientRect()
                let yMov = artist.getBoundingClientRect().top / 2

                gsap.to(sliderContainer, {
                    y: yMov,
                    duration: 0.3,
                    //overwrite: true
                })

                gsap.set(slider, { autoAlpha: 1, zIndex: 99 })

                slider.dataset.sliderState = "active"


            }, true)

            artist.addEventListener('mouseleave', (e) => {

                gsap.set(slider, { zIndex: 1 })
                gsap.to(slider, { duration: 0.3, autoAlpha: 0 })
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

            let swiper = new Swiper(swiperElement, {

                modules: [Navigation, Pagination, Autoplay],
                loop: true,
                snapToSlideEdge: true,
                speed: 400,
                pagination: {
                    el: '.artist-img-pagination',
                    type: "fraction"
                },
                autoplay: {
                    disableOnInteraction: false,
                    delay: 2000
                }

            })
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