import AirDatepicker from 'air-datepicker'
import localeEn from 'air-datepicker/locale/en'
import 'air-datepicker/air-datepicker.css'


export class Footer {

    constructor() {
        this.footer = document.querySelector('.footer-wrapper')
        this.footerLogoInstance = document.querySelector('.footer-logo-instance-stretched')
        this.footerTrigger = document.querySelector('.footer-content-grid')
        this.footerEndTrigger = document.querySelector('.footer-content-container')
        this.footerTimeline = gsap.timeline()
        this.footerDummy = document.querySelector('.footer-dummy')
    }

    setup() {
        this.footerTimeline.to(this.footerLogoInstance, {
            scrollTrigger: {
                trigger: this.footerTrigger,
                endTrigger: this.footerEndTrigger,
                start: 'bottom bottom',
                end: 'bottom bottom',
                //markers: true,
                scrub: true,
                refreshPriority: 1
            },
            height: '100%',
            ease: "none"
        })

        if (this.footerDummy) { this.addLinksToFooter() }

        let datepicker = new AirDatepicker('#event-date', {
            locale: localeEn,
            dateFormat: 'MM/dd/yyyy',
        })

    }

    addLinksToFooter() {

        let itemsLeft = this.footerDummy.children[0]
        let itemsRight = this.footerDummy.children[1]

        let columnLeft = this.footer.querySelector('#footer-links-left-column')
        let columnRight = this.footer.querySelector('#footer-links-right-column')



        itemsRight.querySelectorAll('[data-link-name]').forEach((link) => {

            let name = link.dataset.linkName
            let url = link.dataset.linkUrl

            let element = document.createElement('a')
            element.classList.add('link-element')
            element.href = url
            element.innerHTML = `<div>${name}</div`


            columnRight.append(element)

        })


        itemsLeft.querySelectorAll('[data-link-name]').forEach((link) => {

            let name = link.dataset.linkName
            let url = link.dataset.linkUrl

            let element = document.createElement('a')
            element.classList.add('link-element')
            element.href = url
            element.innerHTML = `<div>${name}</div>`


            columnLeft.append(element)

        })






    }

    update() {
        ScrollTrigger.refresh()
    }


}