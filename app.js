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
function displayProjects(filterCategory, projects) {
  const projectContainer = $("showcase-grid");
  projectContainer.innerHTML = "";

  const filteredProjects =
    filterCategory === "All"
      ? projects
      : projects.filter(project => project.category === filterCategory);

  filteredProjects.map((project, i) => {
    const projectElement = document.createElement("a");
    projectElement.classList.add("showcase-card");
    projectElement.href = `page.html?id=${i}`;
    projectElement.innerHTML = `
            <div class="showcase-type">${project.type}</div>
            <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-6jvlWxe0HoK772ihC2MnUCrjQ8GUaa.png" alt="${project.name}" />
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
    projectContainer.appendChild(projectElement);
  });
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
  detailsContainer.innerHTML = data.about.details
    .map(
      detail => `
        <div class="detail-item">
            <span class="detail-label">${detail.label}:</span>
            <span class="detail-value">${detail.value}</span>
        </div>
    `
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
    data.showcase.sections.forEach(sect => {
      const button = document.createElement("button");
      button.classList.add("filter-btn");
      if (sect === "All") {
        button.classList.add("active");
      }
      button.innerText = sect;
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-btn")
          .forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        displayProjects(sect, data.showcase.projects);
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
