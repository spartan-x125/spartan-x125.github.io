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
    const setBackground = () => {
      const index = Math.floor(Math.random() * backgrounds.length);
      layer.style.backgroundImage = `url("${backgrounds[index]}")`;
    };
    setBackground();
    window.setInterval(setBackground, thirtyMinutes);
  }
})();
