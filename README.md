# spartan-x125.github.io

Personal homepage built with [Astro](https://astro.build/).

## Desktop interface

The original blog cards, typography, wallpapers and colors now live in a niri-inspired horizontal tiling desktop. Internal pages open as separate windows, with independent reading and comments. Click a window to focus it; use its titlebar buttons to close, enter fullscreen or open window actions. Fullscreen fills the workspace in both dimensions and restores the original tile on exit, without reloading the article. Drag a titlebar to another window's top or bottom edge to stack it, to its left or right edge to insert a column, or to its center to exchange positions. A shaded region previews the drop. After moving, column widths fit the viewport and stacked windows share the available height; extra columns remain horizontally scrollable. Dropping into an empty gap creates a column, and dropping onto a workspace button moves the window there. All four borders and four corners resize windows; shared borders adjust neighboring tiles. Horizontal scrolling / Shift + wheel moves across the workspace.

The bar follows the [Noctalia default layout](https://github.com/noctalia-dev/noctalia/blob/main/example.toml). Its control center retains light/dark mode, hue, card opacity, wallpaper blur and opacity, and adds wallpaper brightness, bar opacity, adjustable bar blur (0-40px) and top/bottom/left/right bar placement. Bar colors follow the current wallpaper by default, using a local dominant-color sample; a custom color picker overrides this. Preferences are saved locally, including migration of existing appearance settings. Three workspaces are available initially, represented by animated capsules with distinct active colors. Capsules align horizontally on the top/bottom bar and vertically on the left/right bar; the active capsule grows smoothly along that axis. Capsules are about 10.7px thick with 10px gaps. The clock also rotates vertically on the side bars. A trailing empty workspace is added when needed. The wallpaper button sits beside the clock and opens a 3-by-3 thumbnail picker with pages for all wallpapers. Selection updates the wallpaper and its bar palette without closing the picker. Battery level and charging state follow the browser's Battery Status API, with 100% as the fallback when it is unavailable.

Bar panels grow from their triggering button with a brief spring animation. The entire bar-facing edge of the panel joins the bar as one borderless surface. Rounded shoulders are wider at the bar and taper into the panel; the facing panel corners stay square within the shared surface. A single masked background paints the bar, rounded shoulders and panel with exactly the same color, opacity and configurable backdrop blur. Its shape grows and retracts around the same origin as the panel content; the bar stays fixed. The same layer paints the bar when panels are closed, so opening a panel does not change its size, brightness, blur or highlight. They stay anchored on all four bar edges and leave the desktop visible and usable. Panels have no close button. Click the corresponding bar button again or outside the bar/panel surface to close; Esc and selecting panel content keep it open; a different panel button switches panels. Keyboard shortcuts open panels without toggling them closed. The music player and calendar are only available through these panels. Neither opens a separate desktop window or appears on initial load.

Buttons, links, panels, workspaces and opening/moving windows have brief transitions, respecting reduced-motion preferences. Decorative captions and preview descriptions are removed. Closing every window leaves a clear wallpaper, without an empty-workspace launcher prompt or a close-window notification.

The homepage initially opens only the shell, at half the desktop workspace width and the full available height. The shell uses a 50% opaque black background without backdrop blur, leaving wallpaper details visible while keeping text legible. Fastfetch shows the avatar, website and contact links, statistics, and an English hint to type `help`. The avatar heading opens About in a separate terminal card.

All browseable pages have terminal versions: `home`, `posts`, `about`, `friends`, `guestbook`, `updates`, and individual articles with `read <slug>` or `read <number>`. Page commands, `open <path>`, and directory entries open separate terminal cards, preserving the original shell's output and command history. `open --gui <path>` opens the original graphical window. The launcher and bar links continue opening graphical pages. `ls posts` lists article numbers and slugs. Article content comes from the same Markdown modules as the graphical pages through a generated static `terminal-data.json`; draft posts remain excluded.

The terminal browser has a directory list, selection preview, article reader, search, heading outline and link picker. Use j/k or Up/Down to select and scroll, Right/Enter to open, Left to return to the parent page, / to search, Space/b or PageDown/PageUp to page, g/G for first/last or start/end, t for headings, l for links, and n/N for search matches. q/Esc closes the reader and returns focus to its originating card; Ctrl+C returns to the shell. The footer shows applicable shortcuts. Mouse selection, double-click, links and back/exit buttons are available too. Mouse actions on the window, titlebar or bar restore the active shell focus, so keyboard browsing continues after using the mouse. On guestbook and article readers, c loads the existing live Giscus discussion; its sign-in and posting controls remain keyboard-accessible with Tab.

Help follows the [Bash help/manual structure](https://www.gnu.org/s/bash/manual/html_node/Bash-Builtins.html): grouped command descriptions, syntax, examples and keyboard guidance. `help <command>` and `man <command>` show detailed manuals; `help -s`, `help -d` and `help -m` select syntax, description or manual output. Up/Down recall history, Tab completes commands and paths, Ctrl+L clears output, and Ctrl+C cancels input. Quoted arguments are supported. This interface only navigates blog content and never executes commands on the visitor's operating system.

Dangerous-looking commands such as `rm -rf /*`, `sudo rm -rf /`, disk-format commands and the classic fork bomb first flood the shell with simulated Linux permission, busy-device and read-only-filesystem errors. The desktop then briefly loses its signal and enters a fictional BIOS recovery screen with a deep-blue background, monospace text, boot-device diagnostics and a missing-boot-loader error. This is a visual Easter egg; no files or appearance preferences are deleted. Refresh, press R or Enter, or choose Restart to restore the initial desktop. Reduced-motion preferences remove the signal-loss animation.

Every launcher page can be opened repeatedly as independent windows. The browser entry and `browser [URL]` command open cards with an address bar, back/forward controls and reload. Graphical and terminal friend links open these browser cards; terminal selection or hover shows a locally stored homepage screenshot from `public/friend-previews/`, without loading the external website. Screenshot paths are configured in `src/data/friendLinks.ts`; replace the corresponding WebP image to refresh a preview. The top-right external-link button opens the current address in a real browser tab. Browsers cannot embed sites that forbid frames or HTTPS pages that require insecure HTTP resources; the external-link button remains available for those sites. Cross-origin navigation inside an external page cannot be inspected, so its address bar retains the last requested address; navigations made with the card's own address bar always update it.

`stars` opens a card at a random tiling position. It selects observations from the public NASA Image and Video Library across nebulae, galaxies, star clusters, supernova remnants, pulsars, gravitational lenses, comets and planets, rather than a fixed list of nearby objects. Introductions retain the archive's original language and provide the archive record, original photograph and credit. Slow or unavailable NASA requests fall back to a bundled six-object catalogue with local photographs. The implementation uses the [NASA library's public CORS API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) without an API key.

On screens up to 700px wide, windows flow vertically in one scrollable column. Workspace switching, workspace creation and workspace movement are disabled and their controls are hidden. On larger screens, horizontal tiling and the desktop workspaces remain available. Resizing from desktop to mobile brings existing windows into the single visible workspace.

Desktop workspaces keep at least three slots and one trailing empty slot. Extra empty workspaces are reclaimed after closing or moving windows and switching workspaces. The current empty workspace stays active until the visitor leaves it, so cleanup does not unexpectedly switch their view.

Mobile uses its own portrait wallpaper library in `public/backgrounds/mobile`; desktop uses the original landscape library. Selections and automatic-change timestamps are stored separately for each library. Both use the same paged 3-by-3 picker, ten-minute automatic changes, wallpaper-derived bar colors and animation setting. The control center offers fade, slide, wipe, zoom, random, or no animation. Reduced-motion preferences disable wallpaper animations.

Internal navigation, archive filters and window focus keep the outer browser URL at `/` and the tab title at `Spartan_x`. The actual static article routes remain available for incoming links and embedded graphical pages. Refreshing the root starts a fresh shell desktop.

Control-center sliders use explicit tracks and thumbs with no native padding; their visible track endpoints match the thumb centers at the minimum and maximum.

Scrollable cards retain a floating back-to-top button inside their window. Article windows also have an independent floating table of contents, with reading progress and current-section highlighting, based on the former mobile controls.

The launcher lists pages and desktop functions, without individual article entries or a visible title. Functional entries, window controls and appearance settings use a shared set of SVG line icons.

The default web shortcut preset uses Ctrl + Alt + Shift to reduce collisions with common desktop shortcuts. For example, T opens a shell, Q closes a window, S opens the control center, V opens shortcut settings, arrows change focus, and 1–9 switch workspaces. Moving a column to a workspace uses Ctrl + Alt + 1–9. Shortcut settings support recording a custom binding for every action, duplicate-binding feedback, individual reset/disable, and restoring the preset. Preferences are saved locally. The guide and bar tooltips follow the effective bindings. Global shortcuts are captured before terminal input and forwarded from embedded graphical pages.

The optional niri preset uses Super/Win or Alt (selectable in shortcut settings):

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

Shortcut settings also offer an explicit fullscreen [Keyboard Lock](https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock) request when supported. Browser permission and operating-system restrictions still apply; a website cannot override every system shortcut. Exit fullscreen with the same button or the browser's escape gesture. The bar audio control operates the blog music player. Niri's comma binding is retained, with Noctalia settings accessible through Mod + S. Bar refers to the desktop bar and its panels; shell refers to the terminal interface.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Shortcut routing checks:

```sh
node scripts/check-shortcuts.mjs
node scripts/check-desktop-functions.mjs
node scripts/check-stars.mjs
node scripts/check-wallpaper-import.mjs
```

Double-click `update-wallpapers.bat` in the project root to import wallpapers from `C:\img` (desktop) and `C:\竖屏img` (mobile), update both wallpaper lists and rebuild `docs`. Both libraries use lossless WebP at the original dimensions, with no resizing or lossy compression. The first run migrates old desktop originals and regenerates the previously compressed mobile wallpapers from their original source files. Local source images stay untouched. The source folders decide which library an image belongs to.

The script requires Node.js. If project dependencies are missing, the double-click entry installs them automatically. A finished run leaves the changes ready to commit and push; it does not perform either Git action. Missing folders, unreadable images and build errors are shown in the console, which remains open. Successful imports are kept and failed images can be retried. JPG, JPEG, PNG, WebP, AVIF and GIF files directly inside each folder are supported; subfolders are ignored. Animation, orientation and ICC profiles are retained. `scripts/wallpaper-import-state.json` records source/output hashes: unchanged imports are skipped, changed sources or damaged outputs are regenerated. Files normally use `original-basename.webp`; colliding source basenames retain their original extension before `.webp`.

The same workflow is available from the terminal:

```sh
npm run import:wallpapers
```

To manually import an entire portrait folder instead, use the existing importer and synchronize the asset lists:

```sh
node scripts/import-mobile-wallpapers.mjs "C:\竖屏img"
npm run sync:assets
```
