console.log("LOCAL DEVELOPMENT")

//Image fetch for the artist

let rosterItems = document.querySelectorAll('.roster-list-table-content-item')
let rosterFloatingImage = document.querySelector('.roster-floating-image')

rosterItems.forEach((artist) => {

    console.log(rosterItems)

let artistCurrentImage = artist.querySelector('.roster-list-table-content-item-image')

artist.addEventListener('mouseenter', (e) => {
    rosterFloatingImage.style.opacity = 1
    rosterFloatingImage.src = artistCurrentImage.src
}, true)

})
