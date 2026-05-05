/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { timer, of, fromEvent, interval, merge, defer, Observable } from "rxjs";
import {
    map,
    filter,
    scan,
    takeUntil,
    delay,
    mergeMap,
    take,
    flatMap,
    takeWhile,
    sample,
} from "rxjs/operators";
import * as Tone from "tone";
import { SampleLibrary } from "./tonejs-instruments";
import { Source } from "tone/build/esm/source/Source";

/** Constants */

const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 350,
} as const;

export const Constants = {
    TICK_RATE_MS: 15,
    SONG_NAME: "RockinRobin",
} as const;

const Note = {
    RADIUS: 0.07 * Viewport.CANVAS_WIDTH,
    TAIL_WIDTH: 10,
};

/** User input */

type Key = "KeyA" | "KeyS" | "KeyD" | "KeyF";

type Event = "keydown" | "keyup" | "keypress";

/** Utility functions */

/** State processing */

export type State = Readonly<{
    time: number;
    gameEnd: boolean;
    circle: ReadonlyArray<Circle>;
    bgnotes: ReadonlyArray<bgnote>;
    allnotes: {};
    score: number;
    multiplier: number;
    consecutiveHits: number;
    keyPressed: { [key in Key]: boolean };
    firstNoteReached: boolean;
}>;
const updateState = (state: State, newState: Partial<State>): State => ({
    ...state,
    ...newState,
});
export const initialState: State = {
    time: 0,
    gameEnd: false,
    circle: [],
    bgnotes: [],
    allnotes: {},
    score: 0,
    multiplier: 1,
    consecutiveHits: 0,
    keyPressed: {
        KeyA: false,
        KeyS: false,
        KeyD: false,
        KeyF: false,
    },
    firstNoteReached: false,
} as const;

export interface NoteObject {
    played: boolean;
    instrument: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    checked: boolean;
    alreadyhit: boolean;
    randomnoteplayed: boolean;
    missed: boolean;
    range: boolean;
}
export interface CircleCountByColor {
    [color: string]: number;
}

export type Circle = Readonly<{
    id: string;
    position: Vec;
    radius: number;
    velocity: Vec;
    isActive: boolean;
    notearr: NoteObject;
    bgnotes: NoteObject;
    allnotes: {};
    pressed: boolean;
    hit: boolean;
    alreadyhit: boolean;
    missed: boolean;
    randomnoteplayed: boolean;
    range: boolean;
}>;

type bgnote = Readonly<{
    instrument: string;
    velocity: number;
    pitch: number;
    start: number;
    end: number;
    checked: boolean;
    alreadyhit: boolean;
}>;

// Vector class
export class Vec {
    constructor(
        public readonly x: number = 0,
        public readonly y: number = 0,
    ) {}
    add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y);
    sub = (b: Vec) => this.add(b.scale(-1));
    len = () => Math.sqrt(this.x * this.x + this.y * this.y);
    scale = (s: number) => new Vec(this.x * s, this.y * s);
    static Zero = new Vec();
}

// Three types of game state transitions
export class Tick {
    constructor(public readonly elapsed: number) {}
}
export class KeyPress {
    constructor(
        public readonly key: string,
        public readonly pressed: boolean,
    ) {}
}
class circleclass {
    constructor(
        public readonly id: string,
        public readonly marked: boolean,
    ) {}
}

const tick$ = interval(Constants.TICK_RATE_MS).pipe(
    map((elapsed) => new Tick(elapsed)),
);

//const shoot = keyObservable("keydown", "Space", () => new Shoot());

/** State Transition Functions */

/**
 * Updates the state by proceeding with one time step.
 *
 * @param s Current state
 * @returns Updated state
 */

/** Rendering (side effects) */

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
//USEFULL TO SHOW SVG
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
// USEFULL TO HIDE SVG
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {},
): SVGElement => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

//GET RANDOM DURATION
function getRandomDuration(): number {
    return Math.random() * 0.5; // Generates a random number between 0 and 0.5
}

/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main(
    csvContents: string,
    samples: { [key: string]: Tone.Sampler },
) {
    // Parse the CSV contents into an array of notes
    const notes = csvContents
        .trim()
        .split("\n")
        .slice(1)
        .map((row) => {
            const [played, instrument, velocity, pitch, start, end] =
                row.split(",");
            return {
                played: played === "True",
                velocity: parseInt(velocity),
                instrument: instrument,
                pitch: parseInt(pitch),
                start: parseFloat(start) * 1000,
                end: parseFloat(end) * 1000,
                checked: false,
                alreadyhit: false,
                randomnoteplayed: false,
                missed: false,
                range: false,
            };
        });
    //  to move the circle down the canvas
    const moveCircle1 = (c: Circle): Circle => {
        return {
            ...c,
            position: c.position.add(c.velocity),
            isActive: false,
        };
    };

    // Function to calculate the multiplier based on the number of consecutive hits
    const calculateMultiplier = (consecutiveHits: number): number => {
        const baseMultiplier = 1;
        const increment = 0.2;
        const hitThreshold = 10;
        return (
            baseMultiplier +
            Math.floor(consecutiveHits / hitThreshold) * increment
        );
    };

    // Key Observables
    const keyObservable = <T>(e: Event, k: Key, pressed: boolean) =>
        fromEvent<KeyboardEvent>(document, e).pipe(
            filter(({ code }) => code === k),
            filter(({ repeat }) => !repeat),
            map(() => new KeyPress(k, pressed)),
        );

    // Key Observables For keys
    const keyDown = (k: Key) => keyObservable("keydown", k, true);
    const keyUp = (k: Key) => keyObservable("keyup", k, false);

    //Merge all the key
    const keys$ = merge(
        keyDown("KeyA"),
        keyUp("KeyA"),
        keyDown("KeyS"),
        keyUp("KeyS"),
        keyDown("KeyD"),
        keyUp("KeyD"),
        keyDown("KeyF"),
        keyUp("KeyF"),
    );
    const ticker = (s: State, elapsed: number): State => {
        // Shows the currenttime, its updated in state
        const currentTime = elapsed * Constants.TICK_RATE_MS;
        //console.log(elapsed * Constants.TICK_RATE_MS);
        const allNotesProcessed = notes.every(
            (note) => currentTime > note.end + 2000 && s.circle.length === 0,
        );
        // CHECKS IF ALL THE NOTES ARE PROCESSED
        if (allNotesProcessed) {
            return updateState(s, { gameEnd: true });
        }

        console.log();

        // GETS THE IDS OF EXISTING CIRCLES
        const existingCircleIds = new Set(s.circle.map((c) => c.id));

        //shoot = keyObservable('keydown','Space', ()=>new Shoot())
        // FILTERS THE CIRCLES AND CREATES THEM UNIQUELY
        const newCircles = notes
            .filter(
                (note) =>
                    note.played &&
                    !note.checked &&
                    note.start <= currentTime &&
                    currentTime <= note.end &&
                    !existingCircleIds.has(
                        "circle-" +
                            note.start +
                            "-" +
                            note.pitch +
                            "-" +
                            note.velocity +
                            "-" +
                            note.instrument,
                    ),
            )
            .map((note) => createCircle(s, note));

        //BACKGROUND NOTES
        const bgcircle = s.firstNoteReached
            ? notes
                  .filter(
                      (note) =>
                          !note.played &&
                          !note.checked &&
                          note.start + 2000 <= currentTime &&
                          currentTime <= note.end + 2000,
                  )
                  .map((note) => playbg(s, note))
            : [];
        const hitZone = { start: 340, end: 350 }; // Define a "hit zone" near the bottom of the canvas
        const anyKeyPressed = Object.values(s.keyPressed).some(
            (pressed) => pressed,
        );

        //UPDATES CIRCLE

        const updatedCircles = s.circle.map((circle) => {
            const newY = Math.min(circle.position.y, 350); // Increment by 10, max of 350
            const keyMap: { [key: number]: Key } = {
                0: "KeyA",
                1: "KeyS",
                2: "KeyD",
                3: "KeyF",
            };
            const keyIndex = circle.notearr.pitch % 4;
            const key = keyMap[keyIndex];

            //console.log(newY);
            if (
                newY >= hitZone.start &&
                newY <= hitZone.end &&
                s.keyPressed[key] &&
                !circle.notearr.alreadyhit
            ) {
                // YAYYY YOU PRESSED THE KEY ON TIME
                //console.log("YAAY KEY PRESSED ON TIME");

                playNotes(circle.notearr);
                notealreadyhit(s, circle.notearr);
                return {
                    ...circle,
                    hit: true,
                    alreadyhit: true,
                };
            } else if (anyKeyPressed && !circle.notearr.range) {
                // Note missed
                //playrandom();
                //console.log("Incorrect Key");
                return {
                    ...circle,
                    hit: false,
                };
            } else {
                return {
                    ...circle,
                };
            }
        });
        const anyCircleAt350 = updatedCircles.some(
            (circle) => circle.position.y === 350,
        );
        const circlesAbove330 = updatedCircles.filter(
            (circle) => circle.position.y > 330,
        );
        // PLAY RANDOM NOTES IF NOT ALLIGNED OR NO NOTES.
        if (
            (s.circle.length === 0 && anyKeyPressed) ||
            (circlesAbove330.length == 0 && anyKeyPressed)
        ) {
            playrandom();
        }

        const countCirclesAbove330 = circlesAbove330;

        //console.log(`Total count of notes: ${countAllNotes}`);

        const { score, consecutiveHits, multiplier } = updatedCircles.reduce(
            (acc, circle) => {
                //console.log(circle.position.y);
                if (circle.position.y > 340) {
                    circleinrange(s, circle.notearr);
                }
                if (circle.hit) {
                    // CHECKS IF CIRCLE IS HIT, IF YES THEN UPDATES VALUES ACCORDINGLY
                    //console.log("Something happening");
                    const newConsecutiveHits = acc.consecutiveHits + 1;
                    const newMultiplier =
                        calculateMultiplier(newConsecutiveHits);
                    return {
                        hit: false,
                        alreadyhit: true,
                        score: Math.round(acc.score + 1 * newMultiplier),
                        consecutiveHits: newConsecutiveHits,
                        multiplier: newMultiplier,
                    };
                } else if (
                    circle.position.y > hitZone.end &&
                    !circle.notearr.alreadyhit &&
                    !circle.notearr.missed
                ) {
                    // CHECKS IF CIRCLE IS MISSED, IF YES THEN UPDATES VALUES ACCORDINGLY
                    notemissed(s, circle.notearr);
                    return {
                        ...acc,
                        consecutiveHits: 0,
                        multiplier: 1,
                    };
                } else {
                    return acc;
                }
            },
            {
                score: s.score,
                consecutiveHits: s.consecutiveHits,
                multiplier: s.multiplier,
            },
        );
        //CHECKS IF THE TRUE NOTES HAVE REACHED THE BOTTOM TO START THE BG NOTES
        const firstNoteReached =
            s.firstNoteReached ||
            updatedCircles.some((circle) => circle.position.y === 350);

        // UPDATES AND RETURNS THE STATE
        const updatedState = {
            ...s,
            time: s.time + Constants.TICK_RATE_MS,
            circle: s.circle
                .map(moveCircle1)
                .concat(newCircles)
                .filter(
                    (c) => c.position.y - c.radius < Viewport.CANVAS_HEIGHT,
                ), // Filter out circles that move out of view
            bgnotes: bgcircle,
            score,
            consecutiveHits,
            multiplier,
            firstNoteReached: firstNoteReached,
        };

        return updatedState;
    };

    //STATE CHANGES
    const reduceState = (s: State, e: KeyPress | Tick): State => {
        if (e instanceof Tick) {
            return ticker(s, e.elapsed);
        }

        if (e instanceof KeyPress) {
            return {
                ...s,
                keyPressed: {
                    ...s.keyPressed,
                    [e.key]: e.pressed,
                },
            };
        }

        return s;
    };
    //HIT NOTES
    const circleinrange = (s: State, note: NoteObject) => {
        note.range = true;
        return note;
    };
    //HIT NOTES
    const notealreadyhit = (s: State, note: NoteObject) => {
        note.alreadyhit = true;
        return note;
    };

    //MISSED NOTES
    const notemissed = (s: State, note: NoteObject) => {
        note.missed = true;
        return note;
    };

    //PLAYS THE BACKGROUND NOTES
    const playbg = (s: State, note: NoteObject) => {
        note.checked = true;
        samples[note.instrument].triggerAttackRelease(
            // TRIGERATTACKRELEASE
            Tone.Frequency(note.pitch, "midi").toNote(),
            (note.end - note.start) / 1000,
            undefined,
            note.velocity / 127,
        );

        return note;
    };

    //PLAYS THE RANDOM NOTES
    const playrandom = () => {
        samples["bass-electric"].triggerAttackRelease(
            // TRIGERATTACKRELEASE
            Tone.Frequency(67, "midi").toNote(),
            100 / 1000,
            undefined,
            117 / 127,
        );
    };

    const playRandomNote = (samples: { [key: string]: Tone.Sampler }) => {
        const instruments = Object.keys(samples);
        const randomInstrument =
            instruments[Math.floor(Math.random() * instruments.length)];
        const randomPitch = Math.floor(Math.random() * 88) + 21; // Random MIDI pitch between 21 and 108
        const randomVelocity = Math.floor(Math.random() * 127) + 1; // Random velocity between 1 and 127
        const randomDuration = Math.random() * 0.5; // Random duration between 0 and 0.5 seconds

        samples[randomInstrument].triggerAttackRelease(
            Tone.Frequency(randomPitch, "midi").toNote(),
            randomDuration,
            undefined,
            randomVelocity / 127,
        );
    };

    //CREATES THE CIRCLE AND RETURNS IT TO THE STATE

    const createCircle = (s: State, note: NoteObject): Circle => {
        note.checked = true;

        return {
            id: `circle-${s.time}-${note.pitch}-${note.velocity}-${note.instrument}`,
            position: new Vec(Viewport.CANVAS_WIDTH, -20), // Start at the top of the canvas
            radius: Note.RADIUS,
            velocity: new Vec(0, 2),
            isActive: true,
            notearr: note,
            bgnotes: note,
            pressed: false,
            allnotes: notes,
            hit: false,
            alreadyhit: false,
            randomnoteplayed: false,
            missed: false,
            range: false,
        };
    };

    //ENDS

    // PLAY INSTRUMENT FUNCTION BACKGROUND NOTES
    function playInstrument(note: NoteObject) {
        samples[note.instrument].triggerAttackRelease(
            // TRIGERATTACKRELEASE
            Tone.Frequency(note.pitch, "midi").toNote(),
            (note.end - note.start) / 1000,
            undefined,
            note.velocity / 127,
        );
    }

    // PLAY NOTES FUNCTION
    function playNotes(note: NoteObject) {
        setTimeout(() => {
            samples[note.instrument].triggerAttackRelease(
                // TRIGERATTACKRELEASE
                Tone.Frequency(note.pitch, "midi").toNote(),
                (note.end - note.start) / 1000,
                undefined,
                note.velocity / 127,
            );
        }, 0);
    }

    // Canvas elements
    const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
        HTMLElement;
    const preview = document.querySelector(
        "#svgPreview",
    ) as SVGGraphicsElement & HTMLElement;
    const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
        HTMLElement;
    const container = document.querySelector("#main") as HTMLElement;

    svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
    svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);

    // Text fields
    const multiplier = document.querySelector("#multiplierText") as HTMLElement;
    const scoreText = document.querySelector("#scoreText") as HTMLElement;
    const highScoreText = document.querySelector(
        "#highScoreText",
    ) as HTMLElement;

    /** Determines the rate of time steps */
    //const tick$ = interval(500);

    // RENDER FUNCTION TO RENDER THE CIRCLES
    const render1 = (s: State) => {
        // Gets score and multiplier from the state and updates the text
        scoreText.textContent = s.score.toString();
        multiplier.textContent = s.multiplier.toFixed(1) + "x";

        // Clears the canvas
        s.circle.forEach((circle) => {
            //console.log("FOREACH AGAIN?");
            // Checks if the circle is active
            if (circle.isActive == true) {
                // Identifies the color of the circle based on the pitch % 4 (heuristic)
                const coloridentifier =
                    circle.notearr.pitch % 4 == 3
                        ? "yellow"
                        : circle.notearr.pitch % 4 == 2
                          ? "blue"
                          : circle.notearr.pitch % 4 == 1
                            ? "red"
                            : "green";

                // Identifies the column of the circle based on the pitch % 4 (heuristic)
                const columnidentifier =
                    circle.notearr.pitch % 4 == 3
                        ? "80%"
                        : circle.notearr.pitch % 4 == 2
                          ? "60%"
                          : circle.notearr.pitch % 4 == 1
                            ? "40%"
                            : "20%";

                // Creates the circle element
                const greenCircle = createSvgElement(
                    svg.namespaceURI,
                    "circle",
                    {
                        r: `${Note.RADIUS}`,
                        cx: columnidentifier,
                        cy: String(circle.position.y),
                        style: "fill:" + coloridentifier,
                        class: "shadow",
                        id: circle.id,
                    },
                ) as SVGCircleElement;
                svg.appendChild(greenCircle); // Appends the circle to the canvas

                //svg.appendChild(yellowRect);
            } else {
                // Updates the position of the circles and removes them if they reach the bottom and other rendering stuff
                const circle1 = document.getElementById(circle.id)!;

                if (circle1) {
                    const oldY = parseInt(circle1.getAttribute("cy")!);

                    if (oldY >= 350) {
                        // Removes the circle once it reaches 350
                        svg.removeChild(circle1);
                    } else {
                        // Otherwise updates the latest position of the circle
                        circle1.setAttribute("cy", String(circle.position.y));
                    }
                }
            }
        });
        return s;
    };
    /**
     * Renders the current state to the canvas.
     *
     * In MVC terms, this updates the View using the Model.
     *
     * @param s Current state
     */

    // RENDER FUNCTION TO RENDER THE CIRCLES. All Side Effects are called here
    const subscription = merge(tick$, keys$)
        .pipe(scan(reduceState, initialState))
        .subscribe((s) => {
            // Renders the circles
            render1(s);
            // Checks if the game has ended
            if (s.gameEnd) {
                show(gameover);
                subscription.unsubscribe();
            }
        });
}

// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    // Load in the instruments and then start your game!
    const samples = SampleLibrary.load({
        instruments: [
            "bass-electric",
            "violin",
            "piano",
            "trumpet",
            "saxophone",
            "trombone",
            "flute",
        ], // SampleLibrary.list,
        baseUrl: "samples/",
    });

    const startGame = (contents: string) => {
        const startButton = document.getElementById("start");
        if (startButton) {
            startButton.addEventListener(
                "click",
                function () {
                    main(contents, samples);
                    console.log("Running main");
                    startButton.innerText = "Stop";
                },
                { once: true },
            );
        } else {
            console.error("Start button not found");
        }
    };

    const { protocol, hostname, port } = new URL(import.meta.url);
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;

    Tone.ToneAudioBuffer.loaded().then(() => {
        for (const instrument in samples) {
            samples[instrument].toDestination();
            samples[instrument].release = 0.5;
        }

        fetch(`${baseUrl}/assets/${Constants.SONG_NAME}.csv`)
            .then((response) => response.text())
            .then((text) => startGame(text))
            .catch((error) =>
                console.error("Error fetching the CSV file:", error),
            );
    });
}
