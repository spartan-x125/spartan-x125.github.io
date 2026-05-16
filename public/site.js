(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("blog-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = savedTheme || (prefersDark ? "dark" : "light");

  document.getElementById("theme-toggle")?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("blog-theme", next);
  });

  const layer = document.querySelector(".background-layer");
  const backgrounds = JSON.parse(document.body.dataset.backgrounds || "[]");
  if (layer && backgrounds.length > 0) {
    const thirtyMinutes = 30 * 60 * 1000;
    const storageKey = "blog-background-state";
    const setBackground = () => {
      const index = Math.floor(Math.random() * backgrounds.length);
      localStorage.setItem(
        storageKey,
        JSON.stringify({ index, changedAt: Date.now() }),
      );
      layer.style.backgroundImage = `url("${backgrounds[index]}")`;
    };
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (
      saved &&
      Number.isInteger(saved.index) &&
      backgrounds[saved.index] &&
      Date.now() - saved.changedAt < thirtyMinutes
    ) {
      layer.style.backgroundImage = `url("${backgrounds[saved.index]}")`;
    } else {
      setBackground();
    }
    window.setInterval(setBackground, thirtyMinutes);
  }

  const musicCard = document.querySelector(".music-card");
  if (musicCard) {
    const tracks = JSON.parse(musicCard.dataset.tracks || "[]");
    const audio = document.getElementById("music-audio");
    const cover = document.getElementById("music-cover");
    const title = document.getElementById("music-title");
    const artist = document.getElementById("music-artist");
    const current = document.getElementById("music-current");
    const duration = document.getElementById("music-duration");
    const progress = document.getElementById("music-progress");
    const playButton = document.getElementById("music-play");
    const nextButton = document.getElementById("music-next");
    const shuffleButton = document.getElementById("music-shuffle");
    const listToggle = document.getElementById("music-list-toggle");
    const list = document.getElementById("music-list");
    const listButtons = Array.from(document.querySelectorAll("[data-track-index]"));
    let currentIndex = 0;
    let shuffle = false;

    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds)) return "--:--";
      const minutes = Math.floor(seconds / 60);
      const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${minutes}:${rest}`;
    };

    const renderTrack = () => {
      const track = tracks[currentIndex];
      if (!track) return;
      audio.src = track.src;
      cover.src = track.cover;
      title.textContent = track.title;
      artist.textContent = track.artist;
      progress.value = 0;
      current.textContent = "0:00";
      duration.textContent = "--:--";
      listButtons.forEach((button) => {
        button.classList.toggle(
          "is-active",
          Number(button.dataset.trackIndex) === currentIndex,
        );
      });
    };

    const playCurrent = async () => {
      try {
        await audio.play();
        playButton.textContent = "Ⅱ";
      } catch {
        playButton.textContent = "▶";
      }
    };

    const nextTrack = () => {
      if (tracks.length === 0) return;
      if (shuffle && tracks.length > 1) {
        let next = currentIndex;
        while (next === currentIndex) {
          next = Math.floor(Math.random() * tracks.length);
        }
        currentIndex = next;
      } else {
        currentIndex = (currentIndex + 1) % tracks.length;
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

    nextButton?.addEventListener("click", nextTrack);

    shuffleButton?.addEventListener("click", () => {
      shuffle = !shuffle;
      shuffleButton.classList.toggle("is-active", shuffle);
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

    audio?.addEventListener("ended", nextTrack);
    renderTrack();
  }
})();
