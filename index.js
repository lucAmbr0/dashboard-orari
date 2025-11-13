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
        this.currentRoom = currentRoom;
        this.nextRoom = nextRoom ? nextRoom : "Uscita";

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
let delayBetween = 3000;
let orePull = "08h00";
let giornoPull = "martedì";

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

async function getOrarioGiorno(orario, giorno) {
    return fetch(`get_orario.php?orario=${orario}&giorno=${giorno}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.classi;
            } else {
                throw new Error(data.message);
            }
        });
}

// Trigger at page load
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem(`last-update`)) {
        getAndElaborateLessons();
    } else {
        const date = new Date();
        const lastUpdate = JSON.parse(localStorage.getItem(`last-update`));
        compareUpdateTime(lastUpdate, date);
        formatDay(date);
        formatTime(date);
    }
});

function compareUpdateTime(lastUpdate, now) {
    const intervals = [
        {start: {}, end: {}}
    ]
    new Date(year,month,day,hours,minutes);
    new Date(year,month,day,hours,minutes);
    new Date(year,month,day,hours,minutes);
    new Date(year,month,day,hours,minutes);
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

function formatTime(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();

    const intervals = [
        { start: "08h00", end: "08h55" },
        { start: "08h55", end: "10h00" },
        { start: "10h00", end: "10h55" },
        { start: "10h55", end: "11h55" },
        { start: "11h55", end: "13h00" },
        { start: "13h00", end: "13h50" },
        { start: "13h50", end: "14h45" }
    ];

    for (let interval of intervals) {
        const [startHour, startMin] = interval.start.split("h").map(Number);
        const [endHour, endMin] = interval.end.split("h").map(Number);
        const startMins = startHour * 60 + startMin;
        const endMins = endHour * 60 + endMin;

        if (currentTime >= startMins && currentTime < endMins) {
            console.log("GJHAGJKHADGJK - " + interval.start);
            
            return interval.start;
        }
    }

}

// function checkCourse() {
//     const now = new Date();
//     const intervals = [
//         { start: "08:00", end: "08:55" },
//         { start: "08:55", end: "10:00" },
//         { start: "10:00", end: "10:55" },
//         { start: "10:55", end: "11:55" },
//         { start: "11:55", end: "13:00" },
//         { start: "13:00", end: "13:50" },
//         { start: "13:50", end: "14:45" }
//     ];

//     const currentTime = now.getHours() * 60 + now.getMinutes();

//     for (let interval of intervals) {
//         const [startHour, startMin] = interval.start.split(":").map(Number);
//         const [endHour, endMin] = interval.end.split(":").map(Number);
//         const startMins = startHour * 60 + startMin;
//         const endMins = endHour * 60 + endMin;

//         if (currentTime >= startMins && currentTime < endMins) {
//             return true;
//         }
//     }

//     return false;
// }

async function getAndElaborateLessons() {
    getOrarioGiorno(orePull, giornoPull)
        .then(async lezioni => {
            // Empty cells for padding at start
            offset = 0;
            localStorage.setItem(`lessons-${giornoPull}-${orePull}`, JSON.stringify(lezioni));
            localStorage.setItem(`last-update`, JSON.stringify(new Date()));
            visibleCells.length = 0;
            document.getElementById("cellsWrapper").innerHTML = "";
            for (let i = 0; i < 3; i++)
                cells.push(new Cell(-1));
            lezioni.forEach(lezione => {
                const anno = lezione.CLASSE.slice(0, 1);
                const sezione = lezione.CLASSE.slice(1);
                cells.push(new Cell(anno, sezione, lezione.AULA, lezione.AULA));
            });

            for (let i = 0; i < 12 && i < cells.length; i++) {
                cells[i].appendToUI();
                visibleCells.push(cells[i]);
            }

            offset = visibleCells.length;

            await startScrolling();
        })
        .catch(error => console.error(error));
}