import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export class ArtistPage {

    constructor(barbaContainer) {
        this.container = barbaContainer
        this.rosterItemsSelector = '.roster-list-table-content-item'
        this.rosterImagesSelector = '.roster-list-table-content-item-image'
        this.floatingWrapper = document.querySelector('.roster-floating-image-wrapper')
        this.imagesContainer = barbaContainer.querySelector('.artist-content-photo-container')
    }

    setup() {

        if (!this.floatingWrapper) {
            this.createFloatingContainer()
            this.createSlider(this.floatingWrapper, this.imagesContainer)
        }
    }

    createFloatingContainer() {

        console.log('NOT EXIST')

        let wrapper = document.createElement('div')
        wrapper.classList.add('roster-floating-image-wrapper')

        let container = document.createElement('div')
        container.classList.add('roster-floating-image-container')

        wrapper.append(container)
        document.body.prepend(wrapper)
        this.floatingWrapper = wrapper

    }

    createSlider(sliderContainer, imgContainer) {


        let artistName = imgContainer.dataset.artistName

        let sliderWrapper = document.createElement('div')
        sliderWrapper.classList.add('slider-wrapper')
        sliderWrapper.dataset.artistName = artistName
        sliderWrapper.dataset.sliderState = "active"
        sliderWrapper.style.opacity = 1

        let swiper = document.createElement('div')
        swiper.classList.add('swiper')

        let swiperWrapper = document.createElement('div')
        swiperWrapper.classList.add('swiper-wrapper')


        sliderWrapper.append(swiper)
        swiper.append(swiperWrapper)

        sliderContainer.firstChild.append(sliderWrapper)


        let images = imgContainer.querySelectorAll('img')

        images.forEach((image) => {

            let swiperSlide = document.createElement('div')
            swiperSlide.classList.add('swiper-slide')

            let img = document.createElement('img')
            img.src = image.src

            swiperSlide.append(img)
            swiperWrapper.append(swiperSlide)

        })

        this.createOneSlider(sliderWrapper)

    }

    createOneSlider(sliderWrapper) {

        let slideCount = sliderWrapper.querySelectorAll('.swiper-slide').length

        //console.log(slideCount)

        if (slideCount > 0) {

            let swiperElement = sliderWrapper.querySelector('.swiper')

            let pagination = document.createElement('div')
            pagination.classList.add('artist-img-pagination')
            pagination.classList.add('swiper-pagination')
            pagination.style.opacity = 1

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

}
