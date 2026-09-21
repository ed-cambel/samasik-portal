// calendar.js — using EventCalendar (github.com/vkurko/calendar)
// Global object exposed by the CDN bundle is `EventCalendar`

let calendar;

// ---------------------------------------------------------
// CATEGORY COLORS
// ---------------------------------------------------------

const categoryColors = {
    "University Calendar": "#E1AD01",
    "Psychology / SamaSik": "#AA336A",
    "Redbolts": "#dc2626",
    "Birthday": "#7c3aed",
    "Posting": "#16a34a",
    "Meeting": "#2563eb",
    "Holiday / Commemoration": "#950606"
};


// ---------------------------------------------------------
// FETCH EVENTS
// ---------------------------------------------------------
function parseLocalDate(value) {
    if (!value) return null;
    const dateString = String(value).slice(0, 10);
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function parseLocalDateTime(value) {
    if (!value) return null;
    // Supabase returns "2026-09-23 19:18:00+00" — normalize the space to "T"
    // so the browser's native Date parser can handle the timezone offset correctly.
    const normalized = String(value).replace(" ", "T");
    return new Date(normalized);
}

async function fetchEvents() {
    const { data, error } = await supabaseClient
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Error loading events:", error.message);
        return [];
    }

    return data.map(row => {
        let start;
        let end;

        if (row.all_day) {
            // IMPORTANT:
            // Don't let JavaScript interpret YYYY-MM-DD as UTC.
            start = parseLocalDate(row.start_time);

            end = row.end_time
                ? parseLocalDate(row.end_time)
                : start;
        } else {
            start = parseLocalDateTime(row.start_time);

            end = row.end_time
                ? parseLocalDateTime(row.end_time)
                : start;
        }

        return {
            id: row.id,
            title: row.title,
            start,
            end,
            allDay: row.all_day,

            backgroundColor: row.color || undefined,

            extendedProps: {
                description: row.description,
                location: row.location,
                category: row.category
            }
        };
    });
}


// ---------------------------------------------------------
// CALENDAR INITIALIZATION
// ---------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
    const calendarEl = document.getElementById("calendar");

    if (!calendarEl) {
        console.error("Calendar element #calendar was not found.");
        return;
    }

    const events = await fetchEvents();

    calendar = EventCalendar.create(calendarEl, {
        view: "dayGridMonth",

        buttonText: {
            today: "Today",
            dayGridMonth: "Month",
            listMonth: "List"
        },

        headerToolbar: {
            start: "prev,title,next today",
            center: "",
            end: "dayGridMonth listMonth addTaskBtn"
        },

        customButtons: {
            addTaskBtn: {
                text: "+ Add Event",
                click: () => {
                    openModal("add");
                }
            }
        },

        // -------------------------------------------------
        // EVENT MOUNT
        // -------------------------------------------------

        eventDidMount: (info) => {
            const { category, location, description } = info.event.extendedProps;
            const dateStr = info.event.start.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            let timeStr = "";
            if (!info.event.allDay) {
                const startTime = info.event.start.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit"
                });
                if (info.event.end) {
                    const endTime = info.event.end.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit"
                    });
                    timeStr = ` · ${startTime} - ${endTime}`;
                } else {
                    timeStr = ` · ${startTime}`;
                }
            }

            // Defer to the next animation frame, giving the browser time to
            // finish rendering the event's inner elements first
            requestAnimationFrame(() => {
                const titleEl = info.el.querySelector(".ec-event-title");
                if (titleEl) {
                    titleEl.classList.add("event-title-clip");

                    // Only show location in list view, not month/grid view
                    const isListView = calendar.getOption("view") === "listMonth";

                    if (isListView && location && !titleEl.nextElementSibling?.classList.contains("event-location-clip")) {
                        const locationEl = document.createElement("div");
                        locationEl.className = "event-location-clip";
                        locationEl.innerHTML = `<i class="bi bi-geo-alt-fill"></i><span>${location}</span>`;
                        titleEl.insertAdjacentElement("afterend", locationEl);
                    }
                }
            });

            const tooltip = document.createElement("div");
            tooltip.className = "custom-tooltip";
            tooltip.innerHTML = `
                <div class="tooltip-title">${info.event.title}</div>
                <div class="tooltip-meta">${category ? category + " · " : ""}${dateStr}${timeStr}</div>
                ${location ? `<div class="tooltip-location">${location}</div>` : ""}
                ${description ? `<div class="tooltip-desc">${description}</div>` : ""}
            `;
            document.body.appendChild(tooltip);

            info.el.addEventListener("mouseenter", () => {
                const rect = info.el.getBoundingClientRect();
                tooltip.style.display = "block";

                const tooltipRect = tooltip.getBoundingClientRect();

                let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
                left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));

                let top = rect.bottom + 8;
                if (top + tooltipRect.height > window.innerHeight) {
                    top = rect.top - tooltipRect.height - 8;
                }

                tooltip.style.left = `${left}px`;
                tooltip.style.top = `${top}px`;
            });

            info.el.addEventListener("mouseleave", () => {
                tooltip.style.display = "none";
            });
        },

        // IMPORTANT:
        // Give EventCalendar the events
        events: events,

        // Clicking an event
        eventClick: (info) => {
            openDetailsModal(info.event);
        },

        height: "auto"
    });
});


// ---------------------------------------------------------
// HTML ESCAPE HELPER
// ---------------------------------------------------------

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ---------------------------------------------------------
// DETAILS MODAL
// ---------------------------------------------------------

const detailsModal = document.getElementById("details-modal");

let currentDetailsEvent = null;
function openDetailsModal(event) {
    currentDetailsEvent = event;
    const { category, description, location } = event.extendedProps;

    const badge = document.getElementById("details-category-badge");
    badge.textContent = category || "Event";
    badge.style.background = categoryColors[category] || "#6b6b76";

    document.getElementById("details-title").textContent = event.title;

    let dateText = event.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    if (!event.allDay) {
        const startTime = event.start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        });
        if (event.end) {
            const endTime = event.end.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit"
            });
            dateText += ` · ${startTime} - ${endTime}`;
        } else {
            dateText += ` · ${startTime}`;
        }
    }

    document.getElementById("details-date").textContent = dateText;

    const locationEl = document.getElementById("details-location");
    if (location) {
        locationEl.innerHTML = `<i class="bi bi-geo-alt-fill"></i> ${location}`;
        locationEl.classList.remove("hidden");
    } else {
        locationEl.classList.add("hidden");
    }

    document.getElementById("details-description").textContent = description || "No description.";

    detailsModal.classList.remove("hidden");
}


function closeDetailsModal() {
    if (detailsModal) {
        detailsModal.classList.add("hidden");
    }

    currentDetailsEvent = null;
}


// Close details modal
const detailsCloseBtn = document.getElementById(
    "details-close-btn"
);

if (detailsCloseBtn) {
    detailsCloseBtn.addEventListener(
        "click",
        closeDetailsModal
    );
}


// ---------------------------------------------------------
// EDIT EVENT FROM DETAILS MODAL
// ---------------------------------------------------------

const detailsEditBtn = document.getElementById(
    "details-edit-btn"
);

if (detailsEditBtn) {
    detailsEditBtn.addEventListener("click", () => {
        // IMPORTANT:
        // Save the event BEFORE closeDetailsModal()
        // because closeDetailsModal() sets it to null.

        const eventToEdit = currentDetailsEvent;

        closeDetailsModal();

        if (eventToEdit) {
            openModal("edit", eventToEdit);
        }
    });
}


// ---------------------------------------------------------
// DELETE EVENT FROM DETAILS MODAL
// ---------------------------------------------------------

const detailsDeleteBtn = document.getElementById(
    "details-delete-btn"
);

if (detailsDeleteBtn) {
    detailsDeleteBtn.addEventListener(
        "click",
        async () => {
            if (!currentDetailsEvent) {
                return;
            }

            if (!confirm("Delete this event?")) {
                return;
            }

            const { error } = await supabaseClient
                .from("events")
                .delete()
                .eq("id", currentDetailsEvent.id);

            if (error) {
                alert(
                    "Error deleting: " +
                    error.message
                );

                return;
            }

            const freshEvents =
                await fetchEvents();

            if (calendar) {
                calendar.setOption(
                    "events",
                    freshEvents
                );
            }

            closeDetailsModal();
        }
    );
}


// ---------------------------------------------------------
// TASK MODAL
// ---------------------------------------------------------

const modal = document.getElementById(
    "task-modal"
);

const form = document.getElementById(
    "task-form"
);

const modalTitle = document.getElementById(
    "modal-title"
);

const deleteBtn = document.getElementById(
    "delete-task-btn"
);


// ---------------------------------------------------------
// OPEN ADD / EDIT MODAL
// ---------------------------------------------------------

function openModal(mode, eventData = null) {
    if (!modal) {
        console.error("#task-modal was not found.");
        return;
    }

    if (!form) {
        console.error("#task-form was not found.");
        return;
    }

    // Reset form
    form.reset();

    // Clear hidden ID
    const taskId = document.getElementById(
        "task-id"
    );

    if (taskId) {
        taskId.value = "";
    }

    // Hide feedback
    const feedback = document.getElementById(
        "form-feedback"
    );

    if (feedback) {
        feedback.classList.add("hidden");
        feedback.textContent = "";
    }

    // -------------------------------------------------
    // ADD MODE
    // -------------------------------------------------

    if (mode === "add") {
        if (modalTitle) {
            modalTitle.textContent = "Add Event";
        }

        if (deleteBtn) {
            deleteBtn.classList.add("hidden");
        }

        modal.classList.remove("hidden");

        return;
    }

    // -------------------------------------------------
    // EDIT MODE
    // -------------------------------------------------

    if (mode === "edit" && eventData) {
        if (modalTitle) {
            modalTitle.textContent = "Edit Event";
        }

        if (deleteBtn) {
            deleteBtn.classList.remove("hidden");
        }

        const startDate =
            eventData.start instanceof Date
                ? eventData.start
                : new Date(eventData.start);

        const endDate =
            eventData.end
                ? (
                    eventData.end instanceof Date
                        ? eventData.end
                        : new Date(eventData.end)
                )
                : null;

        // ID
        if (taskId) {
            taskId.value = eventData.id;
        }

        // Title
        const titleInput =
            document.getElementById(
                "task-title"
            );

        if (titleInput) {
            titleInput.value =
                eventData.title || "";
        }

        // Category
        const categoryInput =
            document.getElementById(
                "task-category"
            );

        if (categoryInput) {
            categoryInput.value =
                eventData.extendedProps?.category ||
                "";
        }

        // Start date
        const startInput =
            document.getElementById(
                "task-start"
            );

        if (startInput) {
            startInput.value =
                formatDateForInput(startDate);
        }

        // End date
        const endInput =
            document.getElementById(
                "task-end"
            );

        if (endInput) {
            endInput.value =
                endDate
                    ? formatDateForInput(endDate)
                    : "";
        }

        // -------------------------------------------------
        // TIME FIELDS
        // -------------------------------------------------

        const startTimeInput =
            document.getElementById(
                "task-start-time"
            );

        const endTimeInput =
            document.getElementById(
                "task-end-time"
            );

        if (!eventData.allDay) {
            if (startTimeInput) {
                startTimeInput.value =
                    formatTimeForInput(startDate);
            }

            if (endTimeInput) {
                endTimeInput.value =
                    endDate
                        ? formatTimeForInput(endDate)
                        : "";
            }
        } else {
            if (startTimeInput) {
                startTimeInput.value = "";
            }

            if (endTimeInput) {
                endTimeInput.value = "";
            }
        }

        // Location
        const locationInput =
            document.getElementById(
                "task-location"
            );

        if (locationInput) {
            locationInput.value =
                eventData.extendedProps?.location ||
                "";
        }

        // Description
        const descriptionInput =
            document.getElementById(
                "task-description"
            );

        if (descriptionInput) {
            descriptionInput.value =
                eventData.extendedProps?.description ||
                "";
        }

        modal.classList.remove("hidden");
    }
}


// ---------------------------------------------------------
// DATE / TIME HELPERS
// ---------------------------------------------------------

function formatDateForInput(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatTimeForInput(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return "";
    }

    const hours = String(
        date.getHours()
    ).padStart(2, "0");

    const minutes = String(
        date.getMinutes()
    ).padStart(2, "0");

    return `${hours}:${minutes}`;
}


// ---------------------------------------------------------
// CLOSE TASK MODAL
// ---------------------------------------------------------

function closeModal() {
    if (modal) {
        modal.classList.add("hidden");
    }
}


// ---------------------------------------------------------
// FORM FEEDBACK
// ---------------------------------------------------------

function showFeedback(message, type) {
    const el = document.getElementById(
        "form-feedback"
    );

    if (!el) {
        return;
    }

    el.textContent = message;

    el.className =
        "form-feedback " + type;

    el.classList.remove("hidden");
}


// ---------------------------------------------------------
// CANCEL BUTTON
// ---------------------------------------------------------

const cancelBtn = document.getElementById(
    "cancel-btn"
);

if (cancelBtn) {
    cancelBtn.addEventListener(
        "click",
        closeModal
    );
}


// ---------------------------------------------------------
// CLOSE MODAL BUTTON
// ---------------------------------------------------------

const closeModalBtn = document.getElementById(
    "close-modal-btn"
);

if (closeModalBtn) {
    closeModalBtn.addEventListener(
        "click",
        closeModal
    );
}


// ---------------------------------------------------------
// SUBMIT FORM
// ---------------------------------------------------------

if (form) {
    form.addEventListener(
        "submit",
        async (e) => {
            e.preventDefault();

            const id =
                document.getElementById(
                    "task-id"
                )?.value || "";

            const category =
                document.getElementById(
                    "task-category"
                )?.value || "";

            const title =
                document.getElementById(
                    "task-title"
                )?.value.trim() || "";

            const startDate =
                document.getElementById(
                    "task-start"
                )?.value || "";

            const startTime =
                document.getElementById(
                    "task-start-time"
                )?.value || "";

            const endDate =
                document.getElementById(
                    "task-end"
                )?.value || "";

            const endTime =
                document.getElementById(
                    "task-end-time"
                )?.value || "";

            // Validate title
            if (!title) {
                showFeedback(
                    "Please enter an event title.",
                    "error"
                );

                return;
            }

            // Validate start date
            if (!startDate) {
                showFeedback(
                    "Please select a start date.",
                    "error"
                );

                return;
            }

            // -------------------------------------------------
            // BUILD DATETIME VALUES
            // -------------------------------------------------

            const start_time = startTime
                ? `${startDate}T${startTime}:00`
                : `${startDate}T00:00:00`;

            const end_time = endDate
                ? (
                    endTime
                        ? `${endDate}T${endTime}:00`
                        : `${endDate}T00:00:00`
                )
                : null;


            // -------------------------------------------------
            // PAYLOAD
            // -------------------------------------------------

            console.log("Sending start_time:", start_time);
            const payload = {
                title: title,

                category: category,

                start_time: start_time,

                end_time: end_time,

                location:
                    document.getElementById(
                        "task-location"
                    )?.value.trim() || null,

                description:
                    document.getElementById(
                        "task-description"
                    )?.value.trim() || null,

                // No start time = all-day event
                all_day: !startTime,

                color:
                    categoryColors[category] ||
                    null
            };

            showFeedback(
                "Saving...",
                "success"
            );

            let error;

            // -------------------------------------------------
            // UPDATE EXISTING EVENT
            // -------------------------------------------------

            if (id) {
                ({
                    error
                } = await supabaseClient
                    .from("events")
                    .update(payload)
                    .eq("id", id));
            }

            // -------------------------------------------------
            // INSERT NEW EVENT
            // -------------------------------------------------

            else {
                ({
                    error
                } = await supabaseClient
                    .from("events")
                    .insert(payload));
            }

            // -------------------------------------------------
            // ERROR
            // -------------------------------------------------

            if (error) {
                console.error(
                    "Error saving event:",
                    error
                );

                showFeedback(
                    "Error: " +
                    error.message,
                    "error"
                );

                return;
            }

            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            showFeedback(
                "Saved!",
                "success"
            );

            const freshEvents =
                await fetchEvents();

            if (calendar) {
                calendar.setOption(
                    "events",
                    freshEvents
                );
            }

            // Close after short delay
            setTimeout(
                closeModal,
                500
            );
        }
    );
}


// ---------------------------------------------------------
// DELETE EVENT FROM EDIT MODAL
// ---------------------------------------------------------

if (deleteBtn) {
    deleteBtn.addEventListener(
        "click",
        async () => {
            const id =
                document.getElementById(
                    "task-id"
                )?.value;

            if (!id) {
                return;
            }

            if (!confirm("Delete this event?")) {
                return;
            }

            const { error } =
                await supabaseClient
                    .from("events")
                    .delete()
                    .eq("id", id);

            if (error) {
                showFeedback(
                    "Error: " +
                    error.message,
                    "error"
                );

                return;
            }

            const freshEvents =
                await fetchEvents();

            if (calendar) {
                calendar.setOption(
                    "events",
                    freshEvents
                );
            }

            closeModal();
        }
    );
}


// ---------------------------------------------------------
// OPTIONAL: CLOSE MODALS WHEN CLICKING OUTSIDE
// ---------------------------------------------------------

if (detailsModal) {
    detailsModal.addEventListener(
        "click",
        (e) => {
            if (e.target === detailsModal) {
                closeDetailsModal();
            }
        }
    );
}

if (modal) {
    modal.addEventListener(
        "click",
        (e) => {
            if (e.target === modal) {
                closeModal();
            }
        }
    );
}


// ---------------------------------------------------------
// ESC KEY
// ---------------------------------------------------------

document.addEventListener(
    "keydown",
    (e) => {
        if (e.key !== "Escape") {
            return;
        }

        if (
            detailsModal &&
            !detailsModal.classList.contains("hidden")
        ) {
            closeDetailsModal();
        }

        if (
            modal &&
            !modal.classList.contains("hidden")
        ) {
            closeModal();
        }
    }
);
