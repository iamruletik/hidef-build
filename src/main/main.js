import Swiper from 'swiper';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';


export class MainPage {

    constructor(barbaContainer) {
        this.container = barbaContainer
        this.runningLineTimeline = gsap.timeline().pause()
        this.runningLineWrapper = barbaContainer.querySelector('.running_line')
        this.runningLine = barbaContainer.querySelectorAll('.running_line_container')

        this.projectsCounter = barbaContainer.querySelector('.bottom_content-number')
        this.dummyProjectsObject = barbaContainer.querySelector('.dummy-all-project-counter')
        this.projectsSliderContainer = barbaContainer.querySelector('.projects-container-slider')
        this.projectsSliderItemDummy = barbaContainer.querySelector('.projects-slider-cards-item')
        this.dummyProjectsInfo = barbaContainer.querySelector('.dummy-projects-info')

        this.servicesFolders = barbaContainer.querySelectorAll('.services-sticky-container')
        this.foldersWrapper = barbaContainer.querySelector('.services-sticky-wrapper')
        this.folderWebflowContainer = this.foldersWrapper.querySelector('.w-dyn-list')

        this.eventCylinderItems = barbaContainer.querySelectorAll('.event_archive-item')
        this.eventSection = barbaContainer.querySelector(".event_archive-section")
        this.eventBanner = barbaContainer.querySelector('.event_archive-banner')
        this.eventSliderWrapper = barbaContainer.querySelector('.event_archive-slider-wrapper')
        this.eventSlider = barbaContainer.querySelector('.event_archive-slider')
        this.eventSliderTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.eventSection,
                start: "top bottom",
                end: "bottom",
                scrub: 1,
            }
        })
    }

    setup() {

        let style = window.getComputedStyle(this.runningLineWrapper)
        let gap = parseFloat(style.getPropertyValue('gap'))
        let xMov = this.runningLine[0].offsetWidth + gap

        this.runningLineTimeline.to(this.runningLine, {
            x: -xMov,
            ease: "none",
            duration: 40,
            repeat: -1
        })


        this.countProjects()

        this.createProjectsSlider()

        this.pinnedFolders()

        this.eventSliderAnimation()


    }


    eventSliderAnimation() {

        //Unhide All Slider Items
        this.eventCylinderItems.forEach((item) => {
            item.classList.remove("w-condition-invisible")
        })

        //Change Layout for CSS working properly
        this.eventSliderWrapper.prepend(this.eventSlider)
        //this.eventSliderWrapper.remove()


        this.eventSliderTimeline.set(this.eventSlider, {
            rotationZ: 0,
            rotationY: 0,
        })

        this.eventSliderTimeline.set(this.eventSliderWrapper, {
            rotationX: 0,
        })

        this.eventSliderTimeline.to(this.eventSliderWrapper, {
            rotationX: -45,
        })

        this.eventSliderTimeline.to(this.eventSlider, {
            rotationZ: -30,
            rotationY: 360,
            yPercent: -10
        }, "<")

        this.eventSliderTimeline.to(this.eventCylinderItems, {
            "--zTranslation": "35vw",
        }, "<")
    }

    countProjects() {
        try {

            //Count All Projects
            let projectsAmount = this.dummyProjectsObject.querySelectorAll('.w-dyn-item')
            this.dummyProjectsObject.remove()
            this.projectsCounter.innerHTML = projectsAmount.length

        } catch (error) {
            throw error
        }

    }

    createProjectsSlider() {

        this.createCards()
        this.initSlider()

    }

    initSlider() {

        let container = this.projectsSliderContainer.querySelector('.slider_cards')
        let cards = [...container.querySelectorAll('.projects-slider-cards-item')]
        let total = cards.length

        const DURATION = 0.7
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const GAP = rootFontSize * 3
        let cardWidth = cards[0].offsetWidth
        let cardHeight = cards[0].offsetHeight
        let CARD_STEP = cardWidth + GAP

        let containerWidth = container.offsetWidth
        const VISIBLE_COUNT = Math.min(Math.max(1, Math.ceil((containerWidth + GAP) / CARD_STEP)), total - 1)

        let activeX = containerWidth - cardWidth

        function getSlotPositionX(slotIndex) {
            return activeX - (VISIBLE_COUNT - 1 - slotIndex) * CARD_STEP
        }

        let head = total - 1
        let animating = false

        gsap.set(container, { height: cardHeight })


        function getCardAtSlot(slotIndex) {
            return cards[((head - (VISIBLE_COUNT - 1) + slotIndex) % total + total) % total]
        }

        //Place Cards
        cards.forEach(card => gsap.set(card, { display: 'none' }))

        for (let slotIndex = 0; slotIndex < VISIBLE_COUNT; slotIndex++) {
            gsap.set(getCardAtSlot(slotIndex), {
                display: '',
                x: getSlotPositionX(slotIndex),
            })
        }


        //Slide Left
        function slideLeft() {
            if (animating) return
            animating = true

            let outgoing = getCardAtSlot(0)
            let oldActive = getCardAtSlot(VISIBLE_COUNT - 1)
            let newHead = (head + 1) % total
            let incoming = cards[newHead]
            let visibleCards = Array.from({ length: VISIBLE_COUNT }, (_, slotIndex) => getCardAtSlot(slotIndex))

            gsap.set(incoming, { display: 'flex', x: getSlotPositionX(VISIBLE_COUNT - 1), scale: 0, opacity: 0, transformOrigin: '50% 50%' })

            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(outgoing, { display: 'none' })
                    animating = false
                },
                onStart: () => {
                    head = newHead
                    updateDescriptionBlock(head)
                }
            })

            tl.to(visibleCards, { x: `-=${CARD_STEP}`, duration: DURATION, ease: 'expo.inOut' })
            tl.to(oldActive, { opacity: 0.5, duration: DURATION }, '<')
            tl.to(incoming, { scale: 1, opacity: 1, duration: DURATION, ease: 'expo.inOut' }, `<+${DURATION / 2}`)
        }


        //Slide Right
        function slideRight() {
            if (animating) return
            animating = true

            let activeCard = cards[head]
            let newHead = (head - 1 + total) % total
            let newActiveCard = cards[newHead]
            let incoming = cards[((head - VISIBLE_COUNT) % total + total) % total]
            let slidingCards = Array.from({ length: VISIBLE_COUNT - 1 }, (_, slotIndex) => getCardAtSlot(slotIndex))

            gsap.set(incoming, { display: 'flex', x: getSlotPositionX(-1), scale: 1, opacity: 0, transformOrigin: '50% 50%' })
            gsap.set(activeCard, { transformOrigin: '50% 50%' })

            const tl = gsap.timeline({
                onComplete: () => {
                    animating = false
                },
                onStart: () => {
                    head = newHead
                    updateDescriptionBlock(head)
                }
            })

            tl.to(activeCard, {
                scale: 0,
                opacity: 0,
                duration: DURATION,
                ease: 'expo.inOut',
                onComplete: () => gsap.set(activeCard, { display: 'none' })
            })

            tl.to([...slidingCards, incoming], { x: `+=${CARD_STEP}`, duration: DURATION, ease: 'expo.out' }, `<+${DURATION / 2}`)
            tl.to(incoming, { opacity: 0.5, duration: DURATION }, '<')
            tl.to(newActiveCard, { opacity: 1, duration: DURATION }, '<')
        }


        //Build Description Blocks
        let descriptionContainer = this.projectsSliderContainer.parentElement.querySelector('.projects_container-description')
        let projectsData = this.projectsData
        let originalTitle = descriptionContainer?.querySelector('.h3')
        let originalContent = descriptionContainer?.querySelector('.description_content')
        let originalLink = descriptionContainer?.querySelector('.default-button')

        let descBlocks = []
        let activeDescIndex = head

        if (descriptionContainer && originalTitle && originalContent && originalLink) {
            descBlocks = projectsData.map(projectData => {
                let block = document.createElement('div')
                block.classList.add('desc-block')

                let title = originalTitle.cloneNode(false)
                title.textContent = projectData.dummyName

                let content = originalContent.cloneNode(true)
                content.querySelector('.large_paragraph').textContent = projectData.dummyLabel

                let link = originalLink.cloneNode(true)
                link.href = projectData.link

                block.append(title, content, link)
                return block
            })

            descriptionContainer.innerHTML = ''
            descBlocks.forEach(descBlock => descriptionContainer.appendChild(descBlock))
            gsap.set(descBlocks[head], { opacity: 1, pointerEvents: 'auto' })
        }


        function updateDescriptionBlock(newIndex) {
            if (!descBlocks.length || activeDescIndex === newIndex) return

            let outgoingBlock = descBlocks[activeDescIndex]
            let incomingBlock = descBlocks[newIndex]
            let titleElement = incomingBlock.querySelector('.h3')
            let labelElement = incomingBlock.querySelector('.large_paragraph')

            gsap.set(outgoingBlock.querySelector('.default-button'), { opacity: 0 })
            gsap.to(outgoingBlock, {
                opacity: 0, y: 0, duration: 0.25, ease: 'power2.in',
                onComplete: () => gsap.set(outgoingBlock, { pointerEvents: 'none', y: 0 })
            })

            //Lock Title to 2 Lines
            let lineHeight = parseFloat(getComputedStyle(titleElement).lineHeight)
            let titleHeight = lineHeight * 2 + 6
            titleElement.style.height = titleHeight + 'px'

            if (titleElement.scrollHeight > titleElement.offsetHeight + 2) {
                let words = titleElement.textContent.trim().split(/\s+/)
                let lowerBound = 1, upperBound = words.length - 1
                while (lowerBound < upperBound) {
                    let midPoint = Math.ceil((lowerBound + upperBound) / 2)
                    titleElement.textContent = words.slice(0, midPoint).join(' ')
                    if (titleElement.scrollHeight <= titleElement.offsetHeight + 2) lowerBound = midPoint
                    else upperBound = midPoint - 1
                }
                titleElement.textContent = words.slice(0, lowerBound).join(' ')
            }

            gsap.set(incomingBlock, { opacity: 1, y: 0, pointerEvents: 'auto' })
            gsap.set(incomingBlock.querySelector('.default-button'), { opacity: 1 })

            let splitTitle = new SplitText(titleElement, { type: 'lines' })
            let splitLabel = new SplitText(labelElement, { type: 'lines' })

            gsap.from([...splitTitle.lines.slice(0, 2), ...splitLabel.lines], {
                y: 16, opacity: 0,
                duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.2,
                onComplete: () => {
                    splitTitle.revert()
                    splitLabel.revert()
                    titleElement.style.height = titleHeight + 'px'
                }
            })

            activeDescIndex = newIndex
        }


        //Bind Buttons
        let previousButton = this.container.querySelector('[data-slider-prev]')
        let nextButton = this.container.querySelector('[data-slider-next]')
        if (previousButton) previousButton.addEventListener('click', slideLeft)
        if (nextButton) nextButton.addEventListener('click', slideRight)

    }

    createCards() {

        //Size Correctly Wrapper
        let controlsContainer = this.container.querySelector('.projects-content-buttons')
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        console.log(rootFontSize)
        this.projectsSliderContainer.style.width = (window.innerWidth / 2 + this.projectsSliderItemDummy.offsetWidth / 2) / rootFontSize + "rem"
        controlsContainer.style.width = this.projectsSliderItemDummy.offsetWidth / rootFontSize + "rem"
        this.projectsSliderItemDummy.remove()

    

        //Get Data
        let projects = this.dummyProjectsInfo.querySelectorAll('.dummy-projects-info-item')
        this.dummyProjectsInfo.remove()
        //console.log(projects.length)

        const data = [...projects].map(el => ({
            ...el.dataset,
            image: el.querySelector('img'),
            link: el.querySelector('.dummy-projects-info-link').href
        }))
        this.projectsData = data

        let sliderContainer = this.projectsSliderContainer.querySelector('.slider_cards')

        data.forEach((project, i) => {
            let counter = data.length - i
            let card = createItem(project.image, project.dummyDate, counter)
            card.style.opacity = counter === 1 ? 1 : 0.5
            sliderContainer.append(card)
        })


        function createItem(img, date, count) {

            let element = document.createElement('div')
            element.classList.add('projects-slider-cards-item')

            element.innerHTML = `

                            <div class="cards_item-img">
                                    <img src="${img.src}" loading="lazy" width="301" alt="" class="image">
                                </div>
                                <div class="cards_item-description">
                                    <div class="cards_item-number">
                                        <div class="dot"></div><div>${count}</div>
                                    </div>
                                <div class="cards_item-date">
                                    <div>${date}</div>
                                </div>
                            </div>
                        `
            return element
        }



    }


    pinnedFolders() {

        this.folderWebflowContainer.remove() //Remove Webflow Layout

        this.servicesFolders.forEach((folder, i) => {

            this.foldersWrapper.append(folder) //Move Nodes to the actual layout

            let projectCount = folder.querySelector('.service-count-number')
            let dummyCountDiv = folder.querySelector('.services-projects-count')
            let dummyCount = dummyCountDiv.querySelectorAll('.w-dyn-item')

            //console.log(dummyCount.length)
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
                end: () => `+=${window.innerHeight * 1 * this.servicesFolders.length}`, // Creates the scroll distance
                scrub: true, // Ties the animation smoothly to the scroll wheel
                pin: true,   // Pins the wrapper wrapper in place
                refreshPriority: 2
            }
        });

        // Animate each container up into view one by one
        this.servicesFolders.forEach((container, i) => {

            if (i > 0) {
                servicesTimeline.from(container, {
                    yPercent: 100, // Starts below the screen
                    ease: "none"   // Keeps the movement uniform
                })
            }
        })


    }


    createSlider(sliderContainer) {

        let slideCount = sliderContainer.querySelectorAll('.swiper-slide').length

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

    run() {
        this.runningLineTimeline.play()
    }

}