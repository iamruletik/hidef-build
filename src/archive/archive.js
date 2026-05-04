export default function archiveInit() {

let projectsArray = document.querySelectorAll('.project-content')
  let projectsData = []
  let allCategoriesData = []
  let allCategoriesDataID = []
  let allCategoriesDiv = []
  let dummyBox = document.querySelector('.projects-dummy')
  let dummyDesign = document.querySelector('#design-dummy')
  let listElement = document.querySelector('.archive-content-projects-list')
  
  //Remove Dummy Elements with Data
  dummyBox.remove()
  dummyDesign.remove()

  //Getting All Projects Data from Elements
  projectsArray.forEach((project) => {

    
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
    projectsData.push(data)

    //Collect all category names without duplicates
    allCategoriesData = [...new Set([...allCategoriesData, ...categoriesData])]
    allCategoriesDataID = [...new Set([...allCategoriesDataID, ...categoriesDataID])]
  })


  let count = 0
  //Creating Categories Headlines
  allCategoriesData.forEach((category) => {

    let categoryDiv = document.createElement("div")
    categoryDiv.classList.add("archive-content-projects-list-category")
    categoryDiv.id = allCategoriesDataID[count]

    let categoryNameDiv = document.createElement("div")
    categoryNameDiv.classList.add("archive-content-projects-list-category-name")
    categoryNameDiv.innerText = category
    categoryDiv.append(categoryNameDiv)

    let categoryContentDiv = document.createElement("div")
    categoryContentDiv.classList.add("archive-content-projects-list-content")
    categoryDiv.append(categoryContentDiv)

    listElement.append(categoryDiv)
    count++
  })


  projectsData.forEach((project) => {

    project.categoryId.forEach((item) => {

      let projectDiv = document.createElement("div")
      projectDiv.classList.add("archive-content-projects-list-item")

      projectDiv.innerHTML = `
        <a href="` + project.link + `" class="archive-content-projects-list-item-link"></a>
        <div class="archive-content-projects-list-item-top"></div>
        <div class="archive-content-projects-list-item-bottom">
          <div class="archive-content-projects-list-item-bottom-name">` + project.name +`</div>
          <div class="archive-content-projects-list-item-bottom-year">` +  project.date.slice(-4)+ `</div>
          <div class="archive-content-projects-list-item-bottom-back"></div>
          <div class="archive-content-projects-list-item-bottom-file"></div>
          <div class="archive-content-projects-list-item-bottom-file _2"></div>
        </div>
      `

      let categoryDiv = document.getElementById(item)
      let contentDiv = categoryDiv.querySelector('.archive-content-projects-list-content')

      contentDiv.append(projectDiv)
    })

  })
        
}