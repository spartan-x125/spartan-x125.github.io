(function () {
  function initTheme() {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem("blog-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      localStorage.setItem("blog-theme", next);
    });
  }

  function initBackground() {
    const layer = document.querySelector(".background-layer");
    const backgrounds = JSON.parse(document.body.dataset.backgrounds || "[]");
    if (!layer || backgrounds.length === 0) return;

    const thirtyMinutes = 30 * 60 * 1000;
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
      Date.now() - saved.changedAt < thirtyMinutes
    ) {
      applyBackground(saved.index);
    } else {
      setBackground();
    }

    window.clearInterval(window.__blogBackgroundTimer);
    window.__blogBackgroundTimer = window.setInterval(setBackground, thirtyMinutes);
  }

  function initMusic() {
    const musicCard = document.querySelector(".music-card");
    if (!musicCard || musicCard.dataset.ready === "true") return;
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
    const listToggle = document.getElementById("music-list-toggle");
    const list = document.getElementById("music-list");
    const listButtons = Array.from(document.querySelectorAll("[data-track-index]"));
    let currentIndex = Number(localStorage.getItem("music-track-index") || 0);
    const modes = ["list", "shuffle", "repeat"];
    let mode = localStorage.getItem("music-mode") || "list";
    if (!modes.includes(mode)) mode = "list";

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

    audio?.addEventListener("ended", () => {
      if (mode === "repeat") {
        audio.currentTime = 0;
        playCurrent();
      } else {
        nextTrack();
      }
    });
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
    if (!searchInput || tagButtons.length === 0 || cards.length === 0) return;
    if (searchInput.dataset.ready === "true") return;
    searchInput.dataset.ready = "true";

    let activeTag =
      tagButtons.find((button) => button.classList.contains("is-active"))?.dataset.tag ||
      "all";

    const normalize = (value) => value.trim().toLowerCase();

    const filterPosts = () => {
      const query = normalize(searchInput.value);
      let visibleCount = 0;

      cards.forEach((card) => {
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
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
    };

    searchInput.addEventListener("input", filterPosts);
    tagButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeTag = button.dataset.tag || "all";
        tagButtons.forEach((item) => {
          item.classList.toggle("is-active", item === button);
        });
        filterPosts();
      });
    });

    filterPosts();
  }

  function initPage() {
    initTheme();
    initBackground();
    initMusic();
    initReadingTools();
    initPostFilters();
  }

  document.addEventListener("DOMContentLoaded", initPage);
  document.addEventListener("astro:page-load", initPage);
})();
