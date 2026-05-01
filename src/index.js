console.log("LOCAL DEVELOPMENT")

if (LOCAL !== true) {
    console.log("LOCAL NOT DETECTED")

    LOCAL = true

    //Image fetch for the artist

    let rosterItems = document.querySelectorAll('.roster-list-table-content-item')
    let rosterFloatingImage = document.querySelector('.roster-floating-image')

    console.log(rosterItems)

    rosterItems.forEach((artist) => {

    let artistCurrentImage = artist.querySelector('.roster-list-table-content-item-image')

    artist.addEventListener('mouseenter', (e) => {
        rosterFloatingImage.style.opacity = 1
        rosterFloatingImage.src = artistCurrentImage.src
    }, true)

    })

}