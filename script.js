
const btnContainer = document.getElementById("btn-container");

const LiftStates = Object.freeze({
    IDLE: "idle",
    MOVING: "moving",
});
const ButtonStatus = Object.freeze({
    ARRIVED: "arrived",
    WAITING: "waiting",
    CALL: "call",
});


function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

class Lift {
    constructor(id, element, manager) {
        this.id = id;
        this.element = element;
        this.floor = 0;
        this.destination = null;
        this.state = LiftStates.IDLE;
        this.queue = [];
        this.manager = manager;
    }

    async moveToFloor() {

        while (this.queue.length > 0) {
            this.state = LiftStates.MOVING;

            this.destination = this.queue.shift();
            const button = this.getButton()
            this.element.style.fill = 'red'

            while (this.floor !== this.destination) {
                const direction = this.floor < this.destination ? 1 : -1;
                this.floor += direction;

                this.element.style.bottom = `${this.floor * 50 + 15}px`;

                await delay(1200);
            }

            this.element.style.fill = 'green'
            this.makeSound();
            updateButtonClass(button, ButtonStatus.ARRIVED)


            await delay(2000);
            this.destination = null;
            this.element.style.fill = 'black'
            updateButtonClass(button, ButtonStatus.CALL)
        }

        this.state = LiftStates.IDLE;
        this.manager.callLift();
    }

    addToQueue(floor) {
        this.queue.push(floor);
        if (this.state === LiftStates.IDLE) {
            this.moveToFloor();
        }
    }

    makeSound() {
        const aduio = new Audio("./assets/sound.mp3");
        aduio.play();
    }
    getButton() {
        const btn = document.getElementById(`btn-${this.destination}`);
        return btn
    }
}

class Manager {
    constructor(numFloors, numLifts) {
        this.numFloors = numFloors;
        this.numLifts = numLifts;
        this.lifts = [];
        this.requestQueue = []
        this.initialize();
    }

    initialize() {
        const svgs = document.querySelectorAll(".lift");
        svgs.forEach((lift, i) => {
            const newLift = new Lift(i, lift, this);
            this.lifts.push(newLift);
        })
    }

    callLift() {

        while (this.requestQueue.length > 0) {
            const idleLift = this.getNearestIdleLift(this.requestQueue[0]);
            if (idleLift) {
                const floorNumber = this.requestQueue.shift();
                idleLift.addToQueue(floorNumber);
            } else {
                return;
            }
        }
    }

    getNearestAvailableLift(floorNumber) {
        let nearestLift = null;
        let minDifference = Number.MAX_SAFE_INTEGER;

        for (const lift of this.lifts) {
            const difference = Math.abs(lift.destination - floorNumber);
            if (difference < minDifference) {
                minDifference = difference;
                nearestLift = lift;
            }
        }

        return nearestLift;
    }

    getNearestIdleLift(floorNumber) {
        let nearestLift = null;
        let minDifference = Number.MAX_SAFE_INTEGER;

        for (const lift of this.lifts) {
            const difference = Math.abs(lift.floor - floorNumber);

            if (lift.state === LiftStates.IDLE && difference < minDifference) {
                minDifference = difference;
                nearestLift = lift;
            }
        }

        return nearestLift;
    }
}

function updateButtonClass(button, newClass) {
    button.className = '';
    button.classList.add(newClass);
    button.innerText = newClass;
}

const manager = new Manager(10, 5);

btnContainer.addEventListener("click", (event) => {
    const btn = event.target;
    if (btn.classList.value !== "call") return;
    const floor = Number(btn.id.split('-')[1]);
    updateButtonClass(btn, ButtonStatus.WAITING)
    manager.requestQueue.push(floor)
    manager.callLift()
})