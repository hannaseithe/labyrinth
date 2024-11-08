var config, data, canvas;

function initExtraCard(x, y) {
    data.extraCard = {
        shape: Math.floor(Math.random() * 4) % 4,
        orientation: Math.floor(Math.random() * 4) % 4,
        fixed: false
    };
    config.extraCardPosition = {
        x: x * config.cardSize + config.cardSize,
        y: 0
    };
    data.clickableShapes.push({
        points: [{
            x: config.extraCardPosition.x + config.margin,
            y: config.extraCardPosition.y + config.margin
        }],
        cat: config.interactiveType.EXTRACARD
    });
}

function initEndTurnButton() {
    config.endTurnButtonPosition = {
        x: config.extraCardPosition.x,
        y: canvas.height - Math.floor(config.cardSize / 2)
    }

    data.rectangleButtons.push({
        cat: config.interactiveType.ENDTURNBUTTON,
        points: [{
            x: config.endTurnButtonPosition.x + config.margin,
            y: config.endTurnButtonPosition.y - config.margin
        }],
        width: config.cardSize,
        height: canvas.height - config.endTurnButtonPosition.y,
        label: 'End Turn'
    })
}


function initButtons(x, y) {
    for (var j = 0; j < x; j++) {
        if (j % 2 == 1) {
            data.buttonShapes.push({
                points: [{
                    x: j,
                    y: -1
                }],
                direction: config.shiftDirection.DOWN,
                cat: config.interactiveType.BUTTON,
                enabled: true
            });
            data.buttonShapes.push({
                points: [{
                    x: j,
                    y: -1
                }],
                direction: config.shiftDirection.UP,
                cat: config.interactiveType.BUTTON,
                enabled: true
            });
        }
    }
    for (var j = 0; j < y; j++) {
        if (j % 2 == 1) {
            data.buttonShapes.push({
                points: [{
                    y: j,
                    x: 0 + config.margin / 2
                }],
                direction: config.shiftDirection.RIGHT,
                cat: config.interactiveType.BUTTON,
                enabled: true
            });
            data.buttonShapes.push({
                points: [{
                    y: j,
                    x: -1
                }],
                direction: config.shiftDirection.LEFT,
                cat: config.interactiveType.BUTTON,
                enabled: true
            });
        }
    }
}

export function initLab(x, y, c, d, can) { // create Lab var mit width:x and height:y + set fixed stones + fill random cards
    config = c;
    data = d;
    canvas = can;

    canvas.width = x * config.cardSize + 2 * config.cardSize + config.margin * 2;
    canvas.height = y * config.cardSize + config.margin * 2;

    initExtraCard(x, y);
    initButtons(x, y);
    initEndTurnButton();

    for (var i = 0; i < y; i++) {
        data.lab[i] = []
        for (var j = 0; j < x; j++) {
            data.lab[i][j] = undefined
        }
    }

    data.lab[0][0] = {
        shape: config.cardType.CORNER,
        orientation: 1,
        fixed: true,
        number: undefined
    };
    data.lab[0][x-1] = {
        shape: config.cardType.CORNER,
        orientation: 2,
        fixed: true,
        number: undefined
    };
    data.lab[y-1][x-1] = {
        shape: config.cardType.CORNER,
        orientation: 3,
        fixed: true,
        number: undefined
    };
    data.lab[y-1][0] = {
        shape: config.cardType.CORNER,
        orientation: 0,
        fixed: true,
        number: undefined
    };


    for (var i = 0; i < y; i++) {
        for (var j = 0; j < x; j++) {
            if (!data.lab[i][j]) {
                data.lab[i][j] = {
                    shape: Math.floor(Math.random() * 4) % 4,
                    orientation: Math.floor(Math.random() * 4) % 4,
                    fixed: ((i % 2 == 0) && (j % 2 == 0)),
                    number: undefined
                }
            }
        }
    }



    let amountNumbers = Math.floor((x * y) / 3);
    for (let i = 0; i < amountNumbers; i++) {
        let numberSet = false;
        while (!numberSet) {
            let randomX = Math.floor(Math.random() * x);
            let randomY = Math.floor(Math.random() * y);
            console.log("randomX & randomY", randomX, randomY);
            if (!data.lab[randomX][randomY].number) {
                console.log("!data.lab.number")
                data.lab[randomX][randomY].number = i + 1;
                numberSet = true;
            }
        }

    }
}

export function initPlayers(amountPlayers, x, y) {
    let amountNumbers = Math.floor((x * y) / 3);
    console.log("amountNumbers", amountNumbers);
    let usedNumbers = new Array(amountNumbers);
    for (let i = 0; i < amountPlayers; i++) {
        let indexX = (i % 2) * (x - 1);
        let indexY = ((Math.floor(i / 2)) % 2) * (y - 1);
        let listNumbers = [];
        for (let j = 0; j < Math.floor(amountNumbers / amountPlayers); j++) {
            let newNumber = Math.floor(Math.random() * amountNumbers);
            while (usedNumbers[newNumber]) {
                newNumber = Math.floor(Math.random() * amountNumbers);
            }
            usedNumbers[newNumber] = true;
            listNumbers.push({ number: newNumber + 1, solved: false })
        }
        data.players[i] = {
            currentIndex: [indexX, indexY],
            listNumbers: listNumbers,
            isDragging: false,
            draggingPosition: [],
            cat: config.interactiveType.PLAYER,
            name: "Player " + i
        };
    }
}