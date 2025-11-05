// ------------ GLOSSARIO ICONE ------------
// distance                   ==> aula corrente
// transfer_within_a_station  ==> successiva, cambio aula
// guardian                   ==> successiva, stessa aula
// emoji_people               ==> uscita

// ------------ HTML UNA CELLA ------------
{
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
    */}
// ------------ HTML UNA CELLA ------------

class Cell {
    constructor(year, section, currentRoom, nextRoom) {
        this.year = year;
        this.section = section;
        this.currentRoom = currentRoom;
        this.nextRoom = nextRoom ? nextRoom : "Uscita";

        this.html = document.createElement('div');
        this.html.classList.add("cellContainer", `bg-class-${this.year}`);
        this.html.id = `cell-${this.year}${this.section}`;

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

async function startScrolling() {
    const container = document.getElementById("cellsWrapper");
    const scrollDuration = 500;
    const delayBetween = 3000;
    const stepSize = 3;

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
            await sleep(delayBetween);
            await scrollStep();
        }
    }

    await scrollStep();
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getOrarioGiorno(orario, giorno) {
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

// funzion eseguita al caricamento della pagina
document.addEventListener('DOMContentLoaded', function () {
    getOrarioGiorno('08h00', 'martedì')
        .then(lezioni => {
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

            startScrolling();
        })
        .catch(error => console.error(error));
});
