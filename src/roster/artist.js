import { BasePage } from '../core/BasePage'
import { createFloatingCursor } from '../core/sliderCursor'
import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export class ArtistPage extends BasePage {

    constructor(barbaContainer) {
        super(barbaContainer)
        this.rosterItemsSelector = '.roster-list-table-content-item'
        this.rosterImagesSelector = '.roster-list-table-content-item-image'
        this.floatingWrapper = document.querySelector('.roster-floating-image-wrapper')
        this.imagesContainer = barbaContainer.querySelector('.artist-content-photo-container')
    }

    setup() {
        //≤991: different design — no floating wrapper. Build the slider into the in-flow Webflow element
        //instead (tracked via addSwiper, so it destroys with this page). See createMobileSlider.
        if (window.matchMedia('(max-width: 991px)').matches) {
            this.createMobileSlider()
            return
        }

        //Not wrapped in this.ctx.add() — everything here (and in createFloatingContainer/
        //createSlider) targets the persistent floating wrapper, which survives roster<->artist
        //navigation. Reverting it on this page's own destroy() would strip its positioning
        //mid-transition. Its lifecycle is handled separately in index.js
        if (!this.floatingWrapper) {
            this.createFloatingContainer()
            this.createSlider(this.floatingWrapper, this.imagesContainer)
        }

        //Custom slider cursor is on for the artist page (single visible slider), off for roster
        if (this.floatingWrapper._cursorZones) this.floatingWrapper._cursorZones.style.pointerEvents = 'auto'
    }

    //≤991 slider: lives in .artist-mobile-slider-container (normal document flow, no absolute wrapper),
    //controls in .artist-slider-buttons — prev/next via data attrs, middle div = fraction pagination.
    createMobileSlider() {
        let container = this.container.querySelector('.artist-mobile-slider-container')
        if (!container) return

        let swiperEl = document.createElement('div')
        swiperEl.classList.add('swiper')
        let swiperWrapper = document.createElement('div')
        swiperWrapper.classList.add('swiper-wrapper')
        swiperEl.append(swiperWrapper)
        container.append(swiperEl)

        this.imagesContainer.querySelectorAll('img').forEach((image) => {
            let slide = document.createElement('div')
            slide.classList.add('swiper-slide')
            let img = document.createElement('img')
            img.src = image.src
            slide.append(img)
            swiperWrapper.append(slide)
        })

        let slideCount = swiperWrapper.children.length
        if (slideCount === 0) return
        let multiple = slideCount > 1 //loop/autoplay only make sense with more than one slide

        let buttons = this.container.querySelector('.artist-slider-buttons')
        let prevEl = buttons?.querySelector('[data-slider-prev]')
        let nextEl = buttons?.querySelector('[data-slider-next]')
        //Middle div (the "1 / 6" label) — the only direct child without a prev/next data attr
        let paginationEl = buttons
            ? [...buttons.children].find((el) => !el.hasAttribute('data-slider-prev') && !el.hasAttribute('data-slider-next'))
            : null

        let swiper = new Swiper(swiperEl, {
            modules: [Navigation, Pagination, Autoplay],
            loop: multiple,
            snapToSlideEdge: true,
            speed: 400,
            navigation: (prevEl && nextEl) ? { prevEl, nextEl } : false,
            pagination: paginationEl ? { el: paginationEl, type: 'fraction' } : false,
            autoplay: multiple && {
                disableOnInteraction: false,
                delay: 2000
            }
        })

        //Tracked on the page — destroyed in BasePage.destroy() when barba swaps this container out
        this.addSwiper(swiper)
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

        //One shared cursor inside the container, driving whichever slider is active
        wrapper._cursorZones = createFloatingCursor(container)

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

            //Lives in the floating wrapper, which survives roster<->artist navigation — tracked on
            //the wrapper itself (not this.addSwiper) so it isn't destroyed by this page's own teardown.
            //Actually destroyed in index.js's shared floating-wrapper cleanup
            this.floatingWrapper._swipers = this.floatingWrapper._swipers || []
            this.floatingWrapper._swipers.push(swiper)

            //So the shared cursor can drive this slider when it's the active one
            sliderWrapper._swiper = swiper
        }

    }

}
