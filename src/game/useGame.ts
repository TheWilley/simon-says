import {useCallback, useEffect, useRef, useState} from 'react';
import useSound from 'use-sound';
import dial from '../sounds/dial.mp3';

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

function arraysAreEqualSoFar<T>(arr1: T[], arr2: T[]) {
    return JSON.stringify(arr2.slice(0, arr1.length)) === JSON.stringify(arr1);
}

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

export default function useGame() {
    // REFS
    const gameBoardRef = useRef<HTMLDivElement>(null);
    const startButtonRef = useRef<HTMLButtonElement>(null);

    // STATES
    const [allowUserInput, setAllowUserInput] = useState<boolean>(false);
    const [gameStarted, setGameStarted] = useState<boolean>(false);
    const [currentNoteInSequence, setCurrentNoteInSequence] = useState<{value: number}>({value: 0});
    const [round, setRound] = useState<number>(0);
    const [generatedNotes, setgeneratedNotes] = useState<number[]>([]);
    const [userNotes, setUserNotes] = useState<number[]>([]);
    const [gameIsWon, setGameIsWon] = useState<boolean>(true);
    const [playbackRate, setPlaybackrate] = useState<number>(0.75);

    // HOOKS
    const [play] = useSound(dial, {
        playbackRate
    });

    // Class specifics - used for animation
    const animationsHandler = {
        showBoard: () => {
            gameBoardRef.current?.classList.remove('initialBoard');
            startButtonRef.current?.classList.remove('fadeIn');
            startButtonRef.current?.classList.add('fadeOut');
            gameBoardRef.current?.classList.remove('tableflip');
            gameBoardRef.current?.classList.add('reverseTableflip');
        },
        showStart: () => {
            gameBoardRef.current?.classList.remove('reverseTableflip');
            gameBoardRef.current?.classList.add('tableflip');
            startButtonRef.current?.classList.remove('fadeOut');
            startButtonRef.current?.classList.add('fadeIn');
        }
    };

    /**
     * Simulates "play" of the generated number sequence by
     * playing and displaying each note after 500ms.
     */
    const playNotes = async () => {
        setAllowUserInput(false);
        for (const value of generatedNotes) {
            await delay(1000);
            setCurrentNoteInSequence({value});
            setPlaybackrate(1 + value * 0.3);
            play();
        }
        await delay(500);
        setAllowUserInput(true);
    };

    /**
     * Adds a random value between 0 and 3 to the sequence state.
     */
    const addRandomNoteToSequence = useCallback(() => {
        const pickedColor = getRandomInt(0, 3);
        setgeneratedNotes([...generatedNotes, pickedColor]);
    }, [generatedNotes]);

    /**
     * Adds a value to the user inputs state and play the associated note.
     */
    const addNoteToUserInputs = useCallback((value: number) => {
        setUserNotes([...userNotes, value]);
        setPlaybackrate(1 + value * 0.3);
        play();
    }, [play, userNotes]);

    /**
     * Starts the game.
     */
    const start = useCallback(() => {
        setGameStarted(true);
        addRandomNoteToSequence();
        animationsHandler.showBoard();
    }, []);

    /**
     * Resets the game states.
     */
    const resetGame = useCallback(() => {
        setGameStarted(false);
        setRound(0);
        setgeneratedNotes([]);
        setUserNotes([]);
        setCurrentNoteInSequence(-1);
        setGameIsWon(true);
        animationsHandler.showStart();
    }, []);

    /**
     * Every time the sequence state is updated, we run the `play` function.
     */
    useEffect(() => {
        playNotes();
    }, [JSON.stringify(generatedNotes)]);

    /**
     * Every time the user presses a note, we check if it's the correct one
     * and if we can move on to the next round.
     */
    useEffect(() => {
        if (generatedNotes.length > 0) {
            const gameIsLost = arraysAreEqualSoFar(userNotes, generatedNotes);
            setGameIsWon(gameIsLost);
            if (userNotes.length === generatedNotes.length && gameIsLost) {
                addRandomNoteToSequence();
                setUserNotes([]);
                setRound(round + 1);
            }
        }
    }, [JSON.stringify(userNotes)]);

    /**
     * Checks if the game is lost, and resets game if it is.
     */
    useEffect(() => {
        if (!gameIsWon) {
            resetGame();
        }
    }, [gameIsWon]);

    return {
        gameBoardRef,
        startButtonRef,
        allowUserInput,
        gameStarted,
        round,
        currentNoteInSequence,
        addRandomNoteToSequence,
        addNoteToUserInputs,
        start
    };
}