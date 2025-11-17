// ------------ ICONS DICTIONARY ------------
// distance                   ==> aula corrente
// transfer_within_a_station  ==> successiva, cambio aula
// guardian                   ==> successiva, stessa aula
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
                <span class="icon material-symbols-outlined">guardian</span>
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
                    ? "guardian"
                    : this.nextRoom == "Uscita"
                        ? "emoji_people"
                        : "transfer_within_a_station"
                }</span>
                    <p class="roomText">${this.nextRoom}</p>
                </div>
            </div>
        `;
        this.displayed = false;
    }

    appendToUI() {
        const container = document.getElementById("cellsWrapper");
        this.html.style.animation = "appearUp 0.5s ease forwards";
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
let lastUpdate = new Date();
const cells = [];
const visibleCells = [];
let stepSize = 3;
let scrollDuration = 500;
let delayBetween = 2000;
let orePull = "";
let giornoPull = "";
const intervals = [
    { start: "08h00", end: "08h55" },
    { start: "08h55", end: "10h00" },
    { start: "10h00", end: "10h55" },
    { start: "10h55", end: "11h55" },
    { start: "11h55", end: "13h00" },
    { start: "13h00", end: "13h50" },
    { start: "13h50", end: "14h45" }
];

async function startScrolling() {
    const container = document.getElementById("cellsWrapper");

    async function scrollStep() {
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
    return fetch(`get_orario.php?orario=${orario}&giorno=${giorno}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem(`lessons-${giorno}-${orario}`, JSON.stringify(data.classi));
                return data.classi;
            } else {
                throw new Error(data.message);
            }
        });
}

// Trigger at page load
document.addEventListener('DOMContentLoaded', async () => {
    const date = new Date();
    orePull = getRelativeInterval(formatTime(date), intervals, 0);
    giornoPull = formatDay(date);
    // if (!localStorage.getItem(`lessons-${giornoPull}-${orePull}`)) {
    //     console.log("Current lessons object not found in localStorage");
    //     console.log(giornoPull);
    //     console.log(orePull);
        await getAndElaborateLessons(giornoPull, orePull);
        await sleep(delayBetween*2);
        window.location.reload();
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
        cells.length = 0; // Clear the cells array
        for (let i = 0; i < 3; i++) {
            cells.push(new Cell(-1));
        }

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

        await startScrolling();
    } catch (error) {
        console.error("Error in getAndElaborateLessons:", error);
    }
}