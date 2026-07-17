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

const siteRootUrl = new URL("../../", document.currentScript.src);

const resolveLocalUrl = (href) => {
  if (window.location.protocol !== "file:" || !href || !href.startsWith("/")) return href;
  const cleanPath = href.split("#")[0].split("?")[0];
  const suffix = cleanPath === "/" ? "index.html" : `${cleanPath.replace(/^\/+/, "")}${cleanPath.endsWith("/") ? "index.html" : ""}`;
  const hash = href.includes("#") ? `#${href.split("#").slice(1).join("#")}` : "";
  return new URL(suffix, siteRootUrl).href + hash;
};

const setLinkTarget = (anchor, href) => {
  if (!anchor) return;
  anchor.href = resolveLocalUrl(href || "#");
  const target = externalTarget(anchor.getAttribute("href"));
  Object.entries(target).forEach(([key, value]) => anchor.setAttribute(key, value));
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const navTransitionKey = "mr-monkey-page-transition";
let pageTransitionActive = false;
let currentProjectCategory = "All";
let currentProjectSort = "created";
let projectProgressHasAnimated = false;

const projectFilterParam = {
  All: "all",
  Creations: "creations",
  "Skin Packs": "skin-packs",
};

const projectCategoryFromParam = (value) => (
  Object.entries(projectFilterParam).find(([, slug]) => slug === value)?.[0] || "All"
);

const readProjectControls = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    category: projectCategoryFromParam(params.get("filter")),
    sort: ["created", "updated"].includes(params.get("sort")) ? params.get("sort") : "created",
  };
};

const writeProjectControls = (mode = "push") => {
  const url = new URL(window.location.href);
  if (currentProjectCategory === "All") {
    url.searchParams.delete("filter");
  } else {
    url.searchParams.set("filter", projectFilterParam[currentProjectCategory] || "all");
  }

  if (currentProjectSort === "created") {
    url.searchParams.delete("sort");
  } else {
    url.searchParams.set("sort", currentProjectSort);
  }

  const nextUrl = url.href;
  if (mode === "replace") {
    window.history.replaceState({}, "", nextUrl);
  } else {
    window.history.pushState({}, "", nextUrl);
  }
};

const readTransitionMarker = () => {
  try {
    const value = sessionStorage.getItem(navTransitionKey);
    sessionStorage.removeItem(navTransitionKey);
    return value;
  } catch (error) {
    return "";
  }
};

const writeTransitionMarker = () => {
  try {
    sessionStorage.setItem(navTransitionKey, String(Date.now()));
  } catch (error) {
    return false;
  }
  return true;
};

const currentNavigationType = () => {
  const navigation = performance.getEntriesByType("navigation")[0];
  return navigation ? navigation.type : "";
};

const isSamePageAnchor = (url) => (
  url.pathname === window.location.pathname
  && url.search === window.location.search
  && url.hash
);

const isEligibleInternalLink = (link, event) => {
  if (!link || event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.hasAttribute("download")) return false;
  if (link.getAttribute("aria-disabled") === "true") return false;
  if (link.classList.contains("disabled-button")) return false;

  const rawHref = link.getAttribute("href");
  if (!rawHref || rawHref.startsWith("#")) return false;
  if (/^(mailto|tel|javascript):/i.test(rawHref)) return false;

  const target = (link.getAttribute("target") || "").toLowerCase();
  if (target && target !== "_self") return false;

  let url;
  try {
    url = new URL(link.href, window.location.href);
  } catch (error) {
    return false;
  }

  if (url.protocol !== window.location.protocol) return false;
  if (window.location.protocol === "file:") {
    if (!url.pathname.startsWith(siteRootUrl.pathname.replace(/\/$/, ""))) return false;
  } else if (url.origin !== window.location.origin) {
    return false;
  }

  if (isSamePageAnchor(url)) return false;
  if (url.href === window.location.href) return false;
  return true;
};

const applyArrivalTransition = () => {
  const stored = readTransitionMarker();

  if (prefersReducedMotion()) return;

  const type = currentNavigationType();
  const now = Date.now();
  const internalClick = stored && now - Number(stored) < 5000;
  const className = internalClick ? "page-enter" : type === "back_forward" ? "nav-pop" : "";
  if (!className) return;

  document.body.classList.add(className);
  window.setTimeout(() => document.body.classList.remove(className), internalClick ? 520 : 220);
};

const setupPageTransitions = () => {
  applyArrivalTransition();

  window.addEventListener("pageshow", (event) => {
    document.body.classList.remove("is-leaving");
    pageTransitionActive = false;
    if (event.persisted && !prefersReducedMotion()) {
      document.body.classList.add("nav-pop");
      window.setTimeout(() => document.body.classList.remove("nav-pop"), 220);
    }
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest("a[href]");
    if (!isEligibleInternalLink(link, event)) return;

    event.preventDefault();
    if (pageTransitionActive) return;
    pageTransitionActive = true;

    const destination = link.href;
    writeTransitionMarker();

    const navigate = () => {
      window.location.assign(destination);
      window.setTimeout(() => {
        document.body.classList.remove("is-leaving");
        pageTransitionActive = false;
      }, 1200);
    };

    if (prefersReducedMotion()) {
      navigate();
      return;
    }

    const startLeaving = () => document.body.classList.add("is-leaving");

    if (document.startViewTransition) {
      const transition = document.startViewTransition(startLeaving);
      transition.ready.finally(() => window.setTimeout(navigate, 90));
    } else {
      startLeaving();
      window.setTimeout(navigate, 170);
    }
  });
};

const getProjectSortValue = (project, sortMode) => {
  if (sortMode === "updated") {
    return Number(project.lastUpdatedYear || project.createdYear || project.year || 0);
  }
  return Number(project.createdYear || project.year || 0);
};

const sortProjects = (projects, sortMode) => [...projects].sort((first, second) => {
  if (first.isComingSoon && !second.isComingSoon) return -1;
  if (!first.isComingSoon && second.isComingSoon) return 1;
  const dateDifference = getProjectSortValue(second, sortMode) - getProjectSortValue(first, sortMode);
  if (dateDifference) return dateDifference;
  return first.title.localeCompare(second.title);
});

const renderProjects = (category = currentProjectCategory, sortMode = currentProjectSort) => {
  const container = $("[data-projects]");
  if (!container) return;
  const limit = Number(container.dataset.projectLimit || 0);
  const isCompact = container.classList.contains("compact-creations");
  const projects = sortProjects(siteData.projects.filter(
    (project) => category === "All" || project.category === category,
  ), sortMode).slice(0, limit || undefined);
  container.innerHTML = "";

  projects.forEach((project) => {
    const card = createElement("article", "project-card");
    if (project.status) card.dataset.status = project.status;
    if (project.isComingSoon) card.dataset.upcoming = "true";

    const media = createElement("div", "project-media");

    if (project.image) {
      const image = createElement("img");
      image.src = project.image;
      image.alt = `${project.title} preview`;
      media.style.setProperty("--project-image", `url("${project.image}")`);
      media.append(image);
    } else {
      const teaser = createElement("div", "project-teaser");
      teaser.innerHTML = "<span>Coming Soon</span>";
      media.append(teaser);
    }

    if (project.isComingSoon) {
      media.append(createElement("span", "project-media-badge", "Coming Soon"));
    }

    card.append(media);

    const body = createElement("div", "card-body");
    const dateMeta = project.isComingSoon
      ? "Coming Soon"
      : `Created ${project.year}`;
    const updatedMeta = project.lastUpdatedYear ? ` | Updated ${project.lastUpdatedYear}` : "";
    const meta = createElement("p", "card-meta", `${project.category} | ${dateMeta}${updatedMeta}`);
    const title = createElement("h3", "", project.title);
    const description = createElement("p", "", project.description);
    const progress = project.progress
      ? createElement(
          "div",
          "progress-block compact-progress",
          "",
        )
      : null;
    if (progress) {
      const label = createElement(
        "span",
        "progress-label",
        isCompact ? `${project.progress}% Complete` : `Progress: ${project.progress}%`,
      );
      const track = createElement("span", "progress-track");
      const fill = createElement("span", "progress-fill");
      if (projectProgressHasAnimated) {
        fill.classList.add("no-animate");
      }
      fill.style.setProperty("--progress", `${project.progress}%`);
      track.append(fill);
      progress.append(label, track);
    }
    const link = createElement("a", "text-link", project.status ? "Coming soon" : "View project");
    if (project.status) {
      link.href = "#";
      link.setAttribute("aria-disabled", "true");
    } else {
      setLinkTarget(link, project.link);
    }

    body.append(meta, title, description);
    if (progress) body.append(progress);
    body.append(link);
    card.append(body);
    container.append(card);
  });
  projectProgressHasAnimated = true;
};

const renderFilters = () => {
  const filters = $("[data-project-filters]");
  if (!filters) return;
  const heading = $("[data-project-heading]");
  const sortControl = $("[data-project-sort]");
  const headings = {
    All: "Creations",
    Creations: "Maps and Games",
    "Skin Packs": "Skin Packs",
  };
  const categories = ["All", ...new Set(siteData.projects.map((project) => project.category))];
  const savedControls = readProjectControls();
  if (categories.includes(savedControls.category)) {
    currentProjectCategory = savedControls.category;
  }
  if (["created", "updated"].includes(savedControls.sort)) {
    currentProjectSort = savedControls.sort;
  }
  filters.innerHTML = "";
  if (heading) heading.textContent = headings[currentProjectCategory] || currentProjectCategory;

  categories.forEach((category) => {
    const button = createElement("button", "filter-button", category);
    button.type = "button";
    button.setAttribute("aria-pressed", category === currentProjectCategory ? "true" : "false");
    button.addEventListener("click", () => {
      if (currentProjectCategory === category) return;
      currentProjectCategory = category;
      writeProjectControls();
      $$(".filter-button").forEach((filter) => filter.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
      if (heading) heading.textContent = headings[category] || category;
      renderProjects(currentProjectCategory, currentProjectSort);
    });
    filters.append(button);
  });

  if (sortControl) {
    sortControl.value = currentProjectSort;
    sortControl.onchange = () => {
      if (currentProjectSort === sortControl.value) return;
      currentProjectSort = sortControl.value;
      writeProjectControls();
      renderProjects(currentProjectCategory, currentProjectSort);
    };
  }
};

const setupProjectUrlControls = () => {
  if (!$("[data-projects]") || !$("[data-project-filters]")) return;

  window.addEventListener("popstate", () => {
    renderFilters();
    renderProjects(currentProjectCategory, currentProjectSort);
  });
};

const renderVideos = () => {
  const container = $("[data-videos]");
  if (!container) return;
  container.innerHTML = "";
  container.classList.toggle("single-video", siteData.videos.length === 1);

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

const renderPlaylists = () => {
  const container = $("[data-playlists]");
  if (!container) return;
  const playlists = siteData.playlists || [];
  container.innerHTML = "";

  if (!playlists.length) {
    const empty = createElement("p", "playlist-empty", "Playlist links coming soon.");
    container.append(empty);
    return;
  }

  playlists.forEach((playlist) => {
    const card = createElement("article", "playlist-card");
    const thumbLink = createElement("a", "playlist-thumb");
    setLinkTarget(thumbLink, playlist.url);
    thumbLink.setAttribute("aria-label", `View ${playlist.title} playlist`);

    if (playlist.thumbnail) {
      const image = createElement("img");
      image.src = playlist.thumbnail;
      image.alt = `${playlist.title} playlist thumbnail`;
      thumbLink.append(image);
    } else {
      const fallback = createElement("span", "playlist-thumb-fallback", playlist.title);
      thumbLink.append(fallback);
    }
    const play = createElement("span", "playlist-play");
    play.setAttribute("aria-hidden", "true");
    thumbLink.append(play);

    const body = createElement("div", "playlist-body");
    const title = createElement("h3", "", playlist.title);
    const description = createElement("p", "", playlist.description);
    const action = createElement("a", "button secondary", "View Playlist");
    setLinkTarget(action, playlist.url);
    body.append(title, description, action);

    card.append(thumbLink, body);
    container.append(card);
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
    const link = createElement("a", "contact-link");
    link.setAttribute("aria-label", item.label);
    setLinkTarget(link, item.url);
    if (item.icon) {
      const icon = createElement("img");
      icon.src = item.icon;
      icon.alt = "";
      link.append(icon);
    } else {
      link.textContent = item.label.slice(0, 2);
    }
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

const renderFooterSocials = () => {
  const containers = $$("[data-footer-socials]");
  if (!containers.length) return;
  containers.forEach((container) => {
    container.innerHTML = "";
    siteData.contactLinks.forEach((item) => {
      const link = createElement("a", "footer-social");
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
  });
};

const setupContactForm = () => {
  const form = $("[data-contact-form]");
  if (!form) return;

  const endpoint = form.dataset.contactEndpoint;
  const status = form.querySelector("[data-contact-status]");
  const submit = form.querySelector("[data-contact-submit]");
  const defaultSubmitText = submit ? submit.textContent : "";
  const draftKey = "mr-monkey-contact-draft";
  const draftFields = ["name", "email", "topic", "message"];
  let messageSent = false;
  let captchaComplete = false;

  const setStatus = (message, type = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.type = type;
  };

  const readResponseMessage = async (response) => {
    const fallback = `Formspree returned error ${response.status}. Please try again.`;
    const contentType = response.headers.get("content-type") || "";

    try {
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (Array.isArray(data.errors) && data.errors.length) {
          return data.errors
            .map((error) => error.message || error.code || error.field)
            .filter(Boolean)
            .join(" ");
        }
        return data.error || data.message || fallback;
      }

      const text = await response.text();
      if (!text) return fallback;
      return text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220) || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const showThankYou = () => {
    form.innerHTML = `
      <div class="form-thank-you" tabindex="-1">
        <p class="eyebrow">Message Sent</p>
        <h2>Thanks for reaching out.</h2>
        <p>Your message was sent to Mr. Monkey. I will check it soon.</p>
      </div>
    `;
    const message = form.querySelector(".form-thank-you");
    if (message) message.focus();
  };

  const readDraft = () => {
    try {
      return JSON.parse(sessionStorage.getItem(draftKey) || "{}");
    } catch (error) {
      return {};
    }
  };

  const writeDraft = () => {
    const draft = {};
    draftFields.forEach((name) => {
      const field = form.elements[name];
      if (field && field.value) draft[name] = field.value;
    });
    try {
      if (Object.keys(draft).length) {
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(draftKey);
      }
    } catch (error) {
      // Draft saving is helpful, but the form still works if storage is unavailable.
    }
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch (error) {
      // Nothing to clear if storage is unavailable.
    }
  };

  const hasFormData = () => draftFields.some((name) => {
    const field = form.elements[name];
    return field && field.value.trim();
  });

  const restoreDraft = () => {
    const draft = readDraft();
    const hasDraft = Object.keys(draft).length > 0;
    if (!hasDraft) return;

    draftFields.forEach((name) => {
      const field = form.elements[name];
      if (field && draft[name]) field.value = draft[name];
    });

    setStatus(
      currentNavigationType() === "reload" ? "Draft restored after refresh." : "Draft restored.",
      "pending",
    );
  };

  window.contactCaptchaComplete = () => {
    captchaComplete = true;
    if (status && status.dataset.type === "error") {
      setStatus("", "");
    }
  };

  window.contactCaptchaExpired = () => {
    captchaComplete = false;
  };

  restoreDraft();

  draftFields.forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener("input", () => {
      messageSent = false;
      writeDraft();
    });
    field.addEventListener("change", () => {
      messageSent = false;
      writeDraft();
    });
  });

  window.addEventListener("beforeunload", (event) => {
    if (messageSent || !hasFormData()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  const sendForm = async () => {
    if (!endpoint) {
      setStatus("The contact form endpoint is missing.", "error");
      return;
    }

    if (!form.reportValidity()) {
      setStatus("Please fill out the required fields before sending.", "error");
      return;
    }

    const captchaResponse = form.querySelector("[name='g-recaptcha-response']");
    const hasCaptcha = captchaComplete || (captchaResponse && captchaResponse.value);
    if (!hasCaptcha) {
      setStatus("Please complete the reCAPTCHA checkbox before sending.", "error");
      return;
    }

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Sending...";
    }
    setStatus("Sending your message...", "pending");

    try {
      const formData = new FormData(form);
      const email = form.elements.email ? form.elements.email.value : "";
      if (email && !formData.has("_replyto")) {
        formData.append("_replyto", email);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        messageSent = true;
        clearDraft();
        showThankYou();
        return;
      }

      setStatus(await readResponseMessage(response), "error");
      if (window.grecaptcha) {
        window.grecaptcha.reset();
        captchaComplete = false;
      }
    } catch (error) {
      setStatus("Message could not be sent right now. Please try again in a moment.", "error");
    } finally {
      if (submit && !messageSent) {
        submit.disabled = false;
        submit.textContent = defaultSubmitText;
      }
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendForm();
  });

  if (submit) {
    submit.addEventListener("click", sendForm);
  }
};

const rewriteStaticInternalLinks = () => {
  if (window.location.protocol !== "file:") return;
  $$("a[href^='/']").forEach((link) => {
    link.href = resolveLocalUrl(link.getAttribute("href"));
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

  const channelLink = $("[data-youtube-channel]");
  setLinkTarget(channelLink, siteData.youtubeChannel);

  renderFilters();
  renderProjects();
  renderVideos();
  renderPlaylists();
  renderSkills();
  renderContactLinks();
  renderSocialLinks();
  renderFooterSocials();
  setupContactForm();
};

const setupNavigation = () => {
  const toggle = $(".nav-toggle");
  const nav = $(".site-nav");
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".site-nav a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (!nav.classList.contains("is-open")) return;
    if (!(event.target instanceof Element)) return;
    if (nav.contains(event.target) || toggle.contains(event.target)) return;
    closeNav();
  });
};

const markActivePage = () => {
  const cleanFilePath = (urlValue) => {
    const url = new URL(urlValue, window.location.href);
    if (url.protocol !== "file:") return url.pathname;
    const rootPath = siteRootUrl.pathname.replace(/\/$/, "");
    const path = url.pathname;
    const relative = path.startsWith(rootPath) ? path.slice(rootPath.length) : path;
    return relative.replace(/index\.html$/, "") || "/";
  };
  const normalizePath = (path) => {
    if (!path || path === "/index.html") return "/";
    return path.endsWith("/") ? path : `${path}/`;
  };
  const currentPath = normalizePath(
    window.location.protocol === "file:" ? cleanFilePath(window.location.href) : window.location.pathname,
  );
  const isCreationDetail = currentPath.startsWith("/creations/") && currentPath !== "/creations/";
  $$(".site-nav a").forEach((link) => {
    const linkPath = normalizePath(
      window.location.protocol === "file:" ? cleanFilePath(link.href) : link.getAttribute("href"),
    );
    if (linkPath === currentPath || (isCreationDetail && linkPath === "/creations/")) {
      link.setAttribute("aria-current", "page");
    }
  });
};

const setupSubscribeWidget = () => {
  const widget = document.querySelector("[data-subscribe-widget]");
  if (!widget) return;

  const fallbackButton = widget.querySelector("[data-subscribe-fallback]");
  if (!fallbackButton) return;

  const syncFallback = () => {
    const officialButton = widget.querySelector(".g-ytsubscribe");
    const officialFrame = widget.querySelector('iframe[src*="youtube.com/subscribe_embed"]');
    const officialBounds = officialButton?.getBoundingClientRect();
    const officialRendered =
      Boolean(officialFrame) ||
      Boolean(officialButton?.children.length) ||
      Boolean(officialBounds && officialBounds.width > 0 && officialBounds.height > 0);
    fallbackButton.hidden = officialRendered;
    widget.classList.toggle("is-loaded", officialRendered);
  };

  syncFallback();

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(syncFallback);
    observer.observe(widget, { childList: true, subtree: true });
  }

  window.setTimeout(syncFallback, 1200);
  window.setTimeout(syncFallback, 3000);
};

const setupScrollReveals = () => {
  if (prefersReducedMotion()) return;
  const items = $$(
    [
      ".video-card",
      ".playlist-card",
      ".feature-grid article",
      ".project-gallery img",
      ".project-image-stack img",
      ".development-progress",
      ".download-panel",
      ".contact-form",
      ".about-visual",
      ".about-story-panel",
      ".world-release",
      ".home-world .project-card",
      ".world-onward",
      ".creation-store .project-card",
      ".story-timeline-entry",
      ".story-era-divider",
      ".skill-panel",
      ".not-found-content",
    ].join(","),
  );
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  items.forEach((item) => item.classList.add("reveal-item"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
  );
  items.forEach((item) => observer.observe(item));
};

const setupAnimatedDetails = () => {
  if (prefersReducedMotion()) return;
  const detailsItems = $$(".animated-details");

  detailsItems.forEach((details) => {
    const summary = details.querySelector(":scope > summary");
    if (!summary) return;
    let animation = null;
    let isClosing = false;
    let isOpening = false;
    let stopScrollLock = null;

    const lockSummaryPosition = () => {
      const lockedTop = summary.getBoundingClientRect().top;
      let frame = 0;
      let active = true;
      const hold = () => {
        if (!active) return;
        const currentTop = summary.getBoundingClientRect().top;
        const delta = currentTop - lockedTop;
        if (Math.abs(delta) > 0.1) {
          window.scrollBy(0, delta);
        }
        frame = window.requestAnimationFrame(hold);
      };

      hold();
      return () => {
        active = false;
        window.cancelAnimationFrame(frame);
      };
    };

    const finishAnimation = (shouldOpen) => {
      details.open = shouldOpen;
      animation = null;
      isClosing = false;
      isOpening = false;
      details.style.height = shouldOpen ? "auto" : "";
      details.style.overflow = shouldOpen ? "visible" : "";
      if (stopScrollLock) {
        stopScrollLock();
        stopScrollLock = null;
      }
    };

    const close = () => {
      isClosing = true;
      stopScrollLock = lockSummaryPosition();
      const startHeight = `${details.offsetHeight}px`;
      const endHeight = `${summary.offsetHeight}px`;

      if (animation) animation.cancel();
      details.style.height = startHeight;
      details.style.overflow = "hidden";
      animation = details.animate(
        { height: [startHeight, endHeight] },
        { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" },
      );
      animation.onfinish = () => finishAnimation(false);
      animation.oncancel = () => {
        isClosing = false;
      };
    };

    const open = () => {
      isOpening = true;
      stopScrollLock = lockSummaryPosition();
      const startHeight = `${summary.offsetHeight}px`;
      details.open = true;
      details.style.height = "auto";
      const endHeight = `${details.offsetHeight}px`;
      details.style.height = startHeight;
      window.requestAnimationFrame(() => {
        if (animation) animation.cancel();
        details.style.overflow = "hidden";
        animation = details.animate(
          { height: [startHeight, endHeight] },
          { duration: 220, easing: "cubic-bezier(0.2, 0, 0, 1)" },
        );
        animation.onfinish = () => finishAnimation(true);
        animation.oncancel = () => {
          isOpening = false;
        };
      });
    };

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (isClosing || !details.open) {
        if (details.classList.contains("story-era")) {
          $$(".channel-story .story-era[open]").forEach((chapter) => {
            if (chapter !== details) chapter.open = false;
          });
        }
        open();
      } else if (isOpening || details.open) {
        close();
      }
    });
  });
};

const setupStoryChapters = () => {
  const entries = $$(".story-timeline-entry");
  if (!entries.length) return;

  $$(".story-jump-nav a[href^='#story-']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const entry = document.querySelector(link.getAttribute("href"));
      if (!entry?.classList.contains("story-timeline-entry")) return;
      event.preventDefault();
      history.pushState(null, "", link.getAttribute("href"));
      entry.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  });
};

hydrateSite();
rewriteStaticInternalLinks();
setupNavigation();
markActivePage();
setupSubscribeWidget();
setupScrollReveals();
setupAnimatedDetails();
setupStoryChapters();
setupProjectUrlControls();
setupPageTransitions();
