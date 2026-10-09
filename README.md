# spartan-x125.github.io

Personal homepage built with [Astro](https://astro.build/).

## Desktop interface

The original blog cards, typography, wallpapers and colors now live in a niri-inspired horizontal tiling desktop. Internal pages open as separate windows, with independent reading and comments. Click a window to focus it; use its titlebar buttons to close, enter fullscreen or open window actions. Fullscreen fills the workspace in both dimensions and restores the original tile on exit, without reloading the article. Drag a titlebar to another window's top or bottom edge to stack it, to its left or right edge to insert a column, or to its center to exchange positions. A shaded region previews the drop. After moving, column widths fit the viewport and stacked windows share the available height; extra columns remain horizontally scrollable. Dropping into an empty gap creates a column, and dropping onto a workspace button moves the window there. All four borders and four corners resize windows; shared borders adjust neighboring tiles. Horizontal scrolling / Shift + wheel moves across the workspace.

The bar follows the [Noctalia default layout](https://github.com/noctalia-dev/noctalia/blob/main/example.toml). Its control center retains light/dark mode, hue, card opacity, wallpaper blur and opacity, and adds wallpaper brightness, bar opacity and top/bottom/left/right bar placement. Bar colors follow the current wallpaper by default, using a local dominant-color sample; a custom color picker overrides this. Preferences are saved locally, including migration of existing appearance settings. Three workspaces are available initially, represented by animated capsules with distinct active colors. Capsules align horizontally on the top/bottom bar and vertically on the left/right bar; the active capsule grows smoothly along that axis. Capsules are about 10.7px thick with 10px gaps. The clock also rotates vertically on the side bars. A trailing empty workspace is added when needed. The wallpaper button sits beside the clock. Battery level and charging state follow the browser's Battery Status API, with 100% as the fallback when it is unavailable.

Bar panels grow from their triggering button with a brief spring animation. The entire bar-facing edge of the panel joins the bar as one borderless surface. Rounded shoulders are wider at the bar and taper into the panel; the facing panel corners stay square within the shared surface. A single masked background paints the bar, rounded shoulders and panel with exactly the same color, opacity and 18px backdrop blur. Its shape grows and retracts around the same origin as the panel content; the bar stays fixed. They stay anchored on all four bar edges and leave the desktop visible and usable. Panels have no close button and remain open after outside clicks, Esc or selecting content. Click the corresponding bar button again to close; a different panel button switches panels. Keyboard shortcuts open panels without toggling them closed. The music player and calendar are only available through these panels. Neither opens a separate desktop window or appears on initial load.

Buttons, links, panels, workspaces and opening/moving windows have brief transitions, respecting reduced-motion preferences. Decorative captions and preview descriptions are removed. Closing every window leaves a clear wallpaper, without an empty-workspace launcher prompt or a close-window notification.

The homepage initially opens only the shell, at half the desktop workspace width and the full available height. The shell uses a 50% opaque black background without backdrop blur, leaving wallpaper details visible while keeping text legible. Fastfetch shows the avatar, website and contact links, statistics, and an English hint to type `help`. The avatar heading opens the terminal About reader.

All browseable pages have terminal versions: `home`, `posts`, `about`, `friends`, `guestbook`, `updates`, and individual articles with `read <slug>` or `read <number>`. `open <path>` stays inside the shell; `open --gui <path>` opens the original graphical window. The launcher and bar links continue opening graphical pages. `ls posts` lists article numbers and slugs. Article content comes from the same Markdown modules as the graphical pages through a generated static `terminal-data.json`; draft posts remain excluded.

The terminal browser has a directory list, selection preview, article reader, search, heading outline and link picker. Use j/k or arrows to select and scroll, Enter to open, / to search, Space/b or PageDown/PageUp to page, g/G for first/last or start/end, t for headings, l for links, n/N for search matches, and q/Esc to return. Ctrl+C leaves the browser. The footer shows applicable shortcuts. Mouse selection, double-click, links and back/exit buttons are available too. Mouse actions on the window, titlebar or bar restore the active shell focus, so keyboard browsing continues after using the mouse. On guestbook and article readers, c loads the existing live Giscus discussion; its sign-in and posting controls remain keyboard-accessible with Tab.

Help follows the [Bash help/manual structure](https://www.gnu.org/s/bash/manual/html_node/Bash-Builtins.html): grouped command descriptions, syntax, examples and keyboard guidance. `help <command>` and `man <command>` show detailed manuals; `help -s`, `help -d` and `help -m` select syntax, description or manual output. Up/Down recall history, Tab completes commands and paths, Ctrl+L clears output, and Ctrl+C cancels input. Quoted arguments are supported. This interface only navigates blog content and never executes commands on the visitor's operating system.

Dangerous-looking commands such as `rm -rf /*`, `sudo rm -rf /`, disk-format commands and the classic fork bomb trigger a fictional boot failure and kernel panic. This is a visual Easter egg; no files or appearance preferences are deleted. Refresh, press R or choose Reboot to restore the initial desktop. The `reboot` command also starts a fresh session.

On screens up to 700px wide, windows flow vertically in one scrollable column. Workspace switching, workspace creation and workspace movement are disabled and their controls are hidden. On larger screens, horizontal tiling and the desktop workspaces remain available. Resizing from desktop to mobile brings existing windows into the single visible workspace.

Internal navigation, archive filters and window focus keep the outer browser URL at `/` and the tab title at `Spartan_x`. The actual static article routes remain available for incoming links and embedded graphical pages. Refreshing the root starts a fresh shell desktop.

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
