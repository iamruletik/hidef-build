import { gsap } from './gsap'

//Shared barba page lifecycle. gsap.context tracks any tween/ScrollTrigger/SplitText created while
//its callback (or ctx.add()) is synchronously running, and destroy() reverts all of it in one call —
//no more hand-written ScrollTrigger.getAll().filter(...) per page. Only catches what's created
//during that synchronous window though — animations built later from a click/hover handler aren't
//swept automatically (usually fine, those are short-lived and self-killing, not persistent leaks).
//addListener/addObserver/addSwiper cover the non-gsap resources context can't see at all.
export class BasePage {

    constructor(container) {
        this.container = container
        this.ctx = gsap.context(() => {}, container)
        this._listeners = []
        this._observers = []
        this._swipers = []
    }

    addListener(target, type, handler, options) {
        target.addEventListener(type, handler, options)
        this._listeners.push({ target, type, handler, options })
        return handler
    }

    addObserver(observer) {
        this._observers.push(observer)
        return observer
    }

    addSwiper(swiper) {
        this._swipers.push(swiper)
        return swiper
    }

    destroy() {
        this.ctx.revert()

        this._listeners.forEach(({ target, type, handler, options }) => target.removeEventListener(type, handler, options))
        this._observers.forEach((observer) => observer.disconnect())
        this._swipers.forEach((swiper) => { if (!swiper.destroyed) swiper.destroy() })

        this._listeners = []
        this._observers = []
        this._swipers = []
    }

}
