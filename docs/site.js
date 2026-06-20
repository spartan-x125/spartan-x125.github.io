(function () {
  function initTheme() {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("blog-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

    const toggle = document.getElementById("theme-toggle");
    if (!toggle || toggle.dataset.ready === "true") return;
    toggle.dataset.ready = "true";
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("blog-theme", next);
      updateGiscusTheme();
    });
  }

  function initAccentColor() {
    const root = document.documentElement;
    const toggle = document.getElementById("color-toggle");
    const panel = document.getElementById("accent-panel");
    const range = document.getElementById("accent-hue");
    if (!toggle || !panel || !range) return;

    const storageKey = "blog-accent-hue";
    const applyHue = (hue) => {
      root.style.setProperty("--accent-hue", String(hue));
      range.value = String(hue);
      localStorage.setItem(storageKey, String(hue));
    };

    const savedHue = Number(localStorage.getItem(storageKey) || 200);
    applyHue(Number.isFinite(savedHue) ? savedHue : 200);

    if (toggle.dataset.ready === "true") return;
    toggle.dataset.ready = "true";

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) document.getElementById("site-topbar")?.classList.remove("is-retracted");
    };

    toggle.addEventListener("click", () => {
      setOpen(panel.hidden);
    });

    range.addEventListener("input", () => {
      applyHue(range.value);
    });

    document.addEventListener("click", (event) => {
      if (panel.hidden) return;
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  function initTopbar() {
    const topbar = document.getElementById("site-topbar");
    if (!topbar) return;

    if (window.__topbarScrollHandler) {
      window.removeEventListener("scroll", window.__topbarScrollHandler);
    }

    const update = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 24) {
        topbar.classList.remove("is-retracted");
      } else {
        topbar.classList.add("is-retracted");
      }
    };

    window.__topbarScrollHandler = update;
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function initRuntimeStats() {
    document.querySelectorAll("[data-site-start]").forEach((target) => {
      const start = new Date(`${target.dataset.siteStart}T00:00:00+08:00`);
      if (Number.isNaN(start.getTime())) return;
      const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
      target.textContent = `${days} 天`;
    });
  }

  function initGlobalSearch() {
    const panel = document.getElementById("topbar-search-panel");
    const input = document.getElementById("post-search");
    const results = document.getElementById("topbar-search-results");
    if (!panel || !input || !results) return;

    const index = JSON.parse(panel.dataset.searchIndex || "[]");
    const normalize = (value) => (value || "").trim().toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const queryFromUrl = params.get("q");
    if (queryFromUrl && !input.value) input.value = queryFromUrl;

    const renderResults = () => {
      const query = normalize(input.value);
      const matches = query
        ? index
            .filter((item) =>
              [
                item.title,
                item.description,
                item.category,
                ...(item.tags || []),
              ]
                .join(" ")
                .toLowerCase()
                .includes(query),
            )
            .slice(0, 6)
        : index.slice(0, 5);

      results.innerHTML = "";
      if (matches.length === 0) {
        const empty = document.createElement("p");
        empty.className = "search-result-empty";
        empty.textContent = "没有找到相关文章。";
        results.append(empty);
        return;
      }

      matches.forEach((item) => {
        const link = document.createElement("a");
        link.className = "search-result-item";
        link.href = item.url;
        link.innerHTML = `<strong></strong><span></span>`;
        link.querySelector("strong").textContent = item.title;
        link.querySelector("span").textContent = `${item.date} · ${item.category}`;
        results.append(link);
      });
    };

    renderResults();

    if (input.dataset.searchReady === "true") return;
    input.dataset.searchReady = "true";

    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const query = input.value.trim();
      if (!query) return;
      event.preventDefault();
      const firstResult = results.querySelector("a");
      if (firstResult) {
        window.location.href = firstResult.href;
      } else {
        window.location.href = `/posts/?q=${encodeURIComponent(query)}`;
      }
    });
  }

  function updateGiscusTheme() {
    const theme = getGiscusTheme();
    document.querySelectorAll(".giscus-frame").forEach((frame) => {
      frame.contentWindow?.postMessage(
        { giscus: { setConfig: { theme } } },
        "https://giscus.app",
      );
    });
  }

  function getGiscusTheme() {
    return document.documentElement.dataset.theme === "dark"
      ? "dark_dimmed"
      : "noborder_light";
  }

  function initGiscus() {
    const section = document.querySelector(".comments-section");
    const host = section?.querySelector(".giscus-host");
    window.clearTimeout(window.__giscusLoadTimer);
    window.clearTimeout(window.__giscusReloadTimer);
    window.__giscusThemeObserver?.disconnect();
    window.__giscusWidthObserver?.disconnect();
    if (!section || !host) return;

    const hasFrame = Boolean(host.querySelector(".giscus-frame"));
    if (host.dataset.ready === "true" && hasFrame) {
      setupGiscusWidthGuard(section, host);
      return;
    }

    host.dataset.ready = "pending";
    host.setAttribute("aria-busy", "true");

    const mount = (width) => {
      mountGiscus(section, host, width);
    };

    waitForStableWidth(host, mount);
  }

  function mountGiscus(section, host, width) {
    if (!host.isConnected) return;
    window.__giscusThemeObserver?.disconnect();
    observeGiscusFrame(host);
    host.dataset.ready = "true";
    host.dataset.loadWidth = String(Math.round(width));
    host.setAttribute("aria-busy", "true");
    host.replaceChildren(createGiscusScript(section));
    setupGiscusWidthGuard(section, host);
  }

  function observeGiscusFrame(host) {
    window.__giscusThemeObserver = new MutationObserver(() => {
      if (host.querySelector(".giscus-frame")) {
        updateGiscusTheme();
        host.removeAttribute("aria-busy");
        window.__giscusThemeObserver.disconnect();
      }
    });
    window.__giscusThemeObserver.observe(host, {
      childList: true,
      subtree: true,
    });
  }

  function waitForStableWidth(element, callback) {
    let lastWidth = 0;
    let stableFrames = 0;
    let attempts = 0;
    const maxAttempts = 24;

    const tick = () => {
      const width = Math.round(element.getBoundingClientRect().width);
      if (width > 0 && Math.abs(width - lastWidth) <= 1) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      lastWidth = width;
      attempts += 1;

      if ((width > 240 && stableFrames >= 2) || attempts >= maxAttempts) {
        window.__giscusLoadTimer = window.setTimeout(() => callback(width), 80);
        return;
      }

      window.requestAnimationFrame(tick);
    };

    window.requestAnimationFrame(() => window.requestAnimationFrame(tick));
  }

  function setupGiscusWidthGuard(section, host) {
    if (!("ResizeObserver" in window)) return;

    window.__giscusWidthObserver?.disconnect();
    window.__giscusWidthObserver = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const loadWidth = Number(host.dataset.loadWidth || 0);
      const frame = host.querySelector(".giscus-frame");
      if (!frame || !loadWidth) return;

      if (loadWidth < 520 && width - loadWidth > 160) {
        window.clearTimeout(window.__giscusReloadTimer);
        window.__giscusReloadTimer = window.setTimeout(() => {
          mountGiscus(section, host, width);
        }, 180);
      }
    });

    window.__giscusWidthObserver.observe(host);
  }

  function createGiscusScript(section) {
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.repo = section.dataset.giscusRepo;
    script.dataset.repoId = section.dataset.giscusRepoId;
    script.dataset.category = section.dataset.giscusCategory;
    script.dataset.categoryId = section.dataset.giscusCategoryId;
    script.dataset.mapping = "specific";
    script.dataset.term = section.dataset.giscusTerm;
    script.dataset.strict = "0";
    script.dataset.reactionsEnabled = "1";
    script.dataset.emitMetadata = "0";
    script.dataset.inputPosition = "top";
    script.dataset.theme = getGiscusTheme();
    script.dataset.lang = "zh-CN";
    return script;
  }

  function initBackground() {
    const layer = document.querySelector(".background-layer");
    const backgrounds = JSON.parse(document.body.dataset.backgrounds || "[]");
    if (!layer || backgrounds.length === 0) return;

    const tenMinutes = 10 * 60 * 1000;
    const storageKey = "blog-background-state";
    const applyBackground = (index) => {
      layer.style.backgroundImage = `url("${backgrounds[index]}")`;
      document.documentElement.style.setProperty(
        "--active-background-image",
        `url("${backgrounds[index]}")`,
      );
    };
    const setBackground = () => {
      const index = Math.floor(Math.random() * backgrounds.length);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ index, changedAt: Date.now() }),
      );
      applyBackground(index);
    };

    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (
      saved &&
      Number.isInteger(saved.index) &&
      backgrounds[saved.index] &&
      Date.now() - saved.changedAt < tenMinutes
    ) {
      applyBackground(saved.index);
    } else {
      setBackground();
    }

    window.clearInterval(window.__blogBackgroundTimer);
    window.__blogBackgroundTimer = window.setInterval(setBackground, tenMinutes);
  }

  function initSidebarLayout() {
    const layouts = Array.from(document.querySelectorAll(".blog-layout, .article-layout"));
    if (layouts.length === 0) return;

    const storageKey = "blog-sidebar-position";
    const toggle = document.querySelector("[data-sidebar-position-toggle]");
    const getSavedPosition = () =>
      localStorage.getItem(storageKey) === "right" ? "right" : "left";
    const applyPosition = (position) => {
      const isRight = position === "right";
      layouts.forEach((layout) => {
        layout.classList.toggle("is-sidebar-right", isRight);
      });
      document.documentElement.dataset.sidebarPosition = isRight ? "right" : "left";

      if (!toggle) return;
      toggle.classList.toggle("is-right", isRight);
      const label = isRight
        ? "左右侧栏已交换，点击恢复"
        : "点击交换左右侧栏";
      toggle.title = label;
      toggle.setAttribute("aria-label", label);
      window.requestAnimationFrame(() => window.__musicListResizeHandler?.());
    };

    applyPosition(getSavedPosition());

    if (!toggle || toggle.dataset.ready === "true") return;
    toggle.dataset.ready = "true";
    toggle.addEventListener("click", () => {
      const current = layouts.some((layout) =>
        layout.classList.contains("is-sidebar-right"),
      )
        ? "right"
        : "left";
      const next = current === "right" ? "left" : "right";
      localStorage.setItem(storageKey, next);
      applyPosition(next);
    });
  }

  function initMusic() {
    const musicCard = document.querySelector(".music-card");
    if (!musicCard) return;

    const list = document.getElementById("music-list");
    const compactMusicQuery = window.matchMedia("(max-width: 860px)");
    const updateListHeight = () => {
      if (!list || list.hidden) return;
      if (compactMusicQuery.matches && musicCard.matches(".mobile-music-panel")) {
        list.style.maxHeight = "";
        return;
      }

      const listTop = list.getBoundingClientRect().top;
      const isMusicOnRight = Boolean(
        musicCard.closest(".blog-layout.is-sidebar-right, .article-layout.is-sidebar-right"),
      );
      const backToTopReserve =
        !compactMusicQuery.matches && isMusicOnRight ? 96 : 0;
      const availableHeight = window.innerHeight - listTop - 20 - backToTopReserve;
      const responsiveLimit = window.innerHeight * (window.innerWidth <= 560 ? 0.38 : 0.46);
      list.style.maxHeight = `${Math.max(96, Math.min(320, responsiveLimit, availableHeight))}px`;
    };

    window.removeEventListener("resize", window.__musicListResizeHandler);
    window.__musicListResizeHandler = updateListHeight;
    window.addEventListener("resize", updateListHeight, { passive: true });
    updateListHeight();

    if (musicCard.dataset.ready === "true") return;
    musicCard.dataset.ready = "true";

    const tracks = JSON.parse(musicCard.dataset.tracks || "[]");
    const audio = document.getElementById("music-audio");
    const cover = document.getElementById("music-cover");
    const title = document.getElementById("music-title");
    const artist = document.getElementById("music-artist");
    const current = document.getElementById("music-current");
    const duration = document.getElementById("music-duration");
    const progress = document.getElementById("music-progress");
    const playButton = document.getElementById("music-play");
    const prevButton = document.getElementById("music-prev");
    const nextButton = document.getElementById("music-next");
    const modeButton = document.getElementById("music-mode");
    const volume = document.getElementById("music-volume");
    const volumeIcon = document.getElementById("music-volume-icon");
    const volumeValue = document.getElementById("music-volume-value");
    const listToggle = document.getElementById("music-list-toggle");
    const listButtons = Array.from(document.querySelectorAll("[data-track-index]"));
    const musicIcons = {
      prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"></path></svg>',
      play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>',
      pause:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"></path></svg>',
      next:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg>',
      modeList:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>',
      modeShuffle:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"></path></svg>',
      modeRepeat:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3M12 10v5M10.8 10.8 12 10l1.2.8"></path></svg>',
      playlist:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"></path><path d="M4 6h.01M4 12h.01M4 18h.01"></path></svg>',
      volumeHigh:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="M16 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 6a8 8 0 0 1 0 12"></path></svg>',
      volumeLow:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="M16 9a4.5 4.5 0 0 1 0 6"></path></svg>',
      volumeMute:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"></path><path d="M17 9l4 4M21 9l-4 4"></path></svg>',
    };
    const setMusicIcon = (element, iconName) => {
      if (!element || !musicIcons[iconName]) return;
      element.innerHTML = musicIcons[iconName];
    };
    setMusicIcon(prevButton, "prev");
    setMusicIcon(playButton, !audio || audio.paused ? "play" : "pause");
    setMusicIcon(nextButton, "next");
    setMusicIcon(listToggle, "playlist");
    let currentIndex = Number(localStorage.getItem("music-track-index") || 0);
    const modes = ["list", "shuffle", "repeat"];
    let mode = localStorage.getItem("music-mode") || "list";
    if (!modes.includes(mode)) mode = "list";
    let savedVolume = Number(localStorage.getItem("music-volume") || 80);
    if (!Number.isFinite(savedVolume)) savedVolume = 80;
    savedVolume = Math.min(Math.max(savedVolume, 0), 100);

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds)) return "--:--";
      const minutes = Math.floor(seconds / 60);
      const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${minutes}:${rest}`;
    };

    const renderTrack = () => {
      if (tracks.length === 0) return;
      if (!tracks[currentIndex]) currentIndex = 0;
      const track = tracks[currentIndex];
      audio.src = track.src;
      cover.src = track.cover;
      title.textContent = track.title;
      artist.textContent = track.artist;
      progress.value = 0;
      current.textContent = "0:00";
      duration.textContent = "--:--";
      localStorage.setItem("music-track-index", String(currentIndex));
      listButtons.forEach((button) => {
        button.classList.toggle(
          "is-active",
          Number(button.dataset.trackIndex) === currentIndex,
        );
      });
    };

    const renderMode = () => {
      const icons = {
        list: "modeList",
        shuffle: "modeShuffle",
        repeat: "modeRepeat",
      };
      const titles = {
        list: "列表播放",
        shuffle: "随机播放",
        repeat: "单曲循环",
      };
      setMusicIcon(modeButton, icons[mode]);
      modeButton.title = titles[mode];
      modeButton.setAttribute("aria-label", `当前模式：${titles[mode]}，点击切换`);
      modeButton.classList.toggle("is-active", mode !== "list");
    };

    const renderVolume = () => {
      audio.volume = savedVolume / 100;
      volume.value = String(savedVolume);
      volumeValue.textContent = `${Math.round(savedVolume)}%`;
      setMusicIcon(
        volumeIcon,
        savedVolume === 0 ? "volumeMute" : savedVolume < 45 ? "volumeLow" : "volumeHigh",
      );
    };

    const playCurrent = async () => {
      try {
        await audio.play();
        setMusicIcon(playButton, "pause");
      } catch {
        setMusicIcon(playButton, "play");
      }
    };

    const getRandomIndex = () => {
      if (tracks.length <= 1) return currentIndex;
      let next = currentIndex;
      while (next === currentIndex) {
        next = Math.floor(Math.random() * tracks.length);
      }
      return next;
    };

    const nextTrack = () => {
      if (tracks.length === 0) return;
      if (mode === "shuffle") {
        currentIndex = getRandomIndex();
      } else {
        currentIndex = (currentIndex + 1) % tracks.length;
      }
      renderTrack();
      playCurrent();
    };

    const prevTrack = () => {
      if (tracks.length === 0) return;
      if (mode === "shuffle") {
        currentIndex = getRandomIndex();
      } else {
        currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      }
      renderTrack();
      playCurrent();
    };

    playButton?.addEventListener("click", () => {
      if (audio.paused) {
        playCurrent();
      } else {
        audio.pause();
        setMusicIcon(playButton, "play");
      }
    });

    prevButton?.addEventListener("click", prevTrack);
    nextButton?.addEventListener("click", nextTrack);

    renderMode();
    modeButton?.addEventListener("click", () => {
      const nextMode = modes[(modes.indexOf(mode) + 1) % modes.length];
      mode = nextMode;
      localStorage.setItem("music-mode", mode);
      renderMode();
    });

    listToggle?.addEventListener("click", () => {
      list.hidden = !list.hidden;
      const isListOpen = !list.hidden;
      musicCard.classList.toggle("is-list-open", isListOpen);
      if (!list.hidden) {
        window.requestAnimationFrame(() => {
          updateListHeight();
        });
      } else {
        list.style.maxHeight = "";
      }
    });

    listButtons.forEach((button) => {
      button.addEventListener("click", () => {
        currentIndex = Number(button.dataset.trackIndex);
        renderTrack();
        playCurrent();
      });
    });

    audio?.addEventListener("loadedmetadata", () => {
      duration.textContent = formatTime(audio.duration);
    });

    audio?.addEventListener("play", () => {
      setMusicIcon(playButton, "pause");
    });

    audio?.addEventListener("pause", () => {
      setMusicIcon(playButton, "play");
    });

    audio?.addEventListener("timeupdate", () => {
      current.textContent = formatTime(audio.currentTime);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        progress.value = String((audio.currentTime / audio.duration) * 100);
      }
    });

    progress?.addEventListener("input", () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(progress.value) / 100) * audio.duration;
      }
    });

    volume?.addEventListener("input", () => {
      savedVolume = Number(volume.value);
      localStorage.setItem("music-volume", String(savedVolume));
      renderVolume();
    });

    audio?.addEventListener("ended", () => {
      if (mode === "repeat") {
        audio.currentTime = 0;
        playCurrent();
      } else {
        nextTrack();
      }
    });
    renderVolume();
    renderTrack();
  }

  function initReadingTools() {
    if (window.__readingProgressHandler) {
      window.removeEventListener("scroll", window.__readingProgressHandler);
      window.__readingProgressHandler = null;
    }

    const article = document.querySelector(".article-content");
    const progressBars = [
      document.getElementById("reading-progress-bar"),
      document.getElementById("mobile-reading-progress-bar"),
    ].filter(Boolean);
    const tocTargets = [
      document.getElementById("reading-toc"),
      document.getElementById("mobile-reading-toc"),
    ].filter(Boolean);
    if (!article || progressBars.length === 0 || tocTargets.length === 0) return;

    const readingCard = document.getElementById("reading-toc")?.closest(".article-reading-card");
    const isCompact = window.matchMedia("(max-width: 860px)").matches;
    if (readingCard) {
      readingCard.toggleAttribute("aria-hidden", isCompact);
    }

    const headings = Array.from(article.querySelectorAll("h2, h3"));
    const renderToc = (toc) => {
      toc.innerHTML = "";
      headings.forEach((heading, index) => {
        if (!heading.id) heading.id = `section-${index + 1}`;
        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        link.className = heading.tagName === "H3" ? "toc-child" : "";
        toc.append(link);
      });

      if (headings.length === 0) {
        toc.innerHTML = "<span>\u6682\u65e0\u76ee\u5f55</span>";
      }
    };

    tocTargets.forEach(renderToc);

    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const total = Math.max(article.scrollHeight - window.innerHeight, 1);
      const read = Math.min(Math.max(-rect.top, 0), total);
      const width = `${(read / total) * 100}%`;
      progressBars.forEach((progressBar) => {
        progressBar.style.width = width;
      });
    };

    window.__readingProgressHandler = updateProgress;
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  function initArticleTables() {
    const article = document.querySelector(".article-content");
    if (!article) return;

    article.querySelectorAll("table").forEach((table, index) => {
      if (table.closest(".article-table-scroll")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "article-table-scroll";
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", `可横向滚动的表格 ${index + 1}`);
      wrapper.tabIndex = 0;

      table.parentNode.insertBefore(wrapper, table);
      wrapper.append(table);
    });
  }

  function initBackToTop() {
    if (window.__backToTopHandler) {
      window.removeEventListener("scroll", window.__backToTopHandler);
      window.__backToTopHandler = null;
    }

    const button = document.getElementById("back-to-top");
    if (!button) return;

    const isDockedButton = Boolean(button.closest(".sidebar-action-dock"));
    const syncedTocToggle = document.getElementById("mobile-toc-toggle");
    const syncedTocPanel = syncedTocToggle
      ? document.getElementById(syncedTocToggle.getAttribute("aria-controls"))
      : null;
    const updateSyncedToc = (isVisible) => {
      if (!syncedTocToggle) return;
      syncedTocToggle.classList.toggle("is-visible", isVisible);
      syncedTocToggle.tabIndex = isVisible ? 0 : -1;
      syncedTocToggle.setAttribute("aria-hidden", String(!isVisible));

      if (!isVisible && syncedTocPanel) {
        syncedTocToggle.classList.remove("is-open");
        syncedTocToggle.setAttribute("aria-expanded", "false");
        syncedTocPanel.classList.remove("is-open");
        syncedTocPanel.setAttribute("aria-hidden", "true");
      }
    };
    const updateVisibility = () => {
      const isVisible = window.scrollY > 260;
      const scrollMax = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(window.scrollY / scrollMax, 0), 1);
      button.style.setProperty("--back-to-top-progress", `${progress * 100}%`);
      button.classList.toggle("is-visible", isVisible);
      button.classList.toggle("is-at-top", !isVisible);
      updateSyncedToc(isVisible);

      if (isDockedButton) {
        button.tabIndex = 0;
        button.setAttribute("aria-hidden", "false");
      } else {
        button.tabIndex = isVisible ? 0 : -1;
        button.setAttribute("aria-hidden", String(!isVisible));
      }
    };

    window.__backToTopHandler = updateVisibility;
    window.addEventListener("scroll", updateVisibility, { passive: true });
    updateVisibility();

    if (button.dataset.ready === "true") return;
    button.dataset.ready = "true";
    button.addEventListener("click", () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      button.classList.add("is-lifting");
      window.clearTimeout(window.__backToTopAnimationTimer);
      window.__backToTopAnimationTimer = window.setTimeout(() => {
        button.classList.remove("is-lifting");
      }, 560);
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  function initMobileFloatingPanels() {
    const toggles = Array.from(document.querySelectorAll("[data-mobile-panel-toggle]"));
    if (toggles.length === 0) return;

    const isCompact = () => window.matchMedia("(max-width: 860px)").matches;
    const getPanel = (toggle) => {
      const id = toggle.getAttribute("aria-controls");
      return id ? document.getElementById(id) : null;
    };
    const setPanelState = (toggle, panel, open) => {
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      panel.classList.toggle("is-open", open);
      if (isCompact()) {
        panel.setAttribute("aria-hidden", String(!open));
      } else {
        panel.removeAttribute("aria-hidden");
      }
    };
    const closeAll = (exceptPanel = null) => {
      toggles.forEach((toggle) => {
        const panel = getPanel(toggle);
        if (!panel || panel === exceptPanel) return;
        setPanelState(toggle, panel, false);
      });
    };

    toggles.forEach((toggle) => {
      const panel = getPanel(toggle);
      if (!panel) return;
      setPanelState(toggle, panel, isCompact() && panel.classList.contains("is-open"));

      if (toggle.dataset.mobilePanelReady !== "true") {
        toggle.dataset.mobilePanelReady = "true";
        toggle.addEventListener("click", () => {
          const shouldOpen = !panel.classList.contains("is-open");
          closeAll(panel);
          setPanelState(toggle, panel, shouldOpen);
          if (shouldOpen && panel.matches(".mobile-music-panel")) {
            window.requestAnimationFrame(() => window.__musicListResizeHandler?.());
          }
          if (shouldOpen && panel.matches("#topbar-search-panel")) {
            window.requestAnimationFrame(() => panel.querySelector("input")?.focus());
          }
        });
      }

      if (panel.dataset.mobilePanelReady !== "true") {
        panel.dataset.mobilePanelReady = "true";
        panel.addEventListener("click", (event) => {
          const target = event.target instanceof Element ? event.target : null;
          if (target?.closest(".reading-toc a")) {
            setPanelState(toggle, panel, false);
          }
        });
      }
    });

    if (window.__mobilePanelOutsideHandler) {
      document.removeEventListener("click", window.__mobilePanelOutsideHandler);
    }
    window.__mobilePanelOutsideHandler = (event) => {
      if (!isCompact()) return;
      toggles.forEach((toggle) => {
        const panel = getPanel(toggle);
        if (!panel || !panel.classList.contains("is-open")) return;
        if (toggle.contains(event.target) || panel.contains(event.target)) return;
        setPanelState(toggle, panel, false);
      });
    };
    document.addEventListener("click", window.__mobilePanelOutsideHandler);

    if (window.__mobilePanelKeyHandler) {
      document.removeEventListener("keydown", window.__mobilePanelKeyHandler);
    }
    window.__mobilePanelKeyHandler = (event) => {
      if (event.key !== "Escape") return;
      closeAll();
    };
    document.addEventListener("keydown", window.__mobilePanelKeyHandler);

    if (window.__mobilePanelResizeHandler) {
      window.removeEventListener("resize", window.__mobilePanelResizeHandler);
    }
    window.__mobilePanelResizeHandler = () => {
      toggles.forEach((toggle) => {
        const panel = getPanel(toggle);
        if (!panel) return;
        setPanelState(toggle, panel, isCompact() && panel.classList.contains("is-open"));
      });
    };
    window.addEventListener("resize", window.__mobilePanelResizeHandler, { passive: true });
  }

  function initPostFilters() {
    const searchInput = document.getElementById("post-search");
    const tagButtons = Array.from(document.querySelectorAll(".tag-button"));
    const categoryButtons = Array.from(document.querySelectorAll(".category-button"));
    const cards = Array.from(document.querySelectorAll("#post-list .post-card"));
    const emptyState = document.getElementById("empty-state");
    const pagination = document.getElementById("post-pagination");
    const sortToggle = document.getElementById("sort-toggle");
    const pageSize = Number(document.getElementById("post-list")?.dataset.pageSize || 0);
    if (!searchInput || cards.length === 0) return;
    if (searchInput.dataset.filterReady === "true") return;
    searchInput.dataset.filterReady = "true";

    const params = new URLSearchParams(window.location.search);
    const tagFromUrl = params.get("tag");
    const categoryFromUrl = params.get("category");
    const queryFromUrl = params.get("q");
    let activeTag = tagFromUrl || "all";
    let activeCategory = categoryFromUrl || "all";
    let currentPage = 1;
    let sortOrder = sortToggle?.dataset.order || "desc";
    if (queryFromUrl) searchInput.value = queryFromUrl;

    const normalize = (value) => value.trim().toLowerCase();
    const syncUrl = () => {
      const url = new URL(window.location.href);
      const query = searchInput.value.trim();
      if (query) {
        url.searchParams.set("q", query);
      } else {
        url.searchParams.delete("q");
      }

      if (activeTag === "all") {
        url.searchParams.delete("tag");
      } else {
        url.searchParams.set("tag", activeTag);
      }

      if (activeCategory === "all") {
        url.searchParams.delete("category");
      } else {
        url.searchParams.set("category", activeCategory);
      }

      window.history.replaceState({}, "", url);
    };

    const renderPagination = (visibleCards) => {
      if (!pagination || pageSize <= 0) return;
      const pageCount = Math.max(Math.ceil(visibleCards.length / pageSize), 1);
      currentPage = Math.min(currentPage, pageCount);
      pagination.innerHTML = "";
      if (pageCount <= 1) return;
      for (let page = 1; page <= pageCount; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(page);
        button.classList.toggle("is-active", page === currentPage);
        button.addEventListener("click", () => {
          currentPage = page;
          filterPosts();
        });
        pagination.append(button);
      }
    };

    const filterPosts = () => {
      const query = normalize(searchInput.value);
      const visibleCards = [];

      const sortedCards = [...cards].sort((a, b) => {
        const diff = new Date(a.dataset.date).getTime() - new Date(b.dataset.date).getTime();
        return sortOrder === "asc" ? diff : -diff;
      });
      sortedCards.forEach((card) => card.parentElement.append(card));

      sortedCards.forEach((card) => {
        const haystack = [
          card.dataset.title,
          card.dataset.description,
          card.dataset.category,
          card.dataset.tags,
        ].join(" ");
        const matchesQuery = !query || haystack.includes(query);
        const matchesTag =
          activeTag === "all" ||
          card.dataset.tags.includes(activeTag.toLowerCase());
        const matchesCategory =
          activeCategory === "all" ||
          card.dataset.category === activeCategory.toLowerCase();
        const visible = matchesQuery && matchesTag && matchesCategory;
        if (visible) visibleCards.push(card);
        card.hidden = true;
      });

      const start = pageSize > 0 ? (currentPage - 1) * pageSize : 0;
      const end = pageSize > 0 ? start + pageSize : visibleCards.length;
      visibleCards.slice(start, end).forEach((card) => {
        card.hidden = false;
      });

      renderPagination(visibleCards);
      if (emptyState) emptyState.hidden = visibleCards.length !== 0;
    };

    searchInput.addEventListener("input", () => {
      currentPage = 1;
      syncUrl();
      filterPosts();
    });
    tagButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tag === activeTag);
      button.addEventListener("click", () => {
        activeTag = button.dataset.tag || "all";
        currentPage = 1;
        tagButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        syncUrl();
        filterPosts();
      });
    });
    categoryButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.category === activeCategory);
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "all";
        currentPage = 1;
        categoryButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        syncUrl();
        filterPosts();
      });
    });

    sortToggle?.addEventListener("click", () => {
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
      sortToggle.dataset.order = sortOrder;
      sortToggle.querySelector("strong").textContent = sortOrder === "desc" ? "↓" : "↑";
      sortToggle.setAttribute(
        "aria-label",
        sortOrder === "desc" ? "时间排序：从新到旧" : "时间排序：从旧到新",
      );
      currentPage = 1;
      filterPosts();
    });

    if (!tagButtons.some((button) => button.classList.contains("is-active"))) {
      activeTag = "all";
      tagButtons[0]?.classList.add("is-active");
    }
    if (
      categoryButtons.length > 0 &&
      !categoryButtons.some((button) => button.classList.contains("is-active"))
    ) {
      activeCategory = "all";
      categoryButtons[0]?.classList.add("is-active");
    }

    filterPosts();
  }

  function initLikes() {
    const createClient = window.supabase?.createClient;
    document.querySelectorAll(".like-button").forEach((button) => {
      if (button.dataset.ready === "true") return;
      button.dataset.ready = "true";
      const key = button.dataset.likeKey;
      const supabaseUrl = button.dataset.supabaseUrl;
      const supabaseKey = button.dataset.supabaseKey;
      const count = button.querySelector("strong");
      const visitorStorageKey = "blog-like-visitor-id";
      let visitorId = localStorage.getItem(visitorStorageKey);
      const createVisitorId = () => {
        const browserCrypto = window.crypto;
        if (browserCrypto?.randomUUID) return browserCrypto.randomUUID();
        const bytes = new Uint8Array(16);
        if (browserCrypto?.getRandomValues) {
          browserCrypto.getRandomValues(bytes);
        } else {
          for (let index = 0; index < bytes.length; index += 1) {
            bytes[index] = Math.floor(Math.random() * 256);
          }
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
        return [
          hex.slice(0, 4).join(""),
          hex.slice(4, 6).join(""),
          hex.slice(6, 8).join(""),
          hex.slice(8, 10).join(""),
          hex.slice(10, 16).join(""),
        ].join("-");
      };
      const showError = (message) => {
        count.textContent = "!";
        button.title = message;
        button.setAttribute("aria-label", message);
      };

      if (!createClient || !supabaseUrl || !supabaseKey) {
        button.disabled = true;
        showError("实时点赞服务加载失败");
        return;
      }

      if (!visitorId) {
        visitorId = createVisitorId();
        localStorage.setItem(visitorStorageKey, visitorId);
      }

      const client = createClient(supabaseUrl, supabaseKey);
      const render = (value, liked) => {
        button.classList.toggle("is-liked", liked);
        count.textContent = String(Math.max(Number(value) || 0, 0));
        button.title = liked ? "取消点赞" : "点赞文章";
        button.setAttribute("aria-label", button.title);
      };

      const loadLike = async () => {
        count.textContent = "…";
        const { data, error } = await client.rpc("get_article_like", {
          target_post_key: key,
          target_visitor_id: visitorId,
        });
        if (error) {
          showError("暂时无法读取点赞数，请确认 Supabase SQL 已执行");
          return;
        }
        render(data[0]?.like_count, data[0]?.liked);
      };

      button.addEventListener("click", async () => {
        button.disabled = true;
        const { data, error } = await client.rpc("toggle_article_like", {
          target_post_key: key,
          target_visitor_id: visitorId,
        });
        button.disabled = false;
        if (error) {
          showError("点赞失败，请稍后重试");
          return;
        }
        render(data[0]?.like_count, data[0]?.liked);
      });

      const channel = client
        .channel(`article-likes-${key}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "article_like_counts",
            filter: `post_key=eq.${key}`,
          },
          (payload) => {
            render(payload.new.like_count, button.classList.contains("is-liked"));
          },
        )
        .subscribe();

      document.addEventListener(
        "astro:before-preparation",
        () => client.removeChannel(channel),
        { once: true },
      );
      loadLike();
    });
  }

  function initPage() {
    initTheme();
    initAccentColor();
    initTopbar();
    initRuntimeStats();
    initGlobalSearch();
    initBackground();
    initSidebarLayout();
    initMusic();
    initArticleTables();
    initReadingTools();
    initBackToTop();
    initMobileFloatingPanels();
    initPostFilters();
    initLikes();
    initGiscus();
  }

  if (!window.__blogLifecycleReady) {
    window.__blogLifecycleReady = true;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPage, { once: true });
    } else {
      initPage();
    }
    document.addEventListener("astro:page-load", initPage);
  }
})();
