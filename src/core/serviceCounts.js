//Per-folder services setup, used by both the main page (pinnedFolders) and the services page.
//Call before the folder layout is torn down/moved so the dummy list is still present. Reverse count:
//Webflow can't tally how many projects list each service, so a hidden dummy list (.services-dummy-info)
//holds project -> service-name entries. Count each service-name, write the total into each folder's
//.service-count-number (matched by the folder's data-category-name), and hide the whole
//.service-content-count block for services with zero projects.
export function setupServiceFolders(container) {
    let dummy = container.querySelector('.services-dummy-info')
    if (!dummy) return

    let counts = {}
    dummy.querySelectorAll('[data-service-name]').forEach((item) => {
        let name = item.dataset.serviceName
        counts[name] = (counts[name] || 0) + 1
    })

    //Match on the folder's own data-category-name — a real Webflow attribute present from the start.
    //(The .service-content-name aria-label only exists AFTER SplitText runs in revealFolderContent)
    container.querySelectorAll('.services-sticky-container').forEach((folder) => {
        let count = counts[folder.dataset.categoryName] || 0

        let numberElement = folder.querySelector('.service-count-number')
        if (numberElement) numberElement.innerHTML = count

        //No projects for this service — hide the whole count block
        if (count === 0) {
            let countBlock = folder.querySelector('.service-content-count')
            if (countBlock) countBlock.style.display = 'none'
        }
    })
}
