import barba from '@barba/core'

if (LOCAL !== true) {

    

    //MAKE SURE THAT ONLY ONE SCRIPT WORKS BY SETTING LOCAL TO TRUE
    LOCAL = true


    barba.init({
    views: [{
        namespace: 'roster',
        beforeEnter(data) {
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
    }, {
        namespace: 'contact',
        beforeEnter(data) {
        // do something before entering the `contact` namespace
        }
    }]
    });




}