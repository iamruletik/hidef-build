import { gsap } from './gsap'

//One shared custom cursor for the floating roster/artist slider stack. Only ever one slider is visible
//(the [data-slider-state="active"] one), so a single pair of click-zones + arrow drives whichever swiper
//is active instead of one cursor per stacked slider. Lives inside the floating container — that's at
//scale 1 on the artist page (the only page it shows on) and hidden on roster, so the container transform
//never distorts the arrow. Black, not tinted per-folder. Returns the zones element so the pages can
//toggle pointer-events per page (on for artist, off for roster).
const REVEAL_DISTANCE = 40 //px the real cursor must travel inside before the custom one shows

export function createFloatingCursor(container) {
    //Click zones on top of the slides: left half = previous, right half = next
    let zones = document.createElement('div')
    zones.classList.add('slider-nav-zones')
    zones.style.zIndex = 100 //above the active slider-wrapper (bumped to zIndex:99 in roster's showSpecificImage) so it gets the mouse, not the swiper below
    zones.style.pointerEvents = 'none' //off by default — the artist page turns it on in setup(), roster leaves it off
    zones.innerHTML = '<div class="slider-nav-zone slider-nav-zone--prev"></div><div class="slider-nav-zone slider-nav-zone--next"></div>'
    container.append(zones)

    //Drive whichever slider is currently active (its swiper is stashed on the wrapper as ._swiper)
    let activeSwiper = () => {
        let active = container.querySelector('[data-slider-state="active"]')
        return active && active._swiper
    }

    zones.firstChild.addEventListener('click', () => { let s = activeSwiper(); if (s) s.slidePrev() })
    zones.lastChild.addEventListener('click', () => { let s = activeSwiper(); if (s) s.slideNext() })

    let cursor = document.createElement('div')
    cursor.classList.add('slider-cursor')
    cursor.style.color = '#000' //black arrow (sliders stack, no per-folder tint to read)
    cursor.innerHTML = `
        <svg class="slider-cursor-prev" width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27 0C12.0883 0 0 12.0883 0 27C0 41.9117 12.0883 54 27 54C41.9117 54 54 41.9117 54 27C54 12.0883 41.9117 0 27 0ZM26.9297 26.0352H35V28.0352H26.9297V32.8096L16.9297 27.0352L26.9297 21.2627V26.0352Z" fill="currentColor"/></svg>
        <svg class="slider-cursor-next" width="54" height="54" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27 0C41.9117 0 54 12.0883 54 27C54 41.9117 41.9117 54 27 54C12.0883 54 0 41.9117 0 27C0 12.0883 12.0883 0 27 0ZM26.0703 26.0352H18V28.0352H26.0703V32.8096L36.0703 27.0352L26.0703 21.2627V26.0352Z" fill="currentColor"/></svg>
    `
    zones.append(cursor)

    let prevIcon = cursor.querySelector('.slider-cursor-prev')
    let nextIcon = cursor.querySelector('.slider-cursor-next')
    let moveX = gsap.quickTo(cursor, 'x', { duration: 0.15, ease: 'power2.out' })
    let moveY = gsap.quickTo(cursor, 'y', { duration: 0.15, ease: 'power2.out' })

    //Don't reveal on enter (appears stuck at the edge). Wait until the real cursor has travelled
    //a bit into the zone, then snap the custom cursor onto it (no fly-in) and fade + scale it in
    let cursorRevealed = false
    let enterX = 0, enterY = 0

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

    //Pop on click — snap down, ease back
    zones.addEventListener('click', () => {
        gsap.fromTo(cursor, { scale: 0.8 }, { scale: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
    })

    return zones
}
