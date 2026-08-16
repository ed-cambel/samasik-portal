document.body.insertAdjacentHTML('beforeend', `

    <body>
        <div class="page">
            <div class="calendar-app">
                <div class="cal-header">
                    <div class="cal-nav">
                        <button class="nav-btn" id="prevMonth" aria-label="Previous month">‹</button>
                        <h2 id="monthLabel">Month Year</h2>
                        <button class="nav-btn" id="nextMonth" aria-label="Next month">›</button>
                        <button class="today-btn" id="todayBtn">Today</button>
                    </div>
                    <div class="cal-actions">
                        <div class="legend" id="legend"></div>
                        <button class="btn-primary" id="addEventBtn">+ Add event</button>
                    </div>
                </div>

                <div class="cal-weekdays">
                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                <div class="cal-grid" id="calGrid"></div>
            </div>
        </div>

        <!-- Add / Edit event modal -->
        <div class="modal-overlay hidden" id="eventModal">
            <div class="modal">
                <button class="modal-close" id="modalClose" aria-label="Close">&times;</button>
                <h3 id="modalTitle">Add event</h3>
                <form id="eventForm">
                    <input type="hidden" id="evtId">
                    <label>Title
                        <input type="text" id="evtTitle" required maxlength="80" placeholder="e.g. General Assembly">
                    </label>
                    <label>Category
                        <select id="evtCategory"></select>
                    </label>
                    <div class="date-row">
                        <label>Start date
                            <input type="date" id="evtStart" required>
                        </label>
                        <label>End date <span class="field-hint">(optional)</span>
                            <input type="date" id="evtEnd">
                        </label>
                    </div>
                    <label>Description <span class="field-hint">(optional)</span>
                        <textarea id="evtDesc" rows="3" maxlength="300" placeholder="Details, venue, notes..."></textarea>
                    </label>
                    <p class="form-error" id="formError"></p>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="cancelBtn">Cancel</button>
                        <button type="submit" class="btn-primary" id="saveBtn">Save event</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- View event modal -->
        <div class="modal-overlay hidden" id="viewModal">
            <div class="modal">
                <button class="modal-close" id="viewModalClose" aria-label="Close">&times;</button>
                <span class="cat-pill" id="viewCatPill"></span>
                <h3 id="viewTitle"></h3>
                <p class="view-dates" id="viewDates"></p>
                <p id="viewDesc"></p>
                <div class="modal-actions">
                    <button class="btn-danger" id="deleteBtn">Delete</button>
                    <button class="btn-secondary" id="editBtn">Edit</button>
                </div>
            </div>
        </div>

        <!-- Password gate modal (used before add / edit / delete) -->
        <div class="modal-overlay hidden" id="pwModal">
            <div class="modal modal-sm">
                <button class="modal-close" id="pwModalClose" aria-label="Close">&times;</button>
                <h3 id="pwTitle">Enter editor password</h3>
                <form id="pwForm">
                    <input type="password" id="pwInput" required autocomplete="off" placeholder="••••••••">
                    <p class="form-error" id="pwError"></p>
                    <p class="pw-note">Restricted access: only Execom are allowed these functions.</p>
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" id="pwCancel">Cancel</button>
                        <button type="submit" class="btn-primary">Confirm</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="event-tooltip hidden" id="tooltip"></div>
        </body>
    `);


const CONFIG = {
    demoPasswords: {
        add: "add2026",
        edit: "edit2026",
        delete: "delete2026",
    },

    apiUrl: "https://script.google.com/macros/s/AKfycbx-53U5neOwoZqZeKxIYBYDvfAvOsI2fiqD9TV-uKZpE7vc_tTtAOUICxFE4GzIeIP3nA/exec",

    categories: [
        { id: "upvcalendar", label: "UPV Calendar", color: "#7B1113" },
        { id: "samasik", label: "Psychology/SamaSik Event", color: "#fabed4" },
        { id: "redbolt", label: "Redbold Event", color: "#e6194B" },
        { id: "birthday", label: "Birthday", color: "#dcbeff" },
        { id: "posting", label: "Posting", color: "#3cb44b" },
        { id: "meeting", label: "Meeting", color: "#4363d8" },
        { id: "holiday", label: "Holiday/Commemoration", color: "#f58231" },
    ],
};

function categoryOf(id) {
    return CONFIG.categories.find(c => c.id === id) || CONFIG.categories[0];
}

const STORAGE_KEY = "samasik_calendar_events_v1";

function seedEvents() {
    const y = new Date().getFullYear(), m = new Date().getMonth();
    const d = (offset) => {
        const dt = new Date(y, m, 1 + offset);
        return dt.toISOString().slice(0, 10);
    };
    return [
        { id: cryptoId(), title: "Execom Meeting", category: "meeting", start: d(2), end: d(2), description: "Monthly execom sync, function room B." },
        { id: cryptoId(), title: "GPOA Submission Deadline", category: "deadline", start: d(9), end: d(9), description: "Submit GPOA to the OSA." },
        { id: cryptoId(), title: "General Assembly", category: "event", start: d(13), end: d(15), description: "3-day GA, main covered court." },
        { id: cryptoId(), title: "Foundation Week", category: "holiday", start: d(20), end: d(24), description: "No classes / org activities on campus." },
        { id: cryptoId(), title: "Elections Announcement", category: "announcement", start: d(6), end: d(6), description: "Comelec posts the final candidate list." },
    ];
}

function cryptoId() {
    return "e_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function loadEvents() {
    if (CONFIG.apiUrl) {

        const res = await fetch(CONFIG.apiUrl);
        return await res.json();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const seeded = seedEvents();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }
    return JSON.parse(raw);
}

async function persistAll(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

async function createEvent(evt, password) {
    if (CONFIG.apiUrl) {

        const res = await fetch(CONFIG.apiUrl, {
            method: "POST",
            body: JSON.stringify({ action: "create", password, ...evt }),
        });
        return await res.json(); // { ok: true, id } or { ok:false, error }
    }
    const events = await loadEvents();
    const record = { ...evt, id: cryptoId() };
    events.push(record);
    await persistAll(events);
    return { ok: true, id: record.id };
}

async function updateEvent(id, evt, password) {
    if (CONFIG.apiUrl) {
        const res = await fetch(CONFIG.apiUrl, {
            method: "POST",
            body: JSON.stringify({ action: "update", id, password, ...evt }),
        });
        return await res.json();
    }
    const events = await loadEvents();
    const idx = events.findIndex(e => e.id === id);
    if (idx === -1) return { ok: false, error: "Event not found" };
    events[idx] = { ...events[idx], ...evt };
    await persistAll(events);
    return { ok: true };
}

async function deleteEvent(id, password) {
    if (CONFIG.apiUrl) {
        const res = await fetch(CONFIG.apiUrl, {
            method: "POST",
            body: JSON.stringify({ action: "delete", id, password }),
        });
        return await res.json();
    }
    const events = await loadEvents();
    const next = events.filter(e => e.id !== id);
    await persistAll(next);
    return { ok: true };
}

async function checkPassword(pw, type) {
    if (CONFIG.apiUrl) {
        const res = await fetch(CONFIG.apiUrl, {
            method: "POST",
            body: JSON.stringify({ action: "verify", type, password: pw }),
        });
        const data = await res.json();
        return data.ok === true;
    }
    return pw === CONFIG.demoPasswords[type];
}

const state = {
    cursor: startOfMonth(new Date()),  // first day of the visible month
    events: [],                        // [{id,title,category,start,end,description}]
    pendingAction: null,               // fn to run once a password is confirmed
    pendingType: null,                 // "add" | "edit" | "delete" — which password to check
    editingId: null,                   // id currently open in Add/Edit modal
    actionPassword: null,              // password just confirmed, carried into the create/update call
};

function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function toKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function parseDateKey(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtDate(d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }

function getMonthMatrix(year, month) {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const start = addDays(first, -first.getDay());
    const end = addDays(last, 6 - last.getDay());
    const weeks = [];
    let cur = start;
    while (cur <= end) {
        const week = [];
        for (let i = 0; i < 7; i++) { week.push(cur); cur = addDays(cur, 1); }
        weeks.push(week);
    }
    return weeks;
}

function assignTracks(events, weekStart, weekEnd) {
    const segs = events
        .filter(e => e.endD >= weekStart && e.startD <= weekEnd)
        .map(e => {
            const clipStart = e.startD < weekStart ? weekStart : e.startD;
            const clipEnd = e.endD > weekEnd ? weekEnd : e.endD;
            return {
                event: e,
                startCol: Math.round((clipStart - weekStart) / 86400000),
                endCol: Math.round((clipEnd - weekStart) / 86400000),
                continuesBefore: e.startD < weekStart,
                continuesAfter: e.endD > weekEnd,
            };
        })
        .sort((a, b) => a.startCol - b.startCol || (b.endCol - b.startCol) - (a.endCol - a.startCol));

    const tracks = [];
    segs.forEach(seg => {
        let placed = false;
        for (let t = 0; t < tracks.length; t++) {
            const overlaps = tracks[t].some(s => seg.startCol <= s.endCol && seg.endCol >= s.startCol);
            if (!overlaps) { tracks[t].push(seg); seg.track = t; placed = true; break; }
        }
        if (!placed) { tracks.push([seg]); seg.track = tracks.length - 1; }
    });
    return { segs, trackCount: Math.max(tracks.length, 1) };
}

function renderLegend() {
    const legend = document.getElementById("legend");
    legend.innerHTML = CONFIG.categories.map(c =>
        `<span class="legend-item"><span class="legend-dot" style="background:${c.color}"></span>${c.label}</span>`
    ).join("");
}

function renderMonthLabel() {
    document.getElementById("monthLabel").textContent =
        state.cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function renderCalendar() {
    renderMonthLabel();
    const grid = document.getElementById("calGrid");
    grid.innerHTML = "";

    const year = state.cursor.getFullYear();
    const month = state.cursor.getMonth();
    const weeks = getMonthMatrix(year, month);
    const today = new Date();


    const events = state.events.map(e => ({
        ...e,
        startD: parseDateKey(e.start),
        endD: parseDateKey(e.end || e.start),
    }));

    weeks.forEach(week => {
        const weekStart = week[0], weekEnd = week[6];
        const { segs, trackCount } = assignTracks(events, weekStart, weekEnd);

        const weekRow = document.createElement("div");
        weekRow.className = "week-row";
        weekRow.style.gridTemplateRows = `26px repeat(${trackCount}, 20px) 6px`;


        week.forEach((day, colIdx) => {
            const cell = document.createElement("div");
            cell.className = "day-cell";
            if (day.getMonth() !== month) cell.classList.add("other-month");
            if (isSameDay(day, today)) cell.classList.add("is-today");
            cell.style.gridColumn = colIdx + 1;
            cell.innerHTML = `<span class="day-num">${day.getDate()}</span>`;
            weekRow.appendChild(cell);
        });


        segs.forEach(seg => {
            const cat = categoryOf(seg.event.category);
            const bar = document.createElement("div");
            bar.className = "event-bar";
            if (!seg.continuesBefore) bar.classList.add("seg-start");
            if (!seg.continuesAfter) bar.classList.add("seg-end");
            bar.style.gridColumn = `${seg.startCol + 1} / ${seg.endCol + 2}`;
            bar.style.gridRow = seg.track + 2; // +1 for date row, +1 for 1-index
            bar.style.background = cat.color;
            bar.dataset.id = seg.event.id;
            bar.textContent = (seg.continuesBefore ? "◂ " : "") + seg.event.title + (seg.continuesAfter ? " ▸" : "");

            bar.addEventListener("click", () => openViewModal(seg.event.id));
            bar.addEventListener("mouseenter", (ev) => showTooltip(ev, seg.event));
            bar.addEventListener("mousemove", positionTooltip);
            bar.addEventListener("mouseleave", hideTooltip);

            weekRow.appendChild(bar);
        });

        grid.appendChild(weekRow);
    });
}

async function refresh() {
    state.events = await loadEvents();
    renderCalendar();
}

const tooltipEl = document.getElementById("tooltip");

function showTooltip(ev, evt) {
    const cat = categoryOf(evt.category);
    const dateLabel = evt.end && evt.end !== evt.start
        ? `${fmtDate(parseDateKey(evt.start))} – ${fmtDate(parseDateKey(evt.end))}`
        : fmtDate(parseDateKey(evt.start));
    tooltipEl.innerHTML = `
    <div class="tt-title">${escapeHtml(evt.title)}</div>
    <div class="tt-meta">${cat.label} · ${dateLabel}</div>
    ${evt.description ? `<div>${escapeHtml(evt.description)}</div>` : ""}
  `;
    tooltipEl.classList.remove("hidden");
    positionTooltip(ev);
}
function positionTooltip(ev) {
    const pad = 14;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    const rect = tooltipEl.getBoundingClientRect();
    if (x + rect.width > window.innerWidth - 8) x = ev.clientX - rect.width - pad;
    if (y + rect.height > window.innerHeight - 8) y = ev.clientY - rect.height - pad;
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top = y + "px";
}
function hideTooltip() { tooltipEl.classList.add("hidden"); }
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const eventModal = document.getElementById("eventModal");
const viewModal = document.getElementById("viewModal");
const pwModal = document.getElementById("pwModal");

function openModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }
function closeAllModals() { [eventModal, viewModal, pwModal].forEach(closeModal); hideTooltip(); }

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
});
[eventModal, viewModal, pwModal].forEach(overlay => {
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(overlay); });
});

function requirePassword(promptText, type, onConfirmed) {
    document.getElementById("pwTitle").textContent = promptText;
    document.getElementById("pwInput").value = "";
    document.getElementById("pwError").textContent = "";
    state.pendingAction = onConfirmed;
    state.pendingType = type;
    openModal(pwModal);
    setTimeout(() => document.getElementById("pwInput").focus(), 30);
}
document.getElementById("pwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = document.getElementById("pwInput").value;
    const ok = await checkPassword(pw, state.pendingType);
    if (!ok) {
        document.getElementById("pwError").textContent = "Incorrect password. Try again.";
        return;
    }
    const action = state.pendingAction;
    state.pendingAction = null;
    state.pendingType = null;
    closeModal(pwModal);
    if (action) action(pw);
});
document.getElementById("pwCancel").addEventListener("click", () => closeModal(pwModal));
document.getElementById("pwModalClose").addEventListener("click", () => closeModal(pwModal));

function populateCategorySelect() {
    const sel = document.getElementById("evtCategory");
    sel.innerHTML = CONFIG.categories.map(c => `<option value="${c.id}">${c.label}</option>`).join("");
}

function openAddModal() {
    state.editingId = null;
    document.getElementById("modalTitle").textContent = "Add event";
    document.getElementById("eventForm").reset();
    document.getElementById("evtId").value = "";
    document.getElementById("evtStart").value = toKey(new Date());
    document.getElementById("formError").textContent = "";
    openModal(eventModal);
}

function openEditModal(evt) {
    state.editingId = evt.id;
    document.getElementById("modalTitle").textContent = "Edit event";
    document.getElementById("evtId").value = evt.id;
    document.getElementById("evtTitle").value = evt.title;
    document.getElementById("evtCategory").value = evt.category;
    document.getElementById("evtStart").value = evt.start;
    document.getElementById("evtEnd").value = evt.end && evt.end !== evt.start ? evt.end : "";
    document.getElementById("evtDesc").value = evt.description || "";
    document.getElementById("formError").textContent = "";
    openModal(eventModal);
}

document.getElementById("addEventBtn").addEventListener("click", () => {
    requirePassword("Enter password to add an event", "add", (pw) => {
        state.actionPassword = pw;
        openAddModal();
    });
});
document.getElementById("modalClose").addEventListener("click", () => closeModal(eventModal));
document.getElementById("cancelBtn").addEventListener("click", () => closeModal(eventModal));

document.getElementById("eventForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("evtTitle").value.trim();
    const category = document.getElementById("evtCategory").value;
    const start = document.getElementById("evtStart").value;
    const end = document.getElementById("evtEnd").value;
    const description = document.getElementById("evtDesc").value.trim();
    const errEl = document.getElementById("formError");

    if (!title || !start) { errEl.textContent = "Title and start date are required."; return; }
    if (end && end < start) { errEl.textContent = "End date can't be before the start date."; return; }

    const payload = { title, category, start, end: end || start, description };
    const password = state.actionPassword; // confirmed by the add/edit password gate

    let result;
    if (state.editingId) {
        result = await updateEvent(state.editingId, payload, password);
    } else {
        result = await createEvent(payload, password);
    }
    if (!result.ok) { errEl.textContent = result.error || "Something went wrong."; return; }

    state.actionPassword = null;
    closeModal(eventModal);
    await refresh();
});

function openViewModal(id) {
    const evt = state.events.find(e => e.id === id);
    if (!evt) return;
    const cat = categoryOf(evt.category);
    document.getElementById("viewCatPill").textContent = cat.label;
    document.getElementById("viewCatPill").style.background = cat.color;
    document.getElementById("viewTitle").textContent = evt.title;
    document.getElementById("viewDates").textContent = evt.end && evt.end !== evt.start
        ? `${fmtDate(parseDateKey(evt.start))} – ${fmtDate(parseDateKey(evt.end))}`
        : fmtDate(parseDateKey(evt.start));
    document.getElementById("viewDesc").textContent = evt.description || "No description.";
    document.getElementById("viewModal").dataset.currentId = id;
    openModal(viewModal);
}
document.getElementById("viewModalClose").addEventListener("click", () => closeModal(viewModal));

document.getElementById("editBtn").addEventListener("click", () => {
    const id = document.getElementById("viewModal").dataset.currentId;
    const evt = state.events.find(e => e.id === id);
    if (!evt) return;
    requirePassword("Enter password to edit this event", "edit", (pw) => {
        state.actionPassword = pw;
        closeModal(viewModal);
        openEditModal(evt);
    });
});

document.getElementById("deleteBtn").addEventListener("click", () => {
    const id = document.getElementById("viewModal").dataset.currentId;
    requirePassword("Enter password to delete this event", "delete", async (pw) => {
        const result = await deleteEvent(id, pw);
        if (result.ok) {
            closeModal(viewModal);
            await refresh();
        }
    });
});


document.getElementById("prevMonth").addEventListener("click", () => { state.cursor = addMonths(state.cursor, -1); renderCalendar(); });
document.getElementById("nextMonth").addEventListener("click", () => { state.cursor = addMonths(state.cursor, 1); renderCalendar(); });
document.getElementById("todayBtn").addEventListener("click", () => { state.cursor = startOfMonth(new Date()); renderCalendar(); });

populateCategorySelect();
renderLegend();
refresh();