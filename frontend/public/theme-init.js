// Run before styles are painted. The same preference is used by ThemeProvider.
(() => {
  let preference = "system";
  try {
    const saved = localStorage.getItem("nova-salud-theme");
    if (["light", "dark", "system"].includes(saved)) preference = saved;
  } catch {}
  const theme =
    preference === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
