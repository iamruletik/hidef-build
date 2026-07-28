import { BasePage } from '../core/BasePage'

export class ArchivePage extends BasePage {

    constructor(barbaContainer) {
        super(barbaContainer)
        this.projectsArray = barbaContainer.querySelectorAll('.project-content')
        this.dummyBox = barbaContainer.querySelector('.projects-dummy')
        this.dummyDesign = barbaContainer.querySelector('#design-dummy')
        this.listElement = barbaContainer.querySelector('.archive-content-projects-list')
        this.projectsData = []
        this.allCategoriesData = []
        this.allCategoriesDataID = []
        this.allCategoriesDiv = []
    }


    setup(barbaContainer) {

        this.dummyDesign.remove()

        this.projectsArray.forEach((project) => {

            let categories = project.querySelectorAll('.project-category')
            let categoriesData = []

            categories.forEach((category) => {
                categoriesData.push(category.innerText)
            })

            let categoriesID = project.querySelectorAll('.project-category-id')
            let categoriesDataID = []

            categoriesID.forEach((id) => {
                categoriesDataID.push(id.innerText)
            })


            let data = {
                name: project.querySelector('.project-name').innerText,
                date: project.querySelector('.project-date').innerText,
                link: project.querySelector('a').href,
                category: categoriesData,
                categoryId: categoriesDataID
            }


            //Pushing Data into Array
            this.projectsData.push(data)

            //Collect all category names without duplicates
            this.allCategoriesData = [...new Set([...this.allCategoriesData, ...categoriesData])]
            this.allCategoriesDataID = [...new Set([...this.allCategoriesDataID, ...categoriesDataID])]
        })

        

        let count = 0
        //Creating Categories Headlines
        this.allCategoriesData.forEach((category) => {

            let categoryDiv = document.createElement("div")
            categoryDiv.classList.add("archive-content-projects-list-category")
            categoryDiv.id = this.allCategoriesDataID[count]

            let categoryNameDiv = document.createElement("div")
            categoryNameDiv.classList.add("archive-content-projects-list-category-name")
            categoryNameDiv.innerText = category
            categoryDiv.append(categoryNameDiv)

            let categoryContentDiv = document.createElement("div")
            categoryContentDiv.classList.add("archive-content-projects-list-content")
            categoryDiv.append(categoryContentDiv)

            this.listElement.append(categoryDiv)
            count++
        })

        

        this.projectsData.forEach((project) => {

            project.categoryId.forEach((item) => {


                let projectDiv = document.createElement("div")
                projectDiv.classList.add("archive-content-projects-list-item")

                projectDiv.innerHTML = `
                                        <a href="` + project.link + `" class="archive-content-projects-list-item-link"></a>
                                        <div class="archive-content-projects-list-item-top"></div>
                                        <div class="archive-content-projects-list-item-bottom">
                                        <div class="archive-content-projects-list-item-bottom-name">` + project.name + `</div>
                                        <div class="archive-content-projects-list-item-bottom-year">` + project.date.slice(-4) + `</div>
                                        <div class="archive-content-projects-list-item-bottom-back"></div>
                                        <div class="archive-content-projects-list-item-bottom-file"></div>
                                        <div class="archive-content-projects-list-item-bottom-file _2"></div>
                                        </div>
                                    `

                let categoryDiv = this.listElement.querySelector(`[id="${item}"]`)
                let contentDiv = categoryDiv.querySelector('.archive-content-projects-list-content')

                contentDiv.append(projectDiv)
            })

        })


    }


}