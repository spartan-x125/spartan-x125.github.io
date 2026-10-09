# spartan-x125.github.io

Personal homepage built with [Astro](https://astro.build/).

## Desktop interface

The original blog cards, typography, wallpapers and colors now live in a niri-inspired horizontal tiling desktop. Internal pages open as separate windows, with independent reading and comments. Click a window to focus it; use its titlebar buttons to close, enter fullscreen or open window actions. Fullscreen fills the workspace in both dimensions and restores the original tile on exit, without reloading the article. Drag a titlebar to another window's top or bottom edge to stack it, to its left or right edge to insert a column, or to its center to exchange positions. A shaded region previews the drop. After moving, column widths fit the viewport and stacked windows share the available height; extra columns remain horizontally scrollable. Dropping into an empty gap creates a column, and dropping onto a workspace button moves the window there. All four borders and four corners resize windows; shared borders adjust neighboring tiles. Horizontal scrolling / Shift + wheel moves across the workspace.

The bar follows the [Noctalia default layout](https://github.com/noctalia-dev/noctalia/blob/main/example.toml). Its control center retains light/dark mode, hue, card opacity, wallpaper blur and opacity, and adds wallpaper brightness, bar opacity and top/bottom/left/right bar placement. Bar colors follow the current wallpaper by default, using a local dominant-color sample; a custom color picker overrides this. Preferences are saved locally, including migration of existing appearance settings. Three workspaces are available initially, represented by animated capsules with distinct active colors. A trailing empty workspace is added when needed. The wallpaper button sits beside the clock. Battery level and charging state follow the browser's Battery Status API, with 100% as the fallback when it is unavailable.

Bar panels expand from their triggering button with a connecting neck and a brief spring animation. They stay anchored on all four bar edges and leave the desktop visible and usable. The music player and calendar are only available through these panels. Neither opens a separate desktop window or appears on initial load.

Buttons, links, panels, workspaces and opening/moving windows have brief transitions, respecting reduced-motion preferences. Decorative captions and preview descriptions are removed. Closing every window leaves a clear wallpaper, without an empty-workspace launcher prompt or a close-window notification.

The blog terminal replaces the profile window on initial load and also opens with Mod + T or the launcher. It uses a translucent terminal background, monospaced text, colored shell prompts and a fastfetch layout with the profile avatar, aligned fields, a dashed separator and a 16-color ANSI palette. Site statistics include article/category/tag counts, uptime, word count and the latest update. Site information, GitHub and email links are included, and the fastfetch heading opens the About page. The `fastfetch` command displays it again; `clear` clears the output, Up/Down navigate command history, and Ctrl + L / Ctrl + C clear the screen or cancel input. This is a browser command interface for blog navigation.

Scrollable cards retain a floating back-to-top button inside their window. Article windows also have an independent floating table of contents, with reading progress and current-section highlighting, based on the former mobile controls.

The launcher lists pages and desktop functions, without individual article entries or a visible title. Functional entries, window controls and appearance settings use a shared set of SVG line icons.

Common shortcuts use Super/Win or Alt (selectable in the control center):

| Shortcut | Action |
| --- | --- |
| Mod + arrows / H J K L | Focus a column or stacked window |
| Mod + Ctrl + arrows / H J K L | Move a column or window |
| Mod + Q | Close the focused window |
| Mod + O | Window overview |
| Mod + D / Space | Launcher |
| Mod + S | Control center |
| Mod + 1–9 | Switch workspace |
| Mod + Ctrl + 1–9 | Move a column to a workspace |
| Mod + R / Shift + R | Cycle column widths |
| Mod + F / Shift + F | Maximize / fullscreen |
| Mod + comma / period | Stack / unstack windows |
| Mod + Shift + / | Full shortcut guide |

Alt is the alternative when Super/Win is reserved by the system or browser. The bar audio control operates the blog music player. Niri's comma binding is retained, with Noctalia settings accessible through Mod + S. Bar refers to the desktop bar and its panels; shell refers to the terminal interface.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```
