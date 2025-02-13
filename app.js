// Utility Functions
function $(q) {
  return document.getElementById(q);
}

// Navigation function
function navs() {
  const links = document.getElementsByClassName("nav-link");
  const sections = document.querySelectorAll("section");

  // Handle click events
  for (let i = 0; i < links.length; i++) {
    const a = links[i];
    a.addEventListener("click", () => {
      for (let j = 0; j < links.length; j++) {
        links[j].classList.remove("active");
      }
      a.classList.add("active");
    });
  }

  // Handle scroll events
  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - sectionHeight / 3) {
        current = section.getAttribute("id");
      }
    });

    for (let i = 0; i < links.length; i++) {
      links[i].classList.remove("active");
      if (links[i].getAttribute("href") === `#${current}`) {
        links[i].classList.add("active");
      }
    }
  });
}

// Showcase functionality
function displayProjects(filterType, projects) {
  const trackContainer = document.querySelector(".showcase-track");
  trackContainer.innerHTML = "";

  const filteredProjects =
    filterType === "All"
      ? projects
      : projects.filter(project => project.type === filterType);

  filteredProjects.forEach((project, i) => {
    const projectElement = document.createElement("a");
    projectElement.classList.add("showcase-card");
    projectElement.href = `page.html?id=${i}`;
    projectElement.innerHTML = `
            <div class="showcase-type">${project.type}</div>
            <img src="${project.image}" alt="${project.name}" />
            <div class="showcase-content">
                <h3 class="showcase-title">${project.name}</h3>
                <p class="showcase-description">${project.description}</p>
                <div id="tags-container-${project.name}" class="showcase-tags">
                    ${project.tags
                      .map(tag => `<span class="showcase-tag">${tag}</span>`)
                      .join("")}
                </div>
            </div>
        `;
    trackContainer.appendChild(projectElement);
  });

  initializeSlider();
}

function initializeSlider() {
  const track = document.querySelector('.showcase-track');
  const prevBtn = document.querySelector('.slider-nav.prev');
  const nextBtn = document.querySelector('.slider-nav.next');
  const cardWidth = 320; // card width + gap
  let currentPosition = 0;

  function updateNavButtons() {
    // Hide prev button if at start
    prevBtn.style.display = currentPosition <= 0 ? 'none' : 'flex';
    
    // Hide next button if at end
    const maxScroll = track.scrollWidth - track.parentElement.clientWidth;
    nextBtn.style.display = currentPosition >= maxScroll ? 'none' : 'flex';
  }

  function updateSlider(direction) {
    const maxScroll = track.scrollWidth - track.parentElement.clientWidth;
    currentPosition = Math.max(Math.min(
      currentPosition + (direction * cardWidth),
      maxScroll
    ), 0);
    
    track.style.transform = `translateX(-${currentPosition}px)`;
    updateNavButtons();
  }

  prevBtn?.addEventListener('click', () => updateSlider(-1));
  nextBtn?.addEventListener('click', () => updateSlider(1));

  // Initial button state
  updateNavButtons();
}

async function loadData() {
  const response = await fetch("data.json");
  const data = await response.json();

  // Populate hero section
  document.querySelector(".name").textContent = data.hero.name;
  document.querySelector(".description").textContent = data.hero.description;
  document.querySelector(".right-content img").src = data.hero.profileImage;

  // Populate about section
  document.querySelector(".about-text p").textContent = data.about.description;
  const detailsContainer = document.querySelector(".about-details");
  
  // Sort details by size - small items first, then large items
  const sortedDetails = data.about.details.sort((a, b) => {
    const aIsLarge = a.value.length > 30;
    const bIsLarge = b.value.length > 30;
    return aIsLarge - bIsLarge;
  });

  detailsContainer.innerHTML = sortedDetails
    .map(
      detail => {
        const isLarge = detail.value.length > 30;
        return `
          <div class="detail-item" ${isLarge ? 'data-size="large"' : ''}>
              <ion-icon name="${detail.icon}" class="detail-icon"></ion-icon>
              <div class="detail-content">
                  <span class="detail-label">${detail.label}</span>
                  <span class="detail-value">${detail.value}</span>
              </div>
          </div>
        `;
      }
    )
    .join("");

  // Populate skills section
  const skillsGrid = document.querySelector(".skills-grid");
  skillsGrid.innerHTML = data.skills
    .map(
      skill => `
        <div class="skill-card">
            <ion-icon name="${skill.icon}" class="skill-icon"></ion-icon>
            <h3 class="skill-title">${skill.title}</h3>
            <ul class="skill-description">
                ${skill.points.map(point => `<li>${point}</li>`).join("")}
            </ul>
        </div>
    `
    )
    .join("");

  // Populate work section
  const workGrid = document.querySelector(".work-grid");
  workGrid.innerHTML = data.work
    .map(
      work => `
        <div class="work-item">
            <div class="work-image">
                <img src="${work.image}" alt="${work.title}" />
            </div>
            <div class="work-content">
                ${work.current
                  ? '<span class="work-label">Currently working at</span>'
                  : ""}
                <h3 class="work-title">${work.title}</h3>
                <p class="work-duration">${work.duration}</p>
                <p class="work-description">${work.description}</p>
            </div>
        </div>
    `
    )
    .join("");

  // Populate social links
  const socialContainer = document.querySelector(".social-container");
  socialContainer.innerHTML = data.social
    .map(
      social => `
        <a href="${social.url}"><ion-icon name="${social.icon}"></ion-icon>${social.name}</a>
    `
    )
    .join("");

  // Initialize showcase with data from JSON
  const container = $("filter-buttons-container");
  if (container) {
    // Get unique project types
    const projectTypes = ["All", ...new Set(data.showcase.projects.map(p => p.type))];
    
    projectTypes.forEach(type => {
      const button = document.createElement("button");
      button.classList.add("filter-btn");
      if (type === "All") {
        button.classList.add("active");
      }
      button.innerText = type;
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        
        // Reset track position before showing new filtered items
        const track = document.querySelector('.showcase-track');
        track.style.transform = 'translateX(0)';
        
        displayProjects(type, data.showcase.projects);
      });
      container.appendChild(button);
    });

    displayProjects("All", data.showcase.projects);
  }
}

// Load data when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadData();
  navs();
});
