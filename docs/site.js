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

  function updateGiscusTheme() {
    const theme = getGiscusTheme();
    document.querySelector(".giscus-frame")?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      "https://giscus.app",
    );
  }

  function getGiscusTheme() {
    return document.documentElement.dataset.theme === "dark"
      ? "dark_dimmed"
      : "noborder_light";
  }

  function initGiscus() {
    const section = document.querySelector(".comments-section");
    const host = section?.querySelector(".giscus-host");
    window.__giscusThemeObserver?.disconnect();
    if (!section || !host || host.dataset.ready === "true") return;
    host.dataset.ready = "true";

    window.__giscusThemeObserver = new MutationObserver(() => {
      if (host.querySelector(".giscus-frame")) {
        updateGiscusTheme();
        window.__giscusThemeObserver.disconnect();
      }
    });
    window.__giscusThemeObserver.observe(host, {
      childList: true,
      subtree: true,
    });

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
    host.append(script);
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

  function initMusic() {
    const musicCard = document.querySelector(".music-card");
    if (!musicCard) return;

    const list = document.getElementById("music-list");
    const updateListHeight = () => {
      if (!list || list.hidden) return;
      const listTop = list.getBoundingClientRect().top;
      const availableHeight = window.innerHeight - listTop - 20;
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
      const labels = {
        list: "↻",
        shuffle: "⤨",
        repeat: "1",
      };
      const titles = {
        list: "列表播放",
        shuffle: "随机播放",
        repeat: "单曲循环",
      };
      modeButton.textContent = labels[mode];
      modeButton.title = titles[mode];
      modeButton.setAttribute("aria-label", `当前模式：${titles[mode]}，点击切换`);
      modeButton.classList.toggle("is-active", mode !== "list");
    };

    const renderVolume = () => {
      audio.volume = savedVolume / 100;
      volume.value = String(savedVolume);
      volumeValue.textContent = `${Math.round(savedVolume)}%`;
      volumeIcon.textContent = savedVolume === 0 ? "×" : savedVolume < 45 ? "♪" : "♫";
    };

    const playCurrent = async () => {
      try {
        await audio.play();
        playButton.textContent = "Ⅱ";
      } catch {
        playButton.textContent = "▶";
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
        playButton.textContent = "▶";
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
      if (!list.hidden) {
        window.requestAnimationFrame(() => {
          updateListHeight();
          list.scrollIntoView({ block: "nearest", behavior: "smooth" });
        });
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
    const article = document.querySelector(".article-content");
    const progressBar = document.getElementById("reading-progress-bar");
    const toc = document.getElementById("reading-toc");
    if (!article || !progressBar || !toc) return;

    const headings = Array.from(article.querySelectorAll("h2, h3"));
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
      toc.innerHTML = "<span>暂无目录</span>";
    }

    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const total = Math.max(article.scrollHeight - window.innerHeight, 1);
      const read = Math.min(Math.max(-rect.top, 0), total);
      progressBar.style.width = `${(read / total) * 100}%`;
    };

    window.removeEventListener("scroll", window.__readingProgressHandler);
    window.__readingProgressHandler = updateProgress;
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  function initPostFilters() {
    const searchInput = document.getElementById("post-search");
    const tagButtons = Array.from(document.querySelectorAll(".tag-button"));
    const cards = Array.from(document.querySelectorAll(".post-card"));
    const emptyState = document.getElementById("empty-state");
    const pagination = document.getElementById("post-pagination");
    const sortToggle = document.getElementById("sort-toggle");
    const pageSize = Number(document.getElementById("post-list")?.dataset.pageSize || 0);
    if (!searchInput || tagButtons.length === 0 || cards.length === 0) return;
    if (searchInput.dataset.ready === "true") return;
    searchInput.dataset.ready = "true";

    const params = new URLSearchParams(window.location.search);
    const tagFromUrl = params.get("tag");
    let activeTag = tagFromUrl || "all";
    let currentPage = 1;
    let sortOrder = sortToggle?.dataset.order || "desc";

    const normalize = (value) => value.trim().toLowerCase();

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
          card.dataset.tags,
        ].join(" ");
        const matchesQuery = !query || haystack.includes(query);
        const matchesTag =
          activeTag === "all" ||
          card.dataset.tags.includes(activeTag.toLowerCase());
        const visible = matchesQuery && matchesTag;
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
        const url = new URL(window.location.href);
        if (activeTag === "all") {
          url.searchParams.delete("tag");
        } else {
          url.searchParams.set("tag", activeTag);
        }
        window.history.replaceState({}, "", url);
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
    initGiscus();
    initBackground();
    initMusic();
    initReadingTools();
    initPostFilters();
    initLikes();
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
