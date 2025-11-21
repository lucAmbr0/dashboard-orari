// ------------ ICONS DICTIONARY ------------
// distance                   ==> aula corrente
// directions_walk            ==> successiva, cambio aula
// accessibility              ==> successiva, stessa aula
// emoji_people               ==> uscita

// ------------ CELL HTML FORMAT ------------
/* <div class="cellContainer">
        <h2 class="className">1ªF</h2>
        <div>
            <div class="row">
                <span class="icon material-symbols-outlined">distance</span>
                <p class="roomText">Lab. Informatica 2</p>
            </div>
            <hr class="grid-hr">
            <div class="row">
                <span class="icon material-symbols-outlined">accessibility</span>
                <p class="roomText">Lab. Informatica 2</p>
            </div>
        </div>
    </div> 
*/

// This class defines the structure and behavior of a cell in the timetable
class Cell {
    constructor(year, section, currentRoom, nextRoom) {
        this.year = year;
        this.section = section;
        this.currentRoom = currentRoom && currentRoom != "" ? currentRoom : "Assente";
        this.nextRoom = nextRoom && nextRoom != "" ? nextRoom : (currentRoom == "Assente" ? "Assente" : "Uscita");

        this.html = document.createElement('div');
        this.html.classList.add("cellContainer", `bg-class-${this.year}`);
        this.html.id = `cell-${this.year}${this.section}`;

        if (this.year === -1) // Padding cells at start
            this.html.style.visibility = "hidden";
        else
            this.html.innerHTML = `
            <h2 class="className">${this.year}ª${this.section}</h2>
            <div class="infoContainer">
                <div class="row">
                    <span class="icon material-symbols-outlined">distance</span>
                    <p class="roomText">${this.currentRoom}</p>
                </div>
                <hr class="grid-hr">
                <div class="row">
                    <span class="icon material-symbols-outlined">${this.currentRoom == this.nextRoom
                    ? "accessibility"
                    : this.nextRoom == "Uscita"
                        ? "emoji_people"
                        : "directions_walk"
                }</span>
                    <p class="roomText">${this.nextRoom}</p>
                </div>
            </div>
        `;
        this.displayed = false;
    }

    appendToUI() {
        const container = document.getElementById("cellsWrapper");
        this.html.style.animation = `appearUp ${scrollDuration}ms ${animationCurve} forwards`;
        container.appendChild(this.html);
        this.displayed = true;
        console.log("APPEND CELL:", this.year + this.section);
    }

    removeFromUI() {
        if (!this.displayed) return;
        const container = document.getElementById("cellsWrapper");
        if (container.contains(this.html)) {
            container.removeChild(this.html);
            this.displayed = false;
            console.log("REMOVE CELL:", this.year + this.section);
        }
    }
}

let offset = 0;
const cells = [];
const visibleCells = [];
let showingSettings = false;
let useCurrentDayAndTime = true;
let stepSize = 3;
let scrollDuration = 500;
let delayBetween = 5000;
let animationCurve = "ease";
let orePull = "";
let giornoPull = "";
let intervals = [
    { start: "08h00", end: "08h55" },
    { start: "08h55", end: "10h00" },
    { start: "10h00", end: "10h55" },
    { start: "10h55", end: "11h55" },
    { start: "11h55", end: "13h00" },
    { start: "13h00", end: "13h50" },
    { start: "13h50", end: "14h45" }
];

document.getElementById("useCurrentDayAndTimeInput").addEventListener("change", () => {
    useCurrentDayAndTime = document.getElementById("useCurrentDayAndTimeInput").checked;
    document.getElementById("dayAndHourSelector").style.display = useCurrentDayAndTime ? "none" : "block";
});

function loadSettings() {
    if (localStorage.getItem("dashboard-orari-settings")) {
        const settings = JSON.parse(localStorage.getItem("dashboard-orari-settings"));
        
        if (settings.interval) delayBetween = Number(settings.interval);
        else delayBetween = 5000;
        document.getElementById("intervalInput").value = delayBetween;
        
        if (settings.animationDuration) scrollDuration = Number(settings.animationDuration);
        else scrollDuration = 500;
        document.getElementById("animationDurationInput").value = scrollDuration;

        if (settings.animationCurve) animationCurve = settings.animationCurve;
        else animationCurve = "ease";
        document.getElementById("animationCurveInput").value = animationCurve;
        
        if (settings.useCurrentDayAndTime === true || settings.useCurrentDayAndTime === false) {
            useCurrentDayAndTime = settings.useCurrentDayAndTime;
            document.getElementById("useCurrentDayAndTimeInput").checked = useCurrentDayAndTime;
            document.getElementById("dayAndHourSelector").style.display = useCurrentDayAndTime ? "none" : "block";
        } else {
            document.getElementById("dayAndHourSelector").style.display = "none";
        }
        if (settings.day) {
            document.getElementById("dayInput").value = settings.day;
            giornoPull = settings.day;
        }
        if (settings.intervals) {
            intervals = settings.intervals;
            document.getElementById("intervalsJson").value = JSON.stringify(settings.intervals, null, 1);
        } else {
            document.getElementById("intervalsJson").value = JSON.stringify(intervals, null, 1);
        }
        if (settings.hour) {
            document.getElementById("hourInput").value = settings.hour;
            orePull = settings.hour;
        }
    } else {
        document.getElementById("intervalsJson").value = JSON.stringify(intervals, null, 1);
        document.getElementById("hourInput").value = intervals[0].start;
        document.getElementById("useCurrentDayAndTimeInput").checked = useCurrentDayAndTime;
        document.getElementById("dayAndHourSelector").style.display = "none";
    }
    appendIntervals();
}

function saveSettings() {
    const interval = document.getElementById("intervalInput").value;
    const animationDuration = document.getElementById("animationDurationInput").value;
    const animationCurve = document.getElementById("animationCurveInput").value;
    const useCurrentDayAndTime = document.getElementById("useCurrentDayAndTimeInput").checked;

    const day = document.getElementById("dayInput").value;
    const hour = document.getElementById("hourInput").value;
    const intervalsJson = document.getElementById("intervalsJson").value;

    const settings = {};

    if (interval >= 0 && interval <= 10000) settings.interval = interval;
    else settings.interval = 5000;
    if (animationDuration >= 100 && animationDuration <= 2000) settings.animationDuration = animationDuration;
    else settings.animationDuration = 500;
    switch (animationCurve) {
        case "linear":
        case "ease":
        case "ease-in":
        case "ease-out":
        case "cubic-bezier(0.075, 0.82, 0.465, 1)":
            settings.animationCurve = animationCurve;
            break;
        default:
            settings.animationCurve = "ease";
            break;
    }
    settings.useCurrentDayAndTime = useCurrentDayAndTime;
    switch (day) {
        case "lunedì":
        case "martedì":
        case "mercoledì":
        case "giovedì":
        case "venerdì":
        case "sabato":
            settings.day = day;
            break;
        default:
            settings.day = "lunedì"
            break;
    }
    const defaultIntervals = [
        { start: "08h00", end: "08h55" },
        { start: "08h55", end: "10h00" },
        { start: "10h00", end: "10h55" },
        { start: "10h55", end: "11h55" },
        { start: "11h55", end: "13h00" },
        { start: "13h00", end: "13h50" },
        { start: "13h50", end: "14h45" }
    ];

    try {
        const parsedIntervals = JSON.parse(intervalsJson);
        if (Array.isArray(parsedIntervals) && parsedIntervals.every(item =>
            item.start && item.end && typeof item.start === 'string' && typeof item.end === 'string')) {
            settings.intervals = parsedIntervals;
        } else {
            console.error("Invalid intervals format. Expected array of objects with 'start' and 'end' properties.");
            settings.intervals = defaultIntervals;
        }
    } catch (error) {
        console.error("Failed to parse intervalsJson:", error);
        settings.intervals = defaultIntervals;
    }

    const validHour = settings.intervals.some(interval => interval.start === hour)
        ? hour
        : settings.intervals[0].start;
    settings.hour = validHour;

    localStorage.setItem("dashboard-orari-settings", JSON.stringify(settings));
    window.location.reload();
}

function appendIntervals() {
    const selector = document.getElementById("hourInput");
    selector.innerHTML = "";
    for (const interval of intervals) {
        const option = document.createElement("option");
        option.value = interval.start;
        option.textContent = `${interval.start} - ${interval.end}`;
        selector.appendChild(option);
    }
}

async function getScrollDistance() {
    const container = document.getElementById("cellsWrapper");
    const firstCell = container.querySelector(".cellContainer");
    const scrollDistance = firstCell.getBoundingClientRect().height + 20;
    return `${-scrollDistance}px`;
}

async function startScrolling() {
    const container = document.getElementById("cellsWrapper");

    async function scrollStep() {
        const scrollDistance = await getScrollDistance();
        container.style.setProperty('--scroll-distance', scrollDistance);
        container.style.animationDuration = `${scrollDuration}ms`;
        container.style.animationTimingFunction = `${animationCurve}`;
        container.classList.add("trigger-scrollUp");

        await sleep(scrollDuration);

        for (let i = 0; i < stepSize; i++) {
            const old = visibleCells.shift();
            if (old) old.removeFromUI();
        }

        const nextCells = cells.slice(offset, offset + stepSize);
        nextCells.forEach(c => {
            c.appendToUI();
            visibleCells.push(c);
        });
        offset += nextCells.length;

        container.style.transition = "none";
        container.style.transform = "translateY(0)";
        container.offsetHeight;
        container.style.transition = "";
        container.classList.remove("trigger-scrollUp");

        if (offset < cells.length) {
            await sleep(scrollDuration + delayBetween);
            await scrollStep();
        }

    }

    await scrollStep();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getOrarioGiorno(giorno, orario) {
    if (orario == null) {
        document.getElementById("cellsWrapper").innerHTML += "<h1>Non ci sono lezioni da mostrare.</h1>"
        throw new Error("There's no valid interval for the current time.");
    }
    return fetch(`get_orario.php?orario=${orario}&giorno=${giorno}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // localStorage.setItem(`lessons-${giorno}-${orario}`, JSON.stringify(data.classi));
                console.log(`Ricevuti dati per ${giorno} alle ${orario}:`);
                console.log(data.classi);
                
                return data.classi;
            } else {
                throw new Error(data.message);
            }
        });
}

// Trigger at page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Hidden button in the bottom-left corner opens settings.");
    loadSettings();

    if (useCurrentDayAndTime) {
        const date = new Date();
        orePull = getRelativeInterval(formatTime(date), intervals, 0);
        giornoPull = formatDay(date);
    }
    // if (!localStorage.getItem(`lessons-${giornoPull}-${orePull}`)) {
    //     console.log("Current lessons object not found in localStorage");
    //     console.log(giornoPull);
    //     console.log(orePull);
    await getAndElaborateLessons(giornoPull, orePull);
    await sleep(delayBetween * 2);
    if (!showingSettings) {
        window.location.reload();
    }
    // } else {
    //     if (localStorage.getItem(`lessons-${giornoPull}-${getRelativeInterval(orePull, intervals, -1)}`)) {
    //         // Removing old lessons to optimize localStorage
    //         localStorage.removeItem(`lessons-${giornoPull}-${getRelativeInterval(orePull, intervals, -1)}`);
    //         console.log("Removed old lessons object from localStorage");
    //     }
    //     if (localStorage.getItem(`lessons-${giornoPull}-${getRelativeInterval(orePull, intervals, +1)}`)) {
    //         // We have both current AND next interval lessons (we are in the same interval)
    //         console.log("Found next lessons object in localStorage");
    //     } else {
    //         // We have the current interval but not the next one (an hour passed)
    //         console.log("Next lessons object NOT found in localStorage");
    //     }
    // }
});

function compareTimes(lastUpdate, now) {
    return lastUpdate.getHours() == now.getHours();
}

function formatDay(date) {
    switch (date.getDay()) {
        case 0:
            return "domenica";
        case 1:
            return "lunedì";
        case 2:
            return "martedì";
        case 3:
            return "mercoledì";
        case 4:
            return "giovedì";
        case 5:
            return "venerdì";
        case 6:
            return "sabato";
        default:
            console.error("Couldn't format day to pull");
            return "none";
            break;
    }
}

function formatTime(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}h${minutes}`;
}

function parseTimeToMinutes(timeStr) {
    const [h, m] = timeStr.split("h").map(Number);
    return h * 60 + m;
}

function findIntervalIndex(timeStr, intervals) {
    const totalMinutes = parseTimeToMinutes(timeStr);

    return intervals.findIndex(({ start, end }) => {
        const startMinutes = parseTimeToMinutes(start);
        const endMinutes = parseTimeToMinutes(end);
        return totalMinutes >= startMinutes && totalMinutes < endMinutes;
    });
}

function getRelativeInterval(timeStr, intervals, offset = 0) {
    const index = findIntervalIndex(timeStr, intervals);
    if (index === -1) return null; // Not in any interval

    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= intervals.length) return null;

    return intervals[targetIndex].start;
}


async function getAndElaborateLessons(giornoPull, orePull) {
    try {
        const currentLessons = await getOrarioGiorno(giornoPull, orePull);
        const nextLessons = await getOrarioGiorno(giornoPull, getRelativeInterval(orePull, intervals, 1));

        // Clear previous cells and reset state
        offset = 0;
        visibleCells.length = 0;
        document.getElementById("cellsWrapper").innerHTML = "";

        // Add padding cells at the start
        // cells.length = 0; // Clear the cells array
        // for (let i = 0; i < 3; i++) {
        //     cells.push(new Cell(-1));
        // }

        const nextLessonsMap = new Map(nextLessons.map(lesson => [lesson.CLASSE, lesson]));

        currentLessons.forEach(currentLesson => {
            if (currentLesson.CLASSE && currentLesson.AULA) {
                const anno = currentLesson.CLASSE[0];
                const sezione = currentLesson.CLASSE.slice(1);
                const nextRoom = nextLessonsMap.get(currentLesson.CLASSE)?.AULA || "Uscita";
                cells.push(new Cell(anno, sezione, currentLesson.AULA, nextRoom));
            }
        });

        // Display initial cells
        cells.slice(0, Math.min(12, cells.length)).forEach(cell => {
            cell.appendToUI();
            visibleCells.push(cell);
        });

        offset = visibleCells.length;

        await sleep(delayBetween*2);
        await startScrolling();

    } catch (error) {
        console.error("Error in getAndElaborateLessons:", error);
    }
}

function showSettings() {
    document.getElementById("settingsOverlay").classList.remove("hidden");
    showingSettings = true;
}