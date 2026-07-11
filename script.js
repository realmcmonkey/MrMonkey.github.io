const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const setText = (selector, value) => {
  const element = $(selector);
  if (element) element.textContent = value;
};

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const externalTarget = (link) => {
  if (!link || link === "#") return {};
  return /^https?:\/\//.test(link) ? { target: "_blank", rel: "noreferrer" } : {};
};

const setLinkTarget = (anchor, href) => {
  if (!anchor) return;
  anchor.href = href || "#";
  const target = externalTarget(anchor.getAttribute("href"));
  Object.entries(target).forEach(([key, value]) => anchor.setAttribute(key, value));
};

const renderProjects = (category = "All") => {
  const container = $("[data-projects]");
  if (!container) return;
  const limit = Number(container.dataset.projectLimit || 0);
  const projects = siteData.projects.filter(
    (project) => category === "All" || project.category === category,
  ).slice(0, limit || undefined);
  container.innerHTML = "";

  projects.forEach((project) => {
    const card = createElement("article", "project-card");
    const image = createElement("img");
    image.src = project.image;
    image.alt = `${project.title} preview`;
    image.loading = "lazy";

    const body = createElement("div", "card-body");
    const meta = createElement("p", "card-meta", `${project.category} | ${project.year}`);
    const title = createElement("h3", "", project.title);
    const description = createElement("p", "", project.description);
    const link = createElement("a", "text-link", "View project");
    setLinkTarget(link, project.link);

    body.append(meta, title, description, link);
    card.append(image, body);
    container.append(card);
  });
};

const renderFilters = () => {
  const filters = $("[data-project-filters]");
  if (!filters) return;
  const heading = $("[data-project-heading]");
  const headings = {
    All: "Creations",
    Creations: "Maps and Games",
    "Skin Packs": "Skin Packs",
  };
  const categories = ["All", ...new Set(siteData.projects.map((project) => project.category))];
  filters.innerHTML = "";
  if (heading) heading.textContent = headings.All;

  categories.forEach((category, index) => {
    const button = createElement("button", "filter-button", category);
    button.type = "button";
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.addEventListener("click", () => {
      $$(".filter-button").forEach((filter) => filter.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      if (heading) heading.textContent = headings[category] || category;
      renderProjects(category);
    });
    filters.append(button);
  });
};

const renderVideos = () => {
  const container = $("[data-videos]");
  if (!container) return;
  container.innerHTML = "";

  siteData.videos.forEach((video) => {
    const card = createElement("article", "video-card");
    if (video.embedUrl || video.videoId) {
      const frame = createElement("iframe");
      frame.src = video.embedUrl || `https://www.youtube-nocookie.com/embed/${video.videoId}`;
      frame.title = video.title;
      frame.loading = "lazy";
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      card.append(frame);
    } else {
      const placeholder = createElement("a", "video-placeholder");
      setLinkTarget(placeholder, video.url || siteData.youtubeChannel);
      placeholder.setAttribute("aria-label", `Visit channel for ${video.title}`);
      placeholder.innerHTML = video.embedUrl
        ? '<span class="play-badge">></span><span>Watch on YouTube</span>'
        : '<span class="play-badge">></span><span>Video link needed</span>';
      card.append(placeholder);
    }

    const body = createElement("div", "card-body");
    const action = createElement("a", "text-link", "Visit channel");
    setLinkTarget(action, video.url || siteData.youtubeChannel);
    body.append(createElement("h3", "", video.title), createElement("p", "", video.description), action);
    card.append(body);
    container.append(card);
  });
};

const renderUpdates = () => {
  const container = $("[data-updates]");
  if (!container) return;
  container.innerHTML = "";

  siteData.updates.forEach((update) => {
    const item = createElement("article", "timeline-item");
    item.append(
      createElement("time", "", new Date(`${update.date}T00:00:00`).toLocaleDateString()),
      createElement("h3", "", update.title),
      createElement("p", "", update.text),
    );
    container.append(item);
  });
};

const renderSkills = () => {
  const container = $("[data-skills]");
  if (!container) return;
  container.innerHTML = "";
  siteData.skills.forEach((skill) => container.append(createElement("span", "tag", skill)));
};

const renderContactLinks = () => {
  const container = $("[data-contact-links]");
  if (!container) return;
  container.innerHTML = "";
  siteData.contactLinks.forEach((item) => {
    const link = createElement("a", "contact-link", item.label);
    setLinkTarget(link, item.url);
    container.append(link);
  });
};

const renderSocialLinks = () => {
  const container = $("[data-social-links]");
  if (!container) return;
  container.innerHTML = "";
  siteData.contactLinks.forEach((item) => {
    const link = createElement("a", "social-link");
    link.setAttribute("aria-label", item.label);
    setLinkTarget(link, item.url);
    if (item.icon) {
      const icon = createElement("img");
      icon.src = item.icon;
      icon.alt = "";
      icon.loading = "lazy";
      link.append(icon);
    } else {
      link.textContent = item.label.slice(0, 2);
    }
    container.append(link);
  });
};

const hydrateSite = () => {
  if (document.title === "Mr. Monkey") {
    document.title = siteData.name;
  }
  setText("[data-site-name]", siteData.brandName || siteData.name);
  setText("[data-brand-initials]", siteData.initials);
  setText("[data-role]", siteData.role);
  setText("[data-hero-title]", siteData.heroTitle);
  setText("[data-hero-text]", siteData.heroText);
  setText("[data-about-title]", siteData.aboutTitle);
  setText("[data-about-text]", siteData.aboutText);
  setText("[data-contact-copy]", siteData.contactCopy);
  setText("[data-footer-name]", siteData.name);
  setText("[data-project-count]", siteData.projects.length);
  setText("[data-video-count]", siteData.videos.length);
  setText("[data-update-count]", siteData.updates.length);

  const channelLink = $("[data-youtube-channel]");
  setLinkTarget(channelLink, siteData.youtubeChannel);

  renderFilters();
  renderProjects();
  renderVideos();
  renderUpdates();
  renderSkills();
  renderContactLinks();
  renderSocialLinks();
};

const setupNavigation = () => {
  const toggle = $(".nav-toggle");
  const nav = $(".site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
};

const markActivePage = () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const isCreationDetail = window.location.pathname.includes("/pages/creations/");
  $$(".site-nav a").forEach((link) => {
    const linkPage = link.getAttribute("href");
    if (linkPage === currentPage || (isCreationDetail && linkPage.includes("creations.html"))) {
      link.setAttribute("aria-current", "page");
    }
  });
};

hydrateSite();
setupNavigation();
markActivePage();
