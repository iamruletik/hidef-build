import { gsap, ScrollTrigger, SplitText } from '../core/gsap'
import { BasePage } from '../core/BasePage'
import { setupServiceFolders } from '../core/serviceCounts'
import { prepareFolder, setupFolderSnap } from '../core/serviceFolders'


export class MainPage extends BasePage {

    constructor(barbaContainer, lenis) {
        super(barbaContainer)
        this.lenis = lenis
        this.runningLineWrapper = barbaContainer.querySelector('.running_line')
        this.runningLine = barbaContainer.querySelectorAll('.running_line_container')

        this.heroBottomContent = barbaContainer.querySelector('.hero_bottom_content')
        this.heroSplit = null

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

        //NOT ctx-tracked — ctx.revert() undoes inline styles (snapping animated properties back to
        //their pre-animation state), which is wrong here: these keep running live while the page is
        //visible (infinite loop, scroll-scrubbed), so a revert would visibly reset them. Cleanup is
        //explicit in destroy() instead (kill, not revert)
        this.runningLineTimeline = gsap.timeline().pause()
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

        this.heroBottomAnimation()

    }

    //Hero bottom block: split once, parked hidden below its line masks. Revealed via revealHeroBottom()
    //(preloader end / barba enter), hidden back into the mask as soon as scrolling starts
    heroBottomAnimation() {
        if (!this.heroBottomContent) return

        this.heroSplit = new SplitText(this.heroBottomContent, { type: 'lines', mask: 'lines' })
        gsap.set(this.heroSplit.lines, { yPercent: 100 })

        //Hide upward into the mask once the user scrolls past 50px; comes back at the top
        gsap.fromTo(this.heroSplit.lines,
            { yPercent: 0 },
            {
                yPercent: -100,
                stagger: 0.03,
                duration: 0.5,
                ease: 'power2.in',
                immediateRender: false, //don't stomp the pre-reveal hidden state (yPercent 100)
                scrollTrigger: {
                    trigger: this.container,
                    start: 'top+=50 top',
                    toggleActions: 'play none none reverse'
                }
            })
    }

    //Lines rise up out of the mask into place.
    //No overwrite here — overwrite:true would kill the ScrollTrigger-attached hide tween (not yet played)
    revealHeroBottom() {
        if (!this.heroSplit) return
        gsap.to(this.heroSplit.lines, {
            yPercent: 0,
            stagger: 0.06,
            duration: 0.8,
            ease: 'power2.out'
        })
    }


    eventSliderAnimation() {

        //Unhide All Slider Items
        this.eventCylinderItems.forEach((item) => {
            item.classList.remove("w-condition-invisible")
        })

        //Change Layout for CSS working properly
        this.eventSliderWrapper.prepend(this.eventSlider)

        this.createItemFog()

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
            yPercent: -10,
            onUpdate: () => this.updateItemFog()
        }, "<")

        this.eventSliderTimeline.to(this.eventCylinderItems, {
            //bigger radius on mobile — matches the ≤991 scaled-up cylinder so cards don't bunch up
            "--zTranslation": window.matchMedia('(max-width: 991px)').matches ? "70vw" : "35vw",
        }, "<")

        this.eventCardsFanOut()

        this.updateItemFog()
    }

    //Cards start clustered at slot 1, scaled to 0. When the section is properly on screen they pop in
    //and sweep one direction around the ring into their slots (all deltas positive = same direction;
    //farther cards travel farther, everyone arrives together)
    eventCardsFanOut() {
        gsap.set(this.eventCylinderItems, { '--position': 1, '--cardScale': 0 })

        //Text block reveals with the fan-out: heading + paragraph lines from their masks, button fades up
        let textBlock = this.container.querySelector('.event_archive-content_text')
        let textSplit = null
        let button = null
        if (textBlock) {
            button = textBlock.querySelector('.default-button')
            textSplit = new SplitText(
                [textBlock.querySelector('.h4'), textBlock.querySelector('.large_paragraph')].filter(Boolean),
                { type: 'lines', mask: 'lines' }
            )
            gsap.set(textSplit.lines, { yPercent: 100 })
            if (button) gsap.set(button, { autoAlpha: 0, y: 20 })
        }

        ScrollTrigger.create({
            trigger: this.eventSection,
            start: 'top 60%',
            once: true,
            onEnter: () => {
                gsap.to(this.eventCylinderItems, {
                    '--position': (i) => i + 1,
                    '--cardScale': 1,
                    duration: 1,
                    stagger: 0.05,
                    ease: 'power2.inOut', //cubic
                    onUpdate: () => this.updateItemFog()
                })

                //Slow independent orbit, started once the cards are in. Runs on its own property (--orbit)
                //so it never conflicts with the scrub's rotationY on .event_archive-slider or the fan-out's
                //--position — GSAP only overwrites tweens sharing a property. 360deg ≡ 0deg so repeat is
                //seamless. Fog reads --orbit too (see updateItemFog).
                this.eventOrbitTween = gsap.fromTo(this.eventCylinderItems,
                    { '--orbit': '0deg' },
                    {
                        '--orbit': '360deg',
                        duration: 60, ease: 'none', repeat: -1,
                        onUpdate: () => this.updateItemFog()
                    })

                if (textSplit) {
                    gsap.to(textSplit.lines, {
                        yPercent: 0,
                        duration: 0.8, stagger: 0.07, ease: 'power2.out'
                    })
                }

                if (button) {
                    gsap.to(button, {
                        autoAlpha: 1, y: 0,
                        duration: 0.6, ease: 'power2.out', delay: 0.3
                    })
                }
            }
        })
    }

    //Add a per-item fog overlay div (reused across items instead of hand-placed gradients)
    createItemFog() {
        this.eventCylinderItems.forEach((item) => {
            let fog = document.createElement('div')
            fog.classList.add('event-archive-item-gradient')
            item.appendChild(fog)
        })
    }

    //Items only ever move via the cylinder's global rotationY (own angle is fixed per item),
    //so combining the two tells us how close each item currently is to the camera
    updateItemFog() {
        let quantity = this.eventCylinderItems.length
        let globalRotationY = gsap.getProperty(this.eventSlider, "rotationY")
        //Slow orbit rides on its own var — fold it into the facing calc so fog tracks the orbit too
        let orbit = parseFloat(gsap.getProperty(this.eventCylinderItems[0], '--orbit')) || 0

        this.eventCylinderItems.forEach((item, i) => {
            //Live --position, not the index — during the fan-out cards are between slots
            let position = parseFloat(gsap.getProperty(item, '--position')) || i + 1
            let ownAngle = (position - 1) * (360 / quantity)
            let combinedAngle = (ownAngle + globalRotationY + orbit) * (Math.PI / 180)
            let facing = Math.cos(combinedAngle) // 1 = facing camera (near), -1 = facing away (far)
            let fogOpacity = (1 - facing) / 2 // 0 near, 1 far

            item.style.setProperty('--fogOpacity', fogOpacity)
        })
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
        let originalTotal = cards.length

        if (originalTotal === 0) return //no projects at all — nothing to build a slider from

        //≤991: skip the stacked-deck intro, start the slider in its working state (see the introStackReveal
        //branch below). Evaluated at setup, not live — the intro is a structural scroll-timeline
        let isMobile = window.matchMedia('(max-width: 991px)').matches

        const DURATION = 0.7
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        const GAP = rootFontSize * 3
        let cardWidth = cards[0].offsetWidth
        let cardHeight = cards[0].offsetHeight
        let CARD_STEP = cardWidth + GAP

        let containerWidth = container.offsetWidth
        let desiredVisibleCount = Math.max(1, Math.ceil((containerWidth + GAP) / CARD_STEP))

        //Not enough real projects to fill the visible slots plus one off-screen card to cycle
        //in — clone the existing cards (cycling through the original set) until there are enough.
        //Content repeats, but the slider still has real, independent DOM nodes to animate as if infinite.
        //Padded total is rounded up to a full multiple of originalTotal — a partial cycle would break
        //the repeat where the array wraps (e.g. 1,2,1,2,1 puts two "1"s next to each other at the seam)
        let requiredTotal = desiredVisibleCount + 1
        if (originalTotal < requiredTotal) {
            let paddedTotal = Math.ceil(requiredTotal / originalTotal) * originalTotal
            let originalCards = cards.slice()
            while (cards.length < paddedTotal) {
                let clone = originalCards[cards.length % originalTotal].cloneNode(true)
                clone.style.opacity = '' //cloned from source markup — reset below, not inherited
                container.appendChild(clone)
                cards.push(clone)
            }
        }

        let total = cards.length
        const VISIBLE_COUNT = Math.min(desiredVisibleCount, total - 1)

        //Exactly one card is "active" (opacity 1) at rest — the rest sit at 0.5. Authoritative here
        //rather than relying on createCards' initial paint, since cloneNode would otherwise copy
        //the source card's opacity onto every one of its duplicates
        cards.forEach(card => { card.style.opacity = 0.5 })
        cards[total - 1].style.opacity = 1

        //Desktop: container is half-viewport-wide, so flush-right (containerWidth - cardWidth) lands the
        //active card at viewport center. ≤991: container is full width, so flush-right would hit the screen
        //edge — center it within the container instead.
        let activeX = isMobile ? (containerWidth - cardWidth) / 2 : containerWidth - cardWidth

        function getSlotPositionX(slotIndex) {
            return activeX - (VISIBLE_COUNT - 1 - slotIndex) * CARD_STEP
        }

        let head = total - 1
        let animating = false

        //Pagination "current / total" shows the real project count, not the padded clone count —
        //head cycles through the padded range, so wrap it back to the original project's own index
        let pagination = this.container.querySelector('.projects-content-pagination')
        function updatePagination() {
            if (pagination) pagination.textContent = `${originalTotal - (head % originalTotal)} / ${originalTotal}`
        }

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

        //Intro Stack Reveal — cards start stacked with their bottom edge 1.25rem above this
        //section's top (i.e. still sitting in the screen above), scaled down (fan depth capped
        //at the front 3, everything behind that sits underneath the 3rd card, unchanged).
        //Phase 1 (scrubbed to scroll, between screen 1 and this one) drops the stack straight
        //down into resting height while scaling up — x stays put. Once the section has fully
        //scrolled into place, the scrub is killed (locked forward, no reversing) and phase 2
        //takes over as a plain one-shot tween that unstacks the cards sideways into their real
        //slot positions. Slider only becomes interactive once phase 2 completes.
        let sliderActivated = false

        const activateSlider = () => {
            if (sliderActivated) return
            sliderActivated = true

            let previousButton = this.container.querySelector('[data-slider-prev]')
            let nextButton = this.container.querySelector('[data-slider-next]')
            if (previousButton) previousButton.addEventListener('click', slideLeft)
            if (nextButton) nextButton.addEventListener('click', slideRight)
        }

        const introStackReveal = () => {
            const STACK_SCALE = 0.2
            const STACK_FAN_STEP = 12 // px per card while stacked, just enough to read as a deck
            const STACK_FAN_SCALE_STEP = 0.05 // scale reduction per depth level while stacked
            const STACK_FAN_DEPTH = 4 // only the front 3 cards fan out, the rest sit underneath the 3rd
            //True VISUAL gap between the deck's bottom edge and the section top (scale-independent now
            //that stackDropY compensates for center-origin scaling). The cardHeight term reproduces the
            //original eyeballed position from the 0.3-scale era — tune this line alone to move the deck.
            const STACK_BOTTOM_OFFSET = 1.25 * rootFontSize + cardHeight * 0.35

            let visibleCards = Array.from({ length: VISIBLE_COUNT }, (_, slotIndex) => getCardAtSlot(slotIndex))
            let visibleDescriptions = visibleCards.map(card => card.querySelector('.cards_item-description'))
            let stackAnchorX = getSlotPositionX(VISIBLE_COUNT - 1) // front/active card's own final x

            function fanDepth(slotIndex) {
                return Math.min(VISIBLE_COUNT - 1 - slotIndex, STACK_FAN_DEPTH - 1)
            }

            function fannedStackX(slotIndex) {
                return stackAnchorX - fanDepth(slotIndex) * STACK_FAN_STEP
            }

            function fannedStackScale(slotIndex) {
                return STACK_SCALE - fanDepth(slotIndex) * STACK_FAN_SCALE_STEP
            }

            //Distance from the cards' natural resting position up to "1.25rem above the section top".
            //Scale is center-origin, so the VISUAL bottom edge sits cardHeight*(1-scale)/2 above the
            //unscaled one — compensate, or the gap grows as STACK_SCALE shrinks
            let section = this.projectsSliderContainer.parentElement
            //console.log(section)
            let sectionTop = section.getBoundingClientRect().top
            let naturalBottom = container.getBoundingClientRect().bottom - sectionTop
            let stackDropY = -STACK_BOTTOM_OFFSET - naturalBottom + cardHeight * (1 - STACK_SCALE) / 2

            //x starts at the fanned deck position
            gsap.set(visibleCards, {
                x: (slotIndex) => fannedStackX(slotIndex),
            })
            gsap.set(visibleDescriptions, { opacity: 0 })

            //"SEE OUR PROJECTS" next to the stacked deck — wrapper is the mask, inner text rolls
            //down into it as soon as the cards start scrolling
            let stackText = document.createElement('div')
            stackText.classList.add('stack-side-text')
            stackText.innerHTML = '<div>SEE OUR<br>PROJECTS</div>'
            container.append(stackText)

            //Deck's visual right edge: front card's center + half its scaled width, plus a 1rem gap.
            //Vertically centered on the deck (scale is center-origin, so the center Y doesn't move)
            let deckRightX = stackAnchorX + cardWidth / 2 + (cardWidth * STACK_SCALE) / 2 + rootFontSize
            gsap.set(stackText, { x: deckRightX, y: stackDropY + cardHeight / 2, yPercent: -50 })

            let dropTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: 'top bottom',
                    end: '25% 0%',
                    scrub: false,
                    once: true,
                }
            })

            //Phase 1 — drop in from above + scale up (per-card fan scale)
            //Same duration/ease as the x-spread below so drop, scale and unstack all travel together
            dropTimeline.from(visibleCards, {
                y: stackDropY,
                scale: (slotIndex) => fannedStackScale(slotIndex),
                opacity: 1,
                duration: 1.6,
                ease: 'power2.inOut',
                immediateRender: true,
            })

            //Phase 2 — unstack sideways into the row, played together with phase 1 ("<").
            //Longer duration = bigger share of the scrubbed scroll distance, so the spread reads slower
            dropTimeline.to(visibleCards, {
                onStart: () => gsap.set(container, { zIndex: 0 }),
                x: (slotIndex) => getSlotPositionX(slotIndex),
                duration: 1.6,
                stagger: 0.09,
                ease: 'power2.inOut',
            }, "<")

            //Text rolls down into its mask over the first stretch of the scroll
            dropTimeline.to(stackText.firstChild, {
                yPercent: 100,
                ease: 'none',
                duration: 0.3,
            }, 0)

            dropTimeline.to(visibleDescriptions, {
                opacity: 1,
                duration: 0.6,
                onStart: () => revealDescriptionBlock(), //desc block rides in with the unstack
                onComplete: () => {
                    activateSlider()
                }
            }, "<+=0.9") //~35% into the 2.6 unstack — same proportion "<+=0.5" was in the 1.4 era, keeps the snap distance (and so its speed) as before


        }

        if (isMobile) {
            gsap.set(container, { zIndex: 0 }) //mark as already-unstacked so the transition hide (toggleStackedSliderCards) leaves it
            activateSlider()                    //wire prev/next now — no intro to wait on
        } else {
            introStackReveal()
        }
        updatePagination()


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
                    updatePagination()
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
                    updatePagination()
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


        //Single Description Block — one instance (the Webflow original), text swapped per project.
        //No clones: .default-label is static, the title/paragraph get new text, the button gets a new href.
        let descriptionContainer = this.projectsSliderContainer.parentElement.querySelector('.projects_container-description')
        let projectsData = this.projectsData
        let titleElement = descriptionContainer?.querySelector('.h3')
        let labelElement = descriptionContainer?.querySelector('.large_paragraph')
        let linkElement = descriptionContainer?.querySelector('.default-button')

        let activeDescIndex = head
        let descSplit = null
        let descTween = null

        //Lock Title to 2 Lines (word-truncate via binary search)
        function clampTitle() {
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
        }

        function setDescriptionContent(index) {
            //index may run over the padded clone range — wrap back to the real project it repeats
            let projectData = projectsData[index % projectsData.length]
            titleElement.textContent = projectData.dummyName
            labelElement.textContent = projectData.dummyLabel
            linkElement.href = projectData.link
            clampTitle()
        }

        if (titleElement && labelElement && linkElement) {
            setDescriptionContent(head)
            //Hidden until the cards unstack — revealDescriptionBlock brings it in from the dropTimeline scrub.
            //On mobile there's no unstack, so leave it visible (working state)
            if (!isMobile) gsap.set(descriptionContainer, { autoAlpha: 0 })
        }

        //One-shot reveal, fired from the intro scrub while the cards unstack: title + paragraph lines
        //drop in from the top of their masks, static label and button fade up after.
        //Also snaps the page slowly onto the section so the intro finishes framed.
        let lenis = this.lenis
        let sliderSection = this.container.querySelector('#projects-slider')

        //Bottom text block (counter + blurb + link) reveals together with the description
        let bottomBlock = this.container.querySelector('.bottom_content-text')
        let bottomTexts = bottomBlock ? [bottomBlock.querySelector('.bottom_content-number'), bottomBlock.querySelector('.bottom_content-text_container > div')].filter(Boolean) : []
        let bottomLink = bottomBlock?.querySelector('.link-element')
        if (bottomBlock && !isMobile) gsap.set(bottomBlock, { autoAlpha: 0 }) //mobile: no intro, keep visible

        let descRevealed = false
        function revealDescriptionBlock() {
            if (descRevealed || !titleElement) return
            descRevealed = true

            if (lenis && sliderSection) lenis.scrollTo(sliderSection, { duration: 1.2, lock: true })

            gsap.set(descriptionContainer, { autoAlpha: 1 })
            if (bottomBlock) gsap.set(bottomBlock, { autoAlpha: 1 })

            let split = new SplitText([titleElement, labelElement, ...bottomTexts], { type: 'lines', mask: 'lines' })
            gsap.from(split.lines, {
                yPercent: -100,
                duration: 0.7, stagger: 0.07, ease: 'power2.out',
                onComplete: () => split.revert()
            })

            let staticLabel = descriptionContainer.querySelector('.default-label')
            let fadeTargets = [staticLabel, linkElement, bottomLink].filter(Boolean)

            //.link-element has a CSS opacity transition that fights GSAP's per-tick updates
            //(element lags at ~0 the whole tween) — suspend it while animating, restore for hover
            gsap.set(fadeTargets, { transition: 'none' })
            gsap.from(fadeTargets, {
                autoAlpha: 0, y: 20,
                duration: 0.6, stagger: 0.08, ease: 'power2.out', delay: 0.2,
                onComplete: () => gsap.set(fadeTargets, { clearProps: 'transition' })
            })
        }

        function updateDescriptionBlock(newIndex) {
            if (!titleElement || activeDescIndex === newIndex) return
            activeDescIndex = newIndex

            //Interrupted mid-swap — clean up so the re-split starts from natural text
            if (descTween) descTween.kill()
            if (descSplit) { descSplit.revert(); descSplit = null }

            //Old text rolls DOWN into the mask, out of sight
            descSplit = new SplitText([titleElement, labelElement], { type: 'lines', mask: 'lines' })
            descTween = gsap.to(descSplit.lines, {
                yPercent: 100,
                duration: 0.4, stagger: 0.05, ease: 'power2.in',
                onComplete: () => {
                    //Nothing visible now — swap the text, then let the new lines drop in from the top
                    descSplit.revert()
                    setDescriptionContent(newIndex)

                    descSplit = new SplitText([titleElement, labelElement], { type: 'lines', mask: 'lines' })
                    descTween = gsap.from(descSplit.lines, {
                        yPercent: -100,
                        duration: 0.7, stagger: 0.07, ease: 'power2.out',
                        onComplete: () => {
                            descSplit.revert()
                            descSplit = null
                            descTween = null
                        }
                    })
                }
            })
        }

    }

    createCards() {

        //Size Correctly Wrapper
        let controlsContainer = this.container.querySelector('.projects-content-buttons')
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        //Desktop: half-viewport + half-card offset so the active card lands off-center in the layout.
        //≤991: full viewport width so the card just centers itself.
        this.projectsSliderContainer.style.width = window.matchMedia('(max-width: 991px)').matches
            ? "100%"
            : (window.innerWidth / 2 + this.projectsSliderItemDummy.offsetWidth / 2) / rootFontSize + "rem"
        controlsContainer.style.width = this.projectsSliderItemDummy.offsetWidth / rootFontSize + "rem"
        //Desktop: buttons ride the container's right edge (= viewport center, since container is half-width).
        //≤991: container is full width, so right-edge = page edge — true-center them instead.
        if (window.matchMedia('(max-width: 991px)').matches) {
            controlsContainer.style.right = 'auto'
            controlsContainer.style.left = '50%'
            controlsContainer.style.transform = 'translateX(-50%)'
        }
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

        //No service folders in this container (empty CMS list, or the section isn't on the page) — nothing
        //to pin. Guard so a missing/empty folder section doesn't throw (getComputedStyle on servicesFolders[0]
        //when undefined) and take down the whole main-page mount
        if (!this.servicesFolders.length) return

        setupServiceFolders(this.container) //projects-per-service counts + placeholder-button hide, before the layout is torn down

        this.folderWebflowContainer.remove() //Remove Webflow Layout

        this.servicesFolders.forEach((folder) => {
            this.foldersWrapper.append(folder) //Move Nodes to the actual layout
            prepareFolder(this, folder)        //slider + cursor + content reveal + autoplay-on-view (shared)
        })


        //--top-folder-height is in rem — convert to px via the root font size
        let rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
        let folderPinHeight = (parseFloat(getComputedStyle(this.servicesFolders[0]).getPropertyValue('--top-folder-height')) || 0) * rootFontSize

        let isMobile = window.matchMedia('(max-width: 991px)').matches

        //Mobile: content can be taller than the folder's clipped box (.service-content is a fixed-height
        //visible pinned area). The content fits its own auto-height box, but the box itself can run taller
        //than the on-screen area once pinned (folder top sits at 10% + --top-folder-height). Overflow per
        //folder = how far its box extends past that visible area; the timeline scrolls it up by that much.
        let visibleArea = window.innerHeight - (window.innerHeight * 0.1 + folderPinHeight)
        let overflows = [...this.servicesFolders].map((container) => {
            if (!isMobile) return 0
            let content = container.querySelector('.service-content')
            if (!content) return 0
            return Math.max(0, content.clientHeight - visibleArea)
        })
        let totalOverflow = overflows.reduce((sum, o) => sum + o, 0)

        // Create a timeline linked to the page scroll
        let servicesTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: this.foldersWrapper,
                // Trigger top hits 10% of the viewport, offset down by --top-folder-height
                start: () => `top ${window.innerHeight * 0.1 + folderPinHeight}px`,
                //Desktop: one screen per folder. Mobile: one screen per reveal + the measured content
                //overflow, so 1 timeline-second maps to innerHeight px and content scroll maps 1:1 to px
                end: () => `+=${isMobile
                    ? window.innerHeight * (this.servicesFolders.length - 1) + totalOverflow
                    : window.innerHeight * this.servicesFolders.length}`,
                scrub: true, // Ties the animation smoothly to the scroll wheel
                pin: true,   // Pins the wrapper wrapper in place
                refreshPriority: 2
            }
        });

        //Folder snap off on ≤991 — touch scrolling shouldn't get hijacked into forced folder-to-folder jumps
        if (!isMobile) {
            setupFolderSnap(this, servicesTimeline.scrollTrigger, this.servicesFolders.length) //shared wheel snap
        }

        // Animate each container up into view one by one; on mobile also scroll its overflowing content
        this.servicesFolders.forEach((container, i) => {

            if (i > 0) {
                servicesTimeline.from(container, {
                    yPercent: 100,               // Starts below the screen
                    ease: "none",                // Keeps the movement uniform
                    duration: isMobile ? 1 : 0.5 // mobile: one full screen of scroll per reveal
                })
            }

            //Scroll the folder's whole content up by its own overflow (duration in "screens" = overflow/innerHeight).
            //Mobile stacks name+slider+right inside .service-content, so move every child together — not just the
            //right column — and the clipped .service-content box reveals the lower part.
            if (isMobile && overflows[i] > 0) {
                let content = container.querySelector('.service-content')
                if (content) {
                    servicesTimeline.to(content.children, {
                        y: -overflows[i],
                        ease: "none",
                        duration: overflows[i] / window.innerHeight
                    })
                }
            }
        })


    }

    run() {
        this.runningLineTimeline.play()
    }

    //Called from barba beforeLeave (deferred until 'safeToDestroy' — see PageRegistry). super.destroy()
    //removes the tracked wheel listener; ctx.revert() is a no-op here since nothing's added to ctx.
    //Everything else is killed explicitly (not reverted) so nothing visibly snaps back to its
    //pre-animation state — by the time this runs the screen is already covered, but kill is still the
    //right operation, not revert, since revert also fights ScrollTrigger.getAll() below over the same STs
    destroy() {
        super.destroy()

        this.runningLineTimeline.kill()
        this.eventSliderTimeline.kill()
        if (this.eventOrbitTween) this.eventOrbitTween.kill()

        ScrollTrigger.getAll().forEach((st) => {
            if (st.trigger && this.container.contains(st.trigger)) st.kill()
        })
    }

}