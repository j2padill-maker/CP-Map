# CP Scout — New Session Handoff Script
# Copy and paste this entire document into a new Claude conversation

---

## PROJECT OVERVIEW

I am building a web app called **CP Scout** (cp-scout.com) for cathodic protection (CP) field analysis. 
I am a cathodic protection electrician designing this tool for myself and fellow technicians at a San Diego utility. 
The app is live at cp-scout.com and hosted on GitHub at github.com/j2padill-maker/CP-Map.

CP Scout is a browser-based, multi-page web app with no backend. All data is stored in localStorage. 
Files are plain HTML with vanilla JavaScript — no frameworks. Each page is a standalone module.

---

## CURRENT FILE STRUCTURE

All files live in the root of the GitHub repo:

- index.html       — Landing page and nav hub
- map.html         — Interactive station map module (most developed)
- overview.html    — Survey data analysis module (actively being built)
- trends.html      — Placeholder (not yet built)
- field-entry.html — Placeholder (not yet built)
- report.html      — Placeholder (not yet built)

---

## COLOR SCHEME / UI STANDARDS

- Background: #3a3f44 (medium grey)
- Surface/sidebar: #2e3338
- Panel: #4a5058
- Teal accent: #4dd9e8 / #2aabb8 / #1a8090
- Text: #f0f4f5 (bright white)
- Font: Courier New monospace throughout
- Nav bar height: 48px, border-bottom: 2px solid teal
- All pages share the same nav bar with tabs: Overview | Map | Trends | Field Entry | Report

---

## DOMAIN KNOWLEDGE — CRITICAL LOGIC

### Millivolt Reading Rules
- "Low" means numerically higher (less negative): -0.350V is LOWER than -0.900V
- Off-read = rectifier OFF (less negative, reveals true pipe potential)
- On-read = rectifier ON (more negative, with applied current)
- First occurrence of an address in the spreadsheet = off-read
- Second occurrence = on-read
- Higher numeric value (less negative) = off-read (Math.max)
- Lower numeric value (more negative) = on-read (Math.min)

### Two Station Criteria Types
**100mV Criteria Stations (like Station 409):**
- Pass/fail determined by Lower Limit column from spreadsheet
- Failing = off-read numerically higher (less negative) than Lower Limit
- No fixed voltage threshold — relative to native pipe potential

**850mV Criteria Stations:**
- Any off-read above -0.850V = failing
- Hard absolute threshold

### Color Coding — Three Independent Scores, Worst Wins
1. THRESHOLD vs Lower Limit: failing = red
2. CYCLE FLUCTUATION (off-read drop from prior survey):
   - ≥35mV drop = red
   - 15-35mV drop = orange
   - 10-15mV drop = yellow
   - 0-10mV = green
   - Improving (more negative) = green with ★ icon
3. ON/OFF DIFFERENTIAL:
   - 0-25mV = red
   - 26-40mV = orange
   - 41-55mV = yellow
   - >55mV = green

### POD (Point of Drainage)
- Always closest test point to the rectifier
- Naturally shows high differential (>150mV) and healthy off-read
- Excluded from relative color scaling
- Labeled POD if confirmed, POD? if suspected
- Uses its own color scale — only fails if reads are genuinely bad

### Drop Alerts
- ≥35mV drop between cycles = flagged yellow
- ≥50mV drop = flagged red

---

## MAP.HTML — CURRENT STATE (FULLY FUNCTIONAL)

### Features Built:
- PDF upload and rendering via PDF.js CDN (no base64)
- Click-to-place test point pins with TP number and address entry
- Auto-incrementing TP numbers
- Edit pins (✏ button) without deleting and re-placing
- Delete pins (× button)
- Export pins to JSON file (💾 Export Pins button)
- Import pins from JSON file (📂 Import Pins button) — merges or replaces
- Spreadsheet upload (XLSX/CSV) via XLSX.js CDN
- Apply Data → Recolor — colors circles based on data
- Dynamic color-coded circles (red/orange/yellow/green) with opacity overlay
- Hover tooltip showing TP number, address, off/on reads, differential
- Click detail popup with full explanation and color reasoning
- Critical Areas panel at bottom of sidebar listing red-coded pins
- Rectifier marker (⚡ gold pulsing circle) placed in Rectifier mode
- POD auto-detection — closest pin to rectifier gets POD or POD? badge
- Rectifier sidebar panel showing voltage and amp reads
- Legend toggle (▲ Legend button on map)
- Zoom controls (−, %, +, Fit)
- 2x resolution PDF rendering for sharp street names when zoomed
- localStorage persistence for pins (key: cp409_v2_pins), rectifier (key: cp409_rectifier)
- Legacy storage key fallback (cp409_pins)

### Storage Keys (map.html):
- cp409_v2_pins — array of pin objects
- cp409_rectifier — rectifier position and reads
- Each pin: {id, tpNum, address, x, y, color, offRead, onRead, diff, isPOD, isPODSuspected}

### Known Remaining Issues:
- Zoom coordinate alignment occasionally needs verification after DPR fix
- Station type (100mV vs 850mV) not yet stored per-station

---

## OVERVIEW.HTML — CURRENT STATE (FUNCTIONAL, BEING REFINED)

### Features Built:
- Spreadsheet upload — handles both Book1 (7-col technician format) and Book2 (full master format)
- Auto column detection by header name
- On/off detection: uses Present Read IO/ON flag if available, falls back to numeric rule
- Lower Limit column parsed directly for pass/fail threshold
- Three-score system (threshold, fluctuation, differential) — worst score wins
- Summary cards: survey cycles, test points, critical/high/monitor/passing counts, cycle drops
- Alert groups: collapsible sections sorted by severity
- Each card shows: TP, address, off-read, on-read, on/off gap, limit, vs-prior delta
- Expandable card detail with:
  - Plain-English explanation (3 separate sections: threshold, fluctuation, differential)
  - Pass/Fail status with Lower Limit value
  - Drop alerts panel
  - Survey cycle history bar chart
- POD detection and green POD badge
- Improving reads flagged with ★ icon
- Bottom quartile logic when no Lower Limit available (orange flag with explanation)
- localStorage persistence for survey data (key: cp409_surveyData, cp409_surveyFileName)
- Auto-loads and analyzes cached data on page load
- ✕ Clear Data button to reset

### Column Detection (both formats):
Book1 headers: Area, Point, Location, City, Read, Read By, Read Date
Book2 adds: Lower Limit, Upper Limit, Measurement Point Characteristic Name (IO/ON flag)

### Known Issues Being Fixed:
- Individual column indicator colors (off-read, differential) should reflect their own score
  independently of the overall card color — this was being refined
- Explanation text was updated to remove old relative-ranking language
- All explanation text now uses the correct threshold values (55mV for differential, not 60mV)

---

## SPREADSHEET DATA FORMAT

### Book1 (Technician Format — 7 columns):
Area | Point | Location | City | Read | Read By | Read Date

### Book2 (Master Format — 32 columns):
Includes all Book1 columns plus Lower Limit, Upper Limit, 
Measurement Point Characteristic Name (contains "Present Read IO" or "Present Read ON")

### Station 409 Test Points (for reference):
TP 1  — 1035 Reef Dr          | Limit: -0.520V
TP 2  — 704 Hawaii Ave         | Limit: varies
TP 3  — 3502 Lindbergh St      | Limit: -0.486V
TP 4  — 3785 Lindbergh St      | Limit: -0.513V
TP 5  — 720 Norstad St         | Limit: -0.526V
TP 6  — 3490 Rosa Linda St     | Limit: -0.533V
TP 7  — 1548 Kenalan Dr        | Limit: -0.520V
TP 8  — 4121 Alcorn St         | Limit: -0.475V
TP 9  — 4265 Marzo St          | Limit: -0.453V
TP 10 — varies                 
TP 11 — 780 Kostner Dr         | Limit: -0.458V
TP 12 — 4410 Murrieta Circle   | Limit: -0.498V
TP 13 — 1042 Twining Ave       
TP 14 — 987 Piccard Ave        | POD — Point of Drainage (rectifier location: Arey & Piccard)
TP 15 — MSA@Montgomery Adult School X from 645 Beyer Wy n/o Palm

Rectifier: 995 Piccard Ave / Arey Dr intersection

---

## WHAT WAS BEING BUILT NEXT

### Immediate Next Feature: Station Library (stations.html)
A dedicated page for saving and loading complete station packages. Discussed but not yet built.

**Planned approach — File-Based (no backend required):**
- Export entire station as single JSON package: pins + rectifier + lower limits + station type + cached survey data
- Import restores everything instantly
- Technicians share station files via OneDrive/SharePoint folder
- Station library page shows all saved stations with metadata
- New Station setup wizard

**Station package JSON structure (proposed):**
{
  version: 1,
  stationNumber: "409",
  stationName: "CP Station 409",
  criteriaType: "100mV",  // or "850mV"
  lastUpdated: "2026-04-25",
  rectifier: { x, y, address, volt, amp },
  pins: [ array of pin objects ],
  lowerLimits: { "1": -0.520, "3": -0.486, ... },
  surveyDataCache: [ raw rows array ]
}

---

## BUSINESS CONTEXT

- App is live at cp-scout.com (GitHub Pages, public repo)
- Domain purchased at Namecheap for $11.18/year
- No backend, no database, no login currently
- Company uses SAP, GIS (ESRI), SharePoint, Microsoft 365
- SharePoint integration proposal document was created (Word doc)
- Security concerns identified: Azure AD auth, data classification, NERC/TSA compliance,
  third-party app vetting, GitHub hosting concerns, audit logging
- Valuation discussed: $25K-$500K depending on development stage and buyer

---

## NEXT SESSION PRIORITIES (in order)

1. Fix any remaining column color indicator issues in overview.html
2. Build stations.html — station library with export/import
3. Update map.html and overview.html to save into station package format
4. Add station type selector (100mV vs 850mV) to station setup
5. Add store-limits-from-Book2 feature so Book1 uploads use correct thresholds
6. Begin trends.html — historical MV potential charts per test point
7. Eventually: Azure AD authentication, SharePoint connector

---

## IMPORTANT PATTERNS AND PREFERENCES

- Jason iterates through direct feedback — build first, refine based on what he sees
- Each page is a standalone HTML file — no shared CSS files, no frameworks
- No base64 for images — always load from file upload or CDN
- localStorage for all persistence — no backend
- Efficiency is critical — avoid bloated code that causes session timeouts
- Work on ONE file per session where possible
- After building, always copy to /mnt/user-data/outputs/ and use present_files tool
- Color scheme: grey backgrounds (#3a3f44), teal accents (#4dd9e8), bright white text
- Font: Courier New monospace throughout
- Jason's GitHub: j2padill-maker | Repo: CP-Map | Live: cp-scout.com
