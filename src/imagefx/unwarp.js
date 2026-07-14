//Reveal unwarp — images enter the viewport slightly distorted (feTurbulence + feDisplacementMap)
//and settle to normal. The filter node exists only during the burst and is removed afterwards,
//so idle cost is zero and images end up completely untouched.
//
//OFF SWITCH: set ENABLED = false. Full removal: delete this file + its import/calls in index.js.
//Per-image opt-out: class "no-unwarp".

const ENABLED = true
const DISPLACEMENT = 20      //px of warp at burst start — keep slight
const DURATION = 1
const BASE_FREQUENCY = 0.12 //turbulence coarseness — lower = broader, softer waves
const MIN_SIZE = 80          //skip icons/small graphics

let filterCounter = 0
let observer = null

function ensureObserver() {
    if (observer) return observer

    observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            observer.unobserve(entry.target)
            burst(entry.target)
        })
    }, { threshold: 0.2 })

    return observer
}

function burst(img) {
    if (img.offsetWidth < MIN_SIZE || img.offsetHeight < MIN_SIZE) return

    //Own filter instance per burst — a shared one would warp every currently-filtered image in sync.
    //Enlarged filter region so displaced pixels don't clip at the edges
    let id = `unwarp-${filterCounter++}`
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('aria-hidden', 'true')
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    svg.innerHTML = `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="${BASE_FREQUENCY}" numOctaves="2" seed="${Math.floor(Math.random() * 100)}"/>
        <feDisplacementMap in="SourceGraphic" scale="${DISPLACEMENT}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`
    document.body.appendChild(svg)

    let displacement = svg.querySelector('feDisplacementMap')
    img.style.filter = `url(#${id})`

    let state = { scale: DISPLACEMENT }
    gsap.to(state, {
        scale: 0,
        duration: DURATION,
        ease: 'power2.out',
        onUpdate: () => displacement.setAttribute('scale', state.scale),
        onComplete: () => {
            img.style.filter = '' //fully inert from here on
            svg.remove()
        }
    })
}

//Register all images under root; each bursts once when it first enters the viewport
export function unwarpImages(root = document) {
    if (!ENABLED) return

    let obs = ensureObserver()

    root.querySelectorAll('img:not(.no-unwarp)').forEach((img) => {
        if (img.dataset.unwarped) return
        img.dataset.unwarped = '1'
        obs.observe(img)
    })
}
