let intervalDistance = 0; //Difficulty
let setting = 0; //Element setting
let pen; //Drawing Instrument
let canvas; //Drawing space
let width;
let height;
let staffHeight;
let staffYShift;
let notes;
let noteCount = 4;
let noteSounds;
let audioContext;

//Note number is a similar system to midi key number but with only 8 note in an octave and F4 is 33.
//Duration like 'q' for quarter, 'h' for half, 'w' for whole, 'e' for eigth.
class note {
    constructor(noteNumber, length) {
        this.noteNumber = noteNumber;
        this.length = length;
    }
}

class noteSound {
    constructor(frequency, duration) {
        this.frequency = frequency;
        this.duration = duration;
    }
}

function settingsPage() {
    document.getElementById("dynamicJavascript").innerHTML = `
    <h2>Difficulty</h2>
    <input type="number" max="8" min="0" id="difficultySetting">
    <p>0 - 8 Number represents the largest interval jump to be generated.<br>
    <h2>Note Count</h2>
    <input type="number" max="15" min="1" id="noteCount">
    <br>
    <br>
    <button class="btn btn-secondary text-center" onclick="processSettings()">Enter</button>
    `;
    document.getElementById("difficultySetting").value = intervalDistance;
    document.getElementById("noteCount").value = noteCount;
    //100 - 199 Notes can have accidentals (Inactive)</p>
}

function processSettings() {
    intervalDistance = document.getElementById("difficultySetting").value;
    if (intervalDistance > 8) {
        document.getElementById("error").innerText = "Difficulty cannot exceed 8";
        return;
    }
    else if (intervalDistance < 0) {

        document.getElementById("error").innerText = "Difficulty cannot be below 0";
        return;
    }
    document.getElementById("error").innerText = "";
    setting = Math.floor(intervalDistance / 100);
    intervalDistance = intervalDistance % 100;
    noteCount = document.getElementById("noteCount").value;
    if (noteCount > 15) {
        document.getElementById("error").innerText = "Note Count cannot exceed 15";
        return;
    }
    else if (noteCount < 1) {
        document.getElementById("error").innerText = "Note Count cannot be below 1";
        return;
    }

    runProgram();
}

function runProgram() {
    width = 600;
    height = 200;
    document.getElementById("dynamicJavascript").innerHTML = `
    <button class="btn btn-secondary text-center" onclick=settingsPage()>Return to Settings</button>
    <br>
    <canvas id="barline"></canvas>
    <br>
    <button class="btn btn-secondary text-center" onclick=playFirstNote()>Play First Note</button>
    <button class="btn btn-secondary text-center" onclick=playAllNotes()>Play All Notes</button>
    `;
    document.getElementById("barline").width = width;
    document.getElementById("barline").height = height;
    initializeState();
    generateNotes();
    generateNoteSounds();
    drawNotation();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playFirstNote() {
    let sound = audioContext.createOscillator();
    let gain = new GainNode(audioContext, { gain: 0.1 });
    gain.connect(audioContext.destination);
    sound.type = "sine";
    sound.frequency.setValueAtTime(noteSounds[0].frequency, audioContext.currentTime);
    sound.connect(gain);
    sound.start();
    sound.stop(audioContext.currentTime + 1);
}

async function playAllNotes() {
    let sound;
    let gain = new GainNode(audioContext, { gain: 0.1 });
    gain.connect(audioContext.destination);
    for (let i = 0; i < noteSounds.length; i++) {
        sound = audioContext.createOscillator();
        sound.type = "sine";
        sound.frequency.setValueAtTime(noteSounds[i].frequency, audioContext.currentTime);
        sound.connect(gain);
        sound.start();
        sound.stop(audioContext.currentTime + 1);
        await sleep(1000);
    }
}

function generateNote(previousNote) {
    let upperLimit = 34;
    let lowerLimit = 24;
    let valid = false;
    let shift;
    let newNote;
    while (valid == false) {
        shift = Math.floor(Math.random() * (intervalDistance * 2 + 1)) - intervalDistance;
        newNote = previousNote + shift;
        if (newNote <= upperLimit && newNote >= lowerLimit) {
            valid = true;
        }
    }
    return new note(newNote, 'q');
}

function generateNotes() {
    let C4 = 30;
    notes = [new note(C4, 'q')];
    let previousNote = C4;
    for (let i = 1; i < noteCount; i++) {
        notes.push(generateNote(previousNote));
        previousNote = notes[notes.length - 1].noteNumber;
    }
}

function generateNoteSounds() {
    let baseFrequencies = [16.35, 18.35, 20.6, 21.83, 24.5, 13.75, 15.43];
    let baseFrequency;
    let frequency;
    noteSounds = [];
    for (let i = 0; i < notes.length; i++) {
        baseFrequency = baseFrequencies[(notes[i].noteNumber + 5) % baseFrequencies.length];
        frequency = Math.pow(2, Math.floor((notes[i].noteNumber) / baseFrequencies.length)) * baseFrequency;
        noteSounds.push(new noteSound(frequency, 1/4))
    }
}

function initializeState() {
    canvas = document.getElementById("barline");
    pen = canvas.getContext("2d");
    staffHeight = 50;
    staffYShift = (height - staffHeight) / 2;
    audioContext = new AudioContext();
}

function drawLine(start, end) {
    pen.moveTo(start[0], start[1]);
    pen.lineTo(end[0], end[1]);
}

function drawStaff() {
    //tiltAngle = 0;
    for (i = 0; i < 5; i++) {
        let lineY = staffHeight * (i / 5) + staffYShift;
        drawLine([0, lineY], [width, lineY]);
    }
    pen.stroke();
}
function drawNotation() {
    let quarterDistance = staffHeight * 0.75;
    let pitchShiftDistance = staffHeight / 10;
    for (let i = 0; i < notes.length; i++) {
        drawQuarterNote(quarterDistance * (i + 1), staffYShift + (33 - notes[i].noteNumber) * pitchShiftDistance);
    }
    drawStaff();
}

function drawQuarterNote(x, y) {
    let tiltAngle = Math.PI * 2 - Math.PI / 6;
    let scale = 0.7;
    let xRadius = staffHeight / 6 * scale;
    let yRadius = staffHeight / 9 * scale;
    let stemXPosition = Math.ceil(x + Math.sin(tiltAngle + Math.PI / 2) * xRadius);
    let stemYPositionStart = Math.ceil(y - Math.cos(tiltAngle + Math.PI / 2) * xRadius);
    pen.beginPath();
    pen.fillStyle = "black";
    pen.ellipse(x, y, xRadius, yRadius, tiltAngle, 0, Math.PI * 2);
    pen.fill();
    pen.closePath();
    drawLine([stemXPosition, stemYPositionStart], [stemXPosition, stemYPositionStart - staffHeight / 2])
    pen.stroke();
}

function drawHalfNote(x, y) {
    let tiltAngle = Math.PI * 2 - Math.PI / 6;
    let scale = 0.7;
    let xRadius = staffHeight / 6 * scale;
    let yRadius = staffHeight / 9 * scale;
    let stemXPosition = Math.ceil(x + Math.sin(tiltAngle + Math.PI / 2) * xRadius);
    let stemYPositionStart = Math.ceil(y - Math.cos(tiltAngle + Math.PI / 2) * xRadius);
    pen.beginPath();
    pen.fillStyle = "black";
    pen.ellipse(x, y, xRadius, yRadius, tiltAngle, 0, Math.PI * 2);
    pen.fill();
    pen.closePath();
    pen.stroke();
    pen.beginPath();
    pen.fillStyle = "white";
    pen.ellipse(x, y, xRadius * 0.9, yRadius * 0.7, tiltAngle, 0, Math.PI * 2);
    pen.fill();
    pen.closePath;
    drawLine([stemXPosition, stemYPositionStart], [stemXPosition, stemYPositionStart - staffHeight / 2]);
    pen.stroke();
}