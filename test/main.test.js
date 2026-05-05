import { assert, describe, expect, it, beforeEach } from "vitest";
import { main } from "../src/main";


describe('main', () => {
    let initialState;

    beforeEach(() => {
        initialState = {
            circle: [],
            bgnotes: [],
            score: 0,
            consecutiveHits: 0,
            multiplier: 1,
            circleCounter: 0,
            firstNoteTimestamp: null,
            startTimestamp: null,
            keyPressed: {
                KeyA: false,
                KeyS: false,
                KeyD: false,
                KeyF: false,
            },
            time: 0,
            gameEnd: false,
        };
    });

    it('should update score, consecutiveHits, and multiplier correctly when a circle is hit', () => {
        const notes = [
            { start: 0, end: 1000, pitch: 1, velocity: 1, instrument: 'piano', played: true, checked: false },
        ];
        const elapsed = 1; // 1 tick

        // Simulate a circle being hit
        const stateWithHitCircle = {
            ...initialState,
            circle: [
                {
                    id: 'circle-0-1-1-piano',
                    position: { y: 350 },
                    velocity: { y: 10 },
                    radius: 10,
                    notearr: notes[0],
                    isActive: true,
                    hit: true,
                },
            ],
            notes,
        };

        const state = ticker(stateWithHitCircle, elapsed);

        expect(state.score).toBe(1);
        expect(state.consecutiveHits).toBe(1);
        expect(state.multiplier).toBe(1); // Assuming calculateMultiplier(1) returns 1
    });

    it('should reset multiplier to 1 when a circle is missed', () => {
        const notes = [
            { start: 0, end: 1000, pitch: 1, velocity: 1, instrument: 'piano', played: true, checked: false },
        ];
        const elapsed = 1; // 1 tick

        // Simulate a circle being missed
        const stateWithMissedCircle = {
            ...initialState,
            circle: [
                {
                    id: 'circle-0-1-1-piano',
                    position: { y: 350 },
                    velocity: { y: 10 },
                    radius: 10,
                    notearr: notes[0],
                    isActive: true,
                    hit: false,
                },
            ],
            notes,
        };

        const state = ticker(stateWithMissedCircle, elapsed);

        expect(state.multiplier).toBe(1);
    });
});
