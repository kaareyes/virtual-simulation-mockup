# Virtual Ecosystem Simulation (Mt. Agad-Agad)

An offline, localized virtual simulation of ecosystems for science lessons: **Trophic Levels** and **Transfer of Energy**.
Plain HTML, CSS and JavaScript. No framework, no Node.js, no server, no internet, no install.

Repository: <https://github.com/kaareyes/virtual-simulation-mockup>

---

## 1. Download from GitHub

**Option A – ZIP (no tools needed)**

1. Open <https://github.com/kaareyes/virtual-simulation-mockup>.
2. Click the green **Code** button → **Download ZIP**.
3. **Extract** (unzip) the file. Do not run it from inside the ZIP.

**Option B – Git**

```bash
git clone https://github.com/kaareyes/virtual-simulation-mockup.git
cd virtual-simulation-mockup
```

## 2. How to start the project

1. Open the extracted folder.
2. **Double-click `index.html`** (or drag it into Chrome / Edge / Firefox / Safari). That is the student app.
3. For teachers / admins, open **`admin.html`**. Default PIN: `1234` (change it in *App Settings*).

That's all: there is nothing to install or build. It works with no internet connection.

> **Best browser:** Chrome or Edge (can save straight to the JSON files). Firefox and Safari work too, but
> use Import / Export for the JSON files (see section 6).

### Student flow

`Home → START → What we will learn → lesson steps`

| Lesson | Steps |
|---|---|
| Trophic Levels | Explore pyramid → Arrange organisms (drag & drop) → Ecosystem simulation |
| Transfer of Energy | Explore (100 / 10 / 1 / 0.1 / 0.01 %) → Arrange organisms → Arrange energy values → Energy-transfer animation |

Mouse, touch and keyboard are supported (tap/Enter an item, then tap/Enter a level). The header has the lesson
picker, ecosystem picker, **Language** (English / Filipino / Bisaya), **Sound** and **Home**.

---

## 3. Manage organisms (Admin → Organisms)

- **Add organism**: name, scientific name, trophic level, ecosystem, image (upload or path), description, hint,
  diet, prey (tick what it eats), starting population, reproduction rate, mortality rate, energy value, active.
- **Edit / View / Delete**: deleting shows a confirmation that lists everything that refers to the organism.
- **Search and filter** by name, ecosystem, trophic level and status; switch organisms on/off with the *Active* box.
- Replace the frog with another animal and it automatically changes in Explore, the drag-and-drop activities, the
  pyramids, the animation and the simulation. Nothing is hard-coded in the student app.

Other sections: **Ecosystems** (add/remove ecosystems, backgrounds, environment, pyramid labels), **Lessons**
(titles, objectives, enable/disable and reorder lessons and activities, hints, which organisms each activity uses),
**Simulation Settings**, **App Settings**.

**Remember to press `Save Changes`** (top right) after editing. The red/amber badge shows unsaved changes.

## 4. Run the simulations

*Trophic Levels → Ecosystem step*

- Use **− / +** beside each pyramid level (1–5) to set how many organisms there are, then **Play**.
- **Pause**, **Reset**, **x1/x2/x4** speed, and **All Producers ON/OFF** (simulates a drought).
- Changing a level while it runs adds/removes organisms on that day, so students see the effect on other levels.
- The graph shows population by day; hover it for values, or switch to “% of start” to see small populations.

*Transfer of Energy → last step* is a step-by-step animation (Play / Next / Back / Replay) showing sunlight, energy
passing up the pyramid, heat loss at each level, decomposers and **recycled nutrients**. Energy flows one way and is
lost as heat; nutrients are recycled.

Admin → **Simulation Settings** sets duration, speed, seed, growth/mortality, predation pressure, energy-transfer %,
and the environment (sunlight, rainfall, temperature). **Run preview** tests the settings and warns about extinctions.

### Model assumptions (simplified – not a scientific prediction)

- One update per simulated day (4 small sub-steps). Consumers reproduce in proportion to how much prey is available
  per consumer; prey are eaten in proportion to their abundance.
- Only ≈ the *energy-transfer %* (default 10 %) of what is eaten becomes new consumers.
- Producers grow logistically (limited space) and depend on sunlight and rainfall; temperature outside 18–32 °C
  raises mortality.
- The only randomness is a small daily variation drawn from a **seeded** generator, so the same settings + seed always
  give the same graph. No migration, disease, age structure or seasons.

---

## 5. The JSON database

All pages read the same JSON files in `data/`, which are the single source of truth:

```
data/
├── database.json            manifest (revision, counts)
├── organisms.json
├── ecosystems.json
├── lessons.json
├── simulation-settings.json
├── app-settings.json
└── default-data.js          bundled copy of the defaults (so the app works on first launch)
```

Browsers cannot `fetch()` local files from `file://`, so the pages load `default-data.js` with a normal `<script>` tag
and use the options below to read/write the real JSON files.

## 6. Saving, backup and restore (Admin → Database Manager)

| Browser | How changes reach the JSON files |
|---|---|
| Chrome / Edge | Click **Open Database Folder**, choose the project folder (or its `data` folder) once and allow access. **Save Changes** then writes the JSON files directly. The old files are copied to `data/backups/<time>/` first. |
| Firefox / Safari | No direct file writing. Edit, **Save Changes** (kept in this browser), then **Export JSON** and replace the files in `data/` (or share the exported file and **Import JSON** on the other computer). |

Other tools: **View JSON Records** (with record counts per file), **Import JSON** (validated; nothing changes if the
file is invalid), **Export JSON** (single file or separate files), **Backup Database** (download), **Restore Database**
(restore points kept in the browser, or from a file) and **Reset Default Database**. A restore point is created
automatically before every save, import, restore and reset. All destructive actions ask for confirmation.

Every record has a unique ID, duplicates are rejected, and data is validated before it is saved.

**To use the same data on other computers:** copy the whole folder (including `data/`), or export a backup and import it.

### Honest limitations

- Browser storage is local to one browser and one location. Pages opened with `file://` may get separate or temporary
  storage in some browsers, so the *browser copy* is not guaranteed to persist. The folder method (Chrome/Edge) or an
  exported JSON file is the reliable way to keep data. A warning is shown when storage is unavailable.
- Chrome/Edge ask for folder permission again in a new session; use **Reconnect folder** (admin) or the link on the
  student home page. Students can also use **Load database file** on the home page.
- Uploaded images are shrunk and stored inside the JSON as data URLs, so large uploads make the files bigger.
- The admin PIN is a convenience lock against accidental edits. It is stored as plain text in `app-settings.json`
  and is **not** real security.
- Scientific names and sample species are illustrative; check them against local species before formal use.

---

## 7. Project structure

```
index.html  admin.html
css/        main.css  student.css  admin.css
js/         database.js  organisms.js  ecosystems.js  lessons.js  drag-drop.js  pyramid.js
            activities.js  energy-flow.js  simulation.js  sim-view.js  app.js  admin.js  ui.js  i18n.js
data/       JSON database + default-data.js
assets/     organisms/ (illustrations)  backgrounds/
```

## 8. Quick test checklist

1. Open `index.html` and `admin.html` with the network disconnected – both load.
2. Admin: add, edit and delete an organism; add an ecosystem; change an organism’s trophic level; **Save Changes**.
3. Student: start a lesson; drag an organism to a correct and an incorrect level; finish the energy-value step.
4. Run the simulation (Play, Pause, Reset); complete the energy animation.
5. Refresh and confirm the changes persist (folder or browser copy). Export a JSON backup and import it again.
6. Browser dev tools → Network: no external requests are made.
