export class ProjectPage {

  constructor(barbaContainer) {
    this.container = barbaContainer
    this.progressBarElement = this.container.querySelector('.project-progress-bar')
    this.progressBarNumber = this.container.querySelector('.project-progress-bar-number')
    this.projectSummaryTeamContainer = this.container.querySelector('.project-summary-team')
    this.progressBar = this.container.querySelector('.project-progress-wrapper')
    this.projectWrapper = this.container.querySelector('.project-wrapper')
    this.selector = '.project-image-content-grid-item-container'
    this.observer = null
  }

  setup() {

    document.addEventListener("scroll", (event) => {

      let progress = gsap.utils.mapRange(window.innerHeight, this.projectWrapper.scrollHeight - window.innerHeight, 100, 0, window.scrollY + window.innerHeight)

      this.progressBarElement.style.transform = "translate(-" + progress + "%)"

      let percent = Math.abs(Math.round(progress - 100))
      if (percent <= 100) { this.progressBarNumber.innerText = percent + "%" }

    })

    this.restyleCredits(this.projectSummaryTeamContainer)

    this.runAltTextLogic()

    // 2. Watch for missing images to drop in dynamically
    this.observer = new MutationObserver(() => {
      this.runAltTextLogic()
    })

    this.observer.observe(this.container, {
      childList: true,
      subtree: true
    })

  }

  restyleCredits(richtextSelector) {

    //console.log(richtextSelector)


    const richTextContainer = richtextSelector.querySelector('.w-richtext');
    if (!richTextContainer) return;

    richTextContainer.classList.remove('w-richtext')

    const paragraphs = richTextContainer.querySelectorAll('p');
    const creditsData = [];

    paragraphs.forEach(p => {
      const rawHTML = p.innerHTML.trim();

      // Skip empty paragraphs or trailing spacer nodes
      if (!rawHTML || rawHTML === '&zwj;' || rawHTML === '<br>') return;

      // Split at the first colon to extract the Category
      const colonIndex = rawHTML.indexOf(':');
      if (colonIndex === -1) return;

      const category = rawHTML.substring(0, colonIndex).replace(/&amp;/g, '&').trim();
      const handlesHTML = rawHTML.substring(colonIndex + 1).trim();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = handlesHTML;

      const handlesArray = [];

      // Loop through text nodes and link elements chronologically
      tempDiv.childNodes.forEach(node => {

        // CONDITION 1: It's an explicit link element from Webflow
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
          const text = node.textContent.trim().replace(/,$/, '').trim();
          if (text) {
            handlesArray.push({
              text: text,
              url: node.getAttribute('href'),
              isLink: true
            });
          }
        }

        // CONDITION 2: It's raw plain text string
        else if (node.nodeType === Node.TEXT_NODE) {
          // Split elements separated by commas or structural spaces
          const rawTokens = node.textContent.split(/[\s,]+/);
          rawTokens.forEach(token => {
            const cleanToken = token.trim();
            // Keep it only if it's a valid handle token
            if (cleanToken && cleanToken.startsWith('@')) {
              handlesArray.push({
                text: cleanToken,
                url: null,
                isLink: false
              });
            }
          });
        }
      });

      if (handlesArray.length > 0) {
        creditsData.push({ category, handles: handlesArray });
      }
    });

    // Clear old Webflow content
    richTextContainer.innerHTML = '';

    // Rebuild the DOM using semantic elements
    creditsData.forEach(item => {
      const row = document.createElement('div');
      row.classList.add('credits-row');

      const catEl = document.createElement('div');
      catEl.classList.add('credits-category');
      catEl.textContent = item.category;
      row.appendChild(catEl);

      const handlesGroup = document.createElement('div');
      handlesGroup.classList.add('credits-handles-group');

      item.handles.forEach(handle => {
        let handleElement;

        if (handle.isLink) {
          // Render true HTML link nodes for active anchors
          handleElement = document.createElement('a');
          handleElement.setAttribute('href', handle.url);
          handleElement.setAttribute('target', '_blank');
          handleElement.classList.add('credit-handle-link');
        } else {
          // Render flat span nodes for unclickable text
          handleElement = document.createElement('span');
          handleElement.classList.add('credit-handle-text');
        }

        handleElement.textContent = handle.text;
        handlesGroup.appendChild(handleElement);
      });

      row.appendChild(handlesGroup);
      richTextContainer.appendChild(row);
    });
  }

  runAltTextLogic() {
    const containers = this.container.querySelectorAll(this.selector)
    console.log('Mutated')

    containers.forEach((item) => {
      let image = item.querySelector('img')
      let altContainer = item.querySelector('.project-image-content-grid-item-alt')
      if (!image || !altContainer) return

      let alt = altContainer.querySelector('div')
      if (!alt) return

      // Only run if we haven't processed this item yet
      if (image.alt && image.alt.trim().length > 0 && !item.dataset.altProcessed) {
        altContainer.classList.remove('w-condition-invisible')
        alt.innerHTML = image.alt
        item.dataset.altProcessed = "true" // Mark as done
      }
    })

    // Stop observing once all 16 expected images are loaded and processed
    if (containers.length >= 16 && this.observer) {
      this.observer.disconnect()
    }
  }

  // Mandatory for Barba: Call this to prevent memory leaks when leaving the page
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }

}



