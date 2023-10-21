//// INIT
led.enable(false)
let stripArr: neopixel.Strip[] = [];
let NUM_LEDS_PER_STRIP = 18;
let PINS_ARR = [
    DigitalPin.P0,
    DigitalPin.P1,
    DigitalPin.P2,
    DigitalPin.P8,
    DigitalPin.P9,
    DigitalPin.P13,
    DigitalPin.P14,
    DigitalPin.P15];
for (let i = 0; i < PINS_ARR.length; i++) {
    let strip = neopixel.create(PINS_ARR[i], NUM_LEDS_PER_STRIP, NeoPixelMode.RGB);
    strip.clear();
    // strip.setBrightness(50)
    strip.show();
    stripArr.push(strip);
}
let NUM_STRIPS = stripArr.length

// external buttons
let PIN_BUTTON_A = DigitalPin.P19
let PIN_BUTTON_B = DigitalPin.P20
let buttonStateA = 1
let buttonStateB = 1
let lastDebounceTimeA = 0
let lastDebounceTimeB = 0
let lastButtonStateA = 0
let lastButtonStateB = 0
pins.setPull(PIN_BUTTON_A, PinPullMode.PullUp)
pins.setPull(PIN_BUTTON_B, PinPullMode.PullUp)

// consts
let INITIAL_LEVEL = 2
let BUTTON_A = 1
let BUTTON_B = 0
let ANIM_SWIPE_OFFSET = 10
let PIN_PRESSED = 0
let PIN_RELEASED = 1

// init
let currentLayer = 0
let currentButtonA = stripArr[0]
let currentButtonB = stripArr[7]
let firstEntry = true
let isCorrect = false
let currentLevel = INITIAL_LEVEL
let canContinue = true
let canPress = true
let arrInput: number[] = []
let arrCorrect: number[] = []

// color
let colOrange = 16725760

let colButtonPressed = NeoPixelColors.Blue
let colCorrectPattern = NeoPixelColors.White
let colPassedLayer = NeoPixelColors.Green
let colWrongPattern = NeoPixelColors.Red
let colInitialSwipe = NeoPixelColors.White
let colWin = NeoPixelColors.Green
let colEmpty = colOrange
let colOff = NeoPixelColors.Black

// time
let TIME_DEBOUNCE = 30
let TIME_LIMIT = 200000
let PATTERN_PAUSE = 400
let CORRECT_WRONG_PAUSE = 400
let INIT_DELAY = 500
let ANIM_SWIPE_DELAY = 50

// states
let TESTING = -2
let INITIALIZATION = -1
let GENERATING_PATTERN = 0
let SHOW_PATTERN = 1
let CHECKING_INPUT = 2
let CORRECT_INPUT = 3
let WRONG_INPUT = 4

//// STATE MACHINE
let state = INITIALIZATION
// state = TESTING
basic.forever(function () {
    if (canPress){
        debounceButtonA()
        debounceButtonB()
    }

    if (canContinue) {
        if (state === TESTING) {
            animSwipe(colWrongPattern, colEmpty, ANIM_SWIPE_DELAY, ANIM_SWIPE_OFFSET)
            pause(1000)
        }

        else if (state === INITIALIZATION) {
            canPress = false
            animSwipe(colOff, colEmpty, ANIM_SWIPE_DELAY, ANIM_SWIPE_OFFSET)
            pause(INIT_DELAY)
            animSwipe(colInitialSwipe, colEmpty, ANIM_SWIPE_DELAY, ANIM_SWIPE_OFFSET)
            pause(INIT_DELAY)
            state = GENERATING_PATTERN
        }

        else if (state === GENERATING_PATTERN) {
            canPress = false
            getButtonStrips()
            for (let i = 0; i < currentLevel; i++) {
                let randomBit = randint(0, 1)
                while (i >= 2 && arrCorrect[i - 2] === randomBit && arrCorrect[i - 1] === randomBit) {
                    randomBit = randint(0, 1)
                }
                arrCorrect.push(randomBit)
            }
            state = SHOW_PATTERN
        }

        else if (state === SHOW_PATTERN) {
            canPress = false
            pause(500)
            showPattern()
            state = CHECKING_INPUT
        }

        else if (state === CHECKING_INPUT) {
            canPress = true
            if (arrInput.length !== 0) {
                for (let j = 0; j < arrInput.length; j++) {
                    if (arrInput[j] !== arrCorrect[j]) {
                        state = WRONG_INPUT
                    } else {
                        if (j === arrCorrect.length - 1) {
                            state = CORRECT_INPUT
                        }
                    }
                }
            }
        }

        else if (state === CORRECT_INPUT) {
            canPress = false
            arrInput = []
            arrCorrect = []
            currentLevel = currentLevel + 1
            currentLayer = currentLayer + 1
            showPassedLayer()
            if (currentLayer === NUM_STRIPS / 2) {
                gameWin()
            }
            state = GENERATING_PATTERN
        }

        else if (state === WRONG_INPUT) {
            canPress = false
            arrInput = []
            arrCorrect = []
            currentLayer = 0
            animSwipeReverse(colWrongPattern, colEmpty, ANIM_SWIPE_DELAY, ANIM_SWIPE_OFFSET)
            currentLevel = INITIAL_LEVEL
            state = GENERATING_PATTERN
        }
    }
})

//// FUNCTIONS

function showButton(button: number) {
    if (button === BUTTON_A) {
        currentButtonA.showColor(colCorrectPattern)
    } else if (button === BUTTON_B) {
        currentButtonB.showColor(colCorrectPattern)
    }
}

function clearButton(button: number) {
    if (button === BUTTON_A) {
        currentButtonA.showColor(colEmpty)
    } else if (button === BUTTON_B) {
        currentButtonB.showColor(colEmpty)
    }
}

function animColor(color: NeoPixelColors) {
    for (let i = 0; i < NUM_STRIPS; i++) {
        stripArr[i].showColor(color)
    }
}

function animSwipe(colorIn: NeoPixelColors, colorOut: NeoPixelColors, delay: number, offset: number) {
    for (let i = 0; i < NUM_STRIPS/2 + offset; i++) {
        if (i < NUM_STRIPS/2) {
            stripArr[i].showColor(colorIn)
            stripArr[NUM_STRIPS-1-i].showColor(colorIn)
        }
        if (i >= offset) {
            stripArr[i - offset].showColor(colorOut)
            stripArr[NUM_STRIPS-1-(i - offset)].showColor(colorOut)
        }
        pause(delay)
    }
}

function animSwipeReverse(colorIn: NeoPixelColors, colorOut: NeoPixelColors, delay: number, offset: number) {
    for (let i = 0; i < NUM_STRIPS/2 + offset; i++) {
        if (i < NUM_STRIPS/2) {
            stripArr[NUM_STRIPS/2 - 1 - i].showColor(colorIn)
            stripArr[NUM_STRIPS/2 + i].showColor(colorIn)
        }
        if (i >= offset) {
            stripArr[NUM_STRIPS/2 - 1 - i + offset].showColor(colorOut)
            stripArr[NUM_STRIPS/2 + i - offset].showColor(colorOut)
        }
        pause(delay)
    }
}

function animSwipeDir(colorIn: NeoPixelColors, colorOut: NeoPixelColors, delay: number, offset: number) {
    for (let i = 0; i < NUM_STRIPS + offset; i++) {
        if (i < NUM_STRIPS) {
            stripArr[i].showColor(colorIn)
        }
        if (i >= offset) {
            stripArr[i - offset].showColor(colorOut)
        }
        pause(delay)
    }
}

function animSwipeReverseDir(colorIn: NeoPixelColors, colorOut: NeoPixelColors, delay: number, offset: number) {
    for (let i = 0; i < NUM_STRIPS + offset; i++) {
        if (i < NUM_STRIPS) {
            stripArr[NUM_STRIPS - 1 - i].showColor(colorIn)
        }
        if (i >= offset) {
            stripArr[NUM_STRIPS - 1 - i + offset].showColor(colorOut)
        }
        pause(delay)
    }
}

function showPassedLayer() {
    currentButtonA.showColor(colPassedLayer)
    currentButtonB.showColor(colPassedLayer)
}

function gameWin() {
    animSwipeReverse(colOff, colOff, ANIM_SWIPE_DELAY, 1)
    pause(200)
    animSwipe(colWin, colEmpty, ANIM_SWIPE_DELAY, ANIM_SWIPE_OFFSET)
    currentLayer = 0
    currentLevel = INITIAL_LEVEL
}

function getButtonStrips() {
    currentButtonA = stripArr[0 + currentLayer]
    currentButtonB = stripArr[7 - currentLayer]
}

function clearAll() {
    for (let i = 0; i < NUM_STRIPS; i++) {
        let strip = stripArr[i]
        strip.showColor(colEmpty)
    }
}

function showPattern() {
    for (let k = 0; k < arrCorrect.length; k++) {
        pause(PATTERN_PAUSE)
        showButton(arrCorrect[k])
        pause(PATTERN_PAUSE)
        clearButton(arrCorrect[k])
    }
}

//// INPUTS
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_A, EventBusValue.MICROBIT_EVT_ANY, function () {
    if (canPress) {
        if (control.eventValue() === EventBusValue.MICROBIT_BUTTON_EVT_DOWN) {
            arrInput.push(BUTTON_A)
            currentButtonA.showColor(colButtonPressed)
            canContinue = false
        } else if (control.eventValue() === EventBusValue.MICROBIT_BUTTON_EVT_UP) {
            currentButtonA.showColor(colEmpty)
            canContinue = true
        }
    }
})
control.onEvent(EventBusSource.MICROBIT_ID_BUTTON_B, EventBusValue.MICROBIT_EVT_ANY, function () {
    if (canPress) {
        if (control.eventValue() === EventBusValue.MICROBIT_BUTTON_EVT_DOWN) {
            arrInput.push(BUTTON_B)
            currentButtonB.showColor(colButtonPressed)
            canContinue = false
        } else if (control.eventValue() === EventBusValue.MICROBIT_BUTTON_EVT_UP) {
            currentButtonB.showColor(colEmpty)
            canContinue = true
        }
    }
})

//// DEBOUNCIONG

function debounceButtonA(){
    let currentTime = input.runningTime()

    let buttonRead = pins.digitalReadPin(PIN_BUTTON_A)
    if (buttonRead !== lastButtonStateA){
        lastDebounceTimeA = currentTime
    }
    if (input.runningTime() - lastDebounceTimeA > TIME_DEBOUNCE){
        if (buttonRead !== buttonStateA){
            buttonStateA = buttonRead
            if (buttonStateB !== PIN_PRESSED){
                if (buttonStateA === PIN_PRESSED){
                    if (buttonStateB !== PIN_PRESSED){
                        canContinue = false
                        arrInput.push(BUTTON_A)
                        currentButtonA.showColor(colButtonPressed)
                    }
                } else {
                    canContinue = true
                    currentButtonA.showColor(colEmpty)
                }
            }
        }
    }
    lastButtonStateA = buttonRead
}

function debounceButtonB() {
    let currentTime = input.runningTime()

    let buttonRead = pins.digitalReadPin(PIN_BUTTON_B)
    if (buttonRead !== lastButtonStateB) {
        lastDebounceTimeB = currentTime
    }
    if (input.runningTime() - lastDebounceTimeB > TIME_DEBOUNCE) {
        if (buttonRead !== buttonStateB) {
            buttonStateB = buttonRead
            if (buttonStateA !== PIN_PRESSED){
                if (buttonStateB === PIN_PRESSED) {
                    canContinue = false
                    arrInput.push(BUTTON_B)
                    currentButtonB.showColor(colButtonPressed)
                } else {
                    canContinue = true
                    currentButtonB.showColor(colEmpty)
                }
            }
        }
    }
    lastButtonStateB = buttonRead
}