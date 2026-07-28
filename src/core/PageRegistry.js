//Generates barba view hooks from a page config list, so a new page can't be added without
//cleanup wiring — there's no per-page beforeLeave boilerplate left to forget it in.
//
//Each entry: { namespace, PageClass, footerColor, create, mountOn, onAfterEnter, onBeforeLeave }
//  - PageClass: instantiated as `new PageClass(data.next.container)` and `.setup()` is called
//  - create: use instead of PageClass when the constructor needs more than just the container
//    (e.g. MainPage also needs lenis) — receives (data), must return the instance and call setup() itself
//  - footerColor: footer color set on beforeEnter
//  - mountOn: 'beforeEnter' or 'afterEnter' (default) — when the instance is created/set up
//  - onAfterEnter(data, instance) / onBeforeLeave(data, instance): extra per-page hooks for anything
//    beyond the standard create+setup / destroy pattern (e.g. main's discoball integration)
//
//Returns { views, instances } — instances is a live lookup by namespace, for the rare case
//external code needs the current page instance (e.g. revealPageContent calling home.revealHeroBottom())
function setFooterColor(color) {
    document.documentElement.style.setProperty('--footer-color', color)
}

export function createViews(pages) {
    let instances = {}

    let views = pages.map((page) => {

        function mount(data) {
            if (page.create) {
                instances[page.namespace] = page.create(data)
            } else if (page.PageClass) {
                instances[page.namespace] = new page.PageClass(data.next.container)
                instances[page.namespace].setup()
            } else {
                instances[page.namespace] = null
            }
        }

        return {
            namespace: page.namespace,

            beforeEnter(data) {
                if (page.footerColor) setFooterColor(page.footerColor)
                if (page.mountOn === 'beforeEnter') mount(data)
            },

            afterEnter(data) {
                if (page.mountOn !== 'beforeEnter') mount(data)
                if (page.onAfterEnter) page.onAfterEnter(data, instances[page.namespace])
            },

            beforeLeave(data) {
                let instance = instances[page.namespace]

                //instance.destroy() (ctx.revert() etc.) visually snaps animated properties back to
                //their pre-animation state — deferred until the screen is actually hidden ('safeToDestroy',
                //dispatched once the cover/crossfade makes it safe), so the outgoing page doesn't visibly
                //reset itself before it's covered. onBeforeLeave fires immediately as before — some of it
                //(e.g. main's ball-to-header animation) is deliberately meant to be seen before the cover
                if (instance && typeof instance.destroy === 'function') {
                    document.addEventListener('safeToDestroy', () => instance.destroy(), { once: true })
                }
                if (page.onBeforeLeave) page.onBeforeLeave(data, instance)
                instances[page.namespace] = null
            }
        }
    })

    return { views, instances }
}
