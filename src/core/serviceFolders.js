import { gsap, SplitText } from './gsap'
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

//Shared pinned-folder behavior for the main page and the services page. `page` is the BasePage
//instance (needs .container, .lenis, addListener/addObserver/addSwiper) so all resources are tracked
//and torn down on navigation. Each page keeps its own pin timeline / container animations — this only
//covers the parts that are identical: the slider, the content reveal, autoplay-on-view, and the snap.

//Size the slider, build the cursor slider, and reveal the folder's content (with autoplay) once it
//scrolls into view. Call after the folder is in its final position so measurements are correct.
export function prepareFolder(page, folder) {
    let content = folder.querySelector('.service-content')
    let name = content.querySelector('.service-content-name')
    let slider = content.querySelector('.service-content-slider')
    let right = content.querySelector('.service-content-right')

    let contentGap = parseInt(window.getComputedStyle(right).gap, 10)
    let nameHeight = name.offsetHeight
    let contentPaddingBottom = parseInt(window.getComputedStyle(content).paddingBottom, 10)
    let contentPaddingTop = parseInt(window.getComputedStyle(content).paddingTop, 10)
    let sliderNewHeight = content.offsetHeight - nameHeight - contentGap - contentPaddingBottom - contentPaddingTop

    //Recalculate height of slider
    slider.style.height = (100 * sliderNewHeight / window.innerHeight) + "vh"

    let swiper = createFolderSlider(page, slider)
    let reveal = revealFolderContent(folder)
    let revealed = false

    observeFolder(page, folder,
        () => {
            if (!revealed) { revealed = true; reveal.play() } //content reveal fires once only
            if (swiper && swiper.autoplay) swiper.autoplay.start() //autoplay's own delay paces the first move
        },
        () => { if (swiper && swiper.autoplay) swiper.autoplay.stop() }
    )
}

//Folder image slider with a custom cursor. Loop/autoplay only when there's more than one slide.
function createFolderSlider(page, sliderContainer) {
    let slideCount = sliderContainer.querySelectorAll('.swiper-slide').length
    if (slideCount === 0) return null

    let swiperElement = sliderContainer.querySelector('.swiper')

    let pagination = document.createElement('div')
    pagination.classList.add('swiper-pagination')
    swiperElement.append(pagination)

    //Loop/autoplay only make sense with more than one slide — a folder can have just one project
    let multiple = slideCount > 1

    let swiper = new Swiper(swiperElement, {
        modules: [Navigation, Pagination, Autoplay],
        loop: multiple,
        snapToSlideEdge: true,
        speed: 400,
        pagination: {
            el: '.swiper-pagination',
            type: "fraction"
        },
        autoplay: multiple && {
            disableOnInteraction: false,
            delay: 2000
        }
    })

    page.addSwiper(swiper)

    if (swiper.autoplay) swiper.autoplay.stop() //Off until the folder is in view (see prepareFolder)

    //Click zones on top of the slides: left half = previous, right half = next.
    //The arrow is a real element following the mouse (CSS cursor images can't be animated
    //or recolored) — tinted from the folder's sticky-fake-container, popping on click
    let zones = document.createElement('div')
    zones.classList.add('slider-nav-zones')
    zones.innerHTML = '<div class="slider-nav-zone slider-nav-zone--prev"></div><div class="slider-nav-zone slider-nav-zone--next"></div>'
    swiperElement.append(zones)

    zones.firstChild.addEventListener('click', () => swiper.slidePrev())
    zones.lastChild.addEventListener('click', () => swiper.slideNext())

    let cursor = document.createElement('div')
    cursor.classList.add('slider-cursor')
    cursor.innerHTML = `
        <svg class="slider-cursor-prev" width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27 0C12.0883 0 0 12.0883 0 27C0 41.9117 12.0883 54 27 54C41.9117 54 54 41.9117 54 27C54 12.0883 41.9117 0 27 0ZM26.9297 26.0352H35V28.0352H26.9297V32.8096L16.9297 27.0352L26.9297 21.2627V26.0352Z" fill="currentColor"/></svg>
        <svg class="slider-cursor-next" width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27 0C41.9117 0 54 12.0883 54 27C54 41.9117 41.9117 54 27 54C12.0883 54 0 41.9117 0 27C0 12.0883 12.0883 0 27 0ZM26.0703 26.0352H18V28.0352H26.0703V32.8096L36.0703 27.0352L26.0703 21.2627V26.0352Z" fill="currentColor"/></svg>
    `
    zones.append(cursor)

    //Tint from this folder's sticky-fake-container background
    let fakeContainer = sliderContainer.closest('.services-sticky-container')?.querySelector('.sticky-fake-container')
    if (fakeContainer) cursor.style.color = getComputedStyle(fakeContainer).backgroundColor

    let prevIcon = cursor.querySelector('.slider-cursor-prev')
    let nextIcon = cursor.querySelector('.slider-cursor-next')
    let moveX = gsap.quickTo(cursor, 'x', { duration: 0.15, ease: 'power2.out' })
    let moveY = gsap.quickTo(cursor, 'y', { duration: 0.15, ease: 'power2.out' })

    //Don't reveal on enter (appears stuck at the edge). Wait until the real cursor has travelled
    //a bit into the zone, then snap the custom cursor onto it (no fly-in) and fade + scale it in
    let cursorRevealed = false
    let enterX = 0, enterY = 0
    const REVEAL_DISTANCE = 40 //px the real cursor must travel inside before the custom one shows

    zones.addEventListener('mouseenter', (e) => {
        enterX = e.clientX
        enterY = e.clientY
        cursorRevealed = false
    })

    zones.addEventListener('mousemove', (e) => {
        let rect = zones.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top

        if (!cursorRevealed) {
            if (Math.hypot(e.clientX - enterX, e.clientY - enterY) < REVEAL_DISTANCE) return
            gsap.set(cursor, { x, y }) //snap to the real position — no fly-in
            gsap.fromTo(cursor, { autoAlpha: 0, scale: 0.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power2.out', overwrite: true })
            cursorRevealed = true
        }

        moveX(x)
        moveY(y)

        let onLeftHalf = x < rect.width / 2
        prevIcon.style.display = onLeftHalf ? 'block' : 'none'
        nextIcon.style.display = onLeftHalf ? 'none' : 'block'
    })

    zones.addEventListener('mouseleave', () => {
        cursorRevealed = false
        gsap.to(cursor, { autoAlpha: 0, duration: 0.2 })
    })

    //Pop on click — snap down, ease back (cubic)
    zones.addEventListener('click', () => {
        gsap.fromTo(cursor, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
    })

    return swiper
}

//Fire onEnter/onLeave when a folder crosses into/out of view (lower threshold = fires earlier)
function observeFolder(page, folder, onEnter, onLeave, threshold = 0.2) {
    let active = false

    let observer = page.addObserver(new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            let inView = entry.intersectionRatio >= threshold
            if (inView && !active) {
                active = true
                onEnter && onEnter()
            } else if (!inView && active) {
                active = false
                onLeave && onLeave()
            }
        })
    }, { threshold: [threshold] }))

    observer.observe(folder)
}

//Folder-content reveal — returns a paused timeline. Text elements reveal line-by-line up from a mask;
//buttons + tags fade/move up. Everything on cubic (power2) easing.
export function revealFolderContent(folder) {
    let ease = 'power2.out' // cubic
    let tl = gsap.timeline({ paused: true })

    //Masked line reveals — short headline-type elements only (rich body text masks badly with its leading)
    let maskTargets = [
        folder.querySelector('.service-content-name'),
        folder.querySelector('.service-count-number'),
        folder.querySelector('.service-count-label'),
    ].filter(Boolean)

    if (maskTargets.length) {
        let split = new SplitText(maskTargets, { type: 'lines', mask: 'lines', linesClass: 'reveal-line' })
        tl.from(split.lines, {
            yPercent: 100,
            duration: 0.8,
            stagger: 0.05,
            ease
        })
    }

    //Rich body text — line-by-line fade + up, no mask (avoids the leading/clip issues)
    let rich = folder.querySelector('.service-content-rich')
    if (rich) {
        let richSplit = new SplitText(rich, { type: 'lines' })
        tl.from(richSplit.lines, {
            autoAlpha: 0,
            y: 20,
            duration: 0.6,
            stagger: 0.05,
            ease
        }, '<')
    }

    //Slider — slight fade + move up
    let sliderEl = folder.querySelector('.service-content-slider')
    if (sliderEl) {
        tl.from(sliderEl, { autoAlpha: 0, y: 20, duration: 0.6, ease }, '<')
    }

    //Buttons — fade + move up
    let buttons = folder.querySelector('.service-content-buttons')
    if (buttons) {
        tl.from(buttons, { autoAlpha: 0, y: 20, duration: 0.6, ease }, '<0.2')
    }

    //Tags — the finale: fade + move up, staggered, after everything else so it's still playing when the folder lands
    let tags = folder.querySelectorAll('.service-tags-container > *')
    if (tags.length) {
        tl.from(tags, { autoAlpha: 0, y: 20, duration: 0.6, stagger: 0.08, ease }, '>-0.2')
    }

    return tl
}

//Input-driven folder snap. ScrollTrigger's built-in snap fires only once the scroller stops, and Lenis'
//low lerp coasts for a long time — so it snaps late. Instead, step to the next/prev folder on wheel
//intent and drive it through Lenis. `st` is the pin timeline's ScrollTrigger.
export function setupFolderSnap(page, st, folderCount) {
    let lenis = page.lenis
    if (folderCount <= 1 || !lenis) return

    const THRESHOLD = 500 // accumulated wheel delta needed before committing a step (higher = less eager)
    const SNAP_DURATION = 1.2
    const RELEASE_TIME = 0.3 // release the input guard this early so the next folder can be queued before the snap fully settles
    let snapping = false
    let accum = 0
    let snapUnlock
    const snapScroll = (i) => st.start + (i / (folderCount - 1)) * (st.end - st.start)

    //Stored on the instance so destroy() can remove it — it lives on window and would
    //otherwise keep hijacking scroll on other pages after barba swaps the container
    page.folderWheelHandler = (e) => {
        if (!st.isActive || snapping) { accum = 0; return }

        accum += e.deltaY
        if (Math.abs(accum) < THRESHOLD) return // ignore small scrolls

        let dir = Math.sign(accum)
        accum = 0

        let current = Math.round(st.progress * (folderCount - 1))
        let next = Math.min(Math.max(current + dir, 0), folderCount - 1)
        if (next === current) return // at an edge — let the page scroll past normally

        snapping = true
        lenis.scrollTo(snapScroll(next), {
            duration: SNAP_DURATION,
            lock: true, // no raw-scroll momentum fighting the snap
            onComplete: () => { snapping = false; accum = 0 }
        })

        //Release the input guard partway through — the snap keeps settling, but you can already
        //commit the next folder instead of waiting the full 1.2s (lock:true still prevents momentum fight)
        if (snapUnlock) snapUnlock.kill()
        snapUnlock = gsap.delayedCall(RELEASE_TIME, () => { snapping = false })
    }

    page.addListener(window, 'wheel', page.folderWheelHandler, { passive: true })
}
