/*Type Card {
    shape: CORNER || STRAIGHT || TCROSS || CROSS
    orientation: 0||1||2||3
    fixed: true || false
}*/
// corner orientation: 1 	--> top:1 AND right:1 (rest:0)
// straight orientation: 1 	--> top:1 AND bottom:1 (rest:0)
// t-cross orientation: 1	--> top:1 AND right:1 AND bottom:1 (left:0)
// cross orientation:1		--> all:1
// canvas variables

import { findPath } from './findPath.js';
import { drawLab } from './drawLab.js';
import { initLab, initPlayers } from './initLab.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const config = {
    cardSize: 50,
    margin: 20,
    playerRadius: 10,
    buttonRadius: 6,
    extraCardPosition: undefined,
    cardType: {
        CORNER: 0,
        STRAIGHT: 1,
        TCROSS: 2,
        CROSS: 3
    },
    interactiveType: {
        EXTRACARD: 0,
        BUTTON: 1,
        PLAYER: 2,
        ENDTURNBUTTON: 3
    },
    shiftDirection: {
        DOWN: 0,
        LEFT: 1,
        UP: 2,
        RIGHT: 3
    }
}

const data = {
    lab: [],
    players: [],
    buttonShapes: [],
    clickableShapes: [],
    rectangleButtons: [],
    isDragging: false,
    extraCard: undefined,
    game: {}
}

function rotateExtraCard() {
    data.extraCard.orientation++;
    drawLab(config, data, ctx);
}

function playersinRow(row) {
    var result = [];
    data.players.forEach((player) => {
        if (player.currentIndex[0] == row) {
            result.push(player)
        }
    })
    return result;
}

function playersinLine(line) {
    var result = [];
    data.players.forEach((player) => {
        if (player.currentIndex[1] == line) {
            result.push(player)
        }
    })
    return result;
}

function shiftCards(index, direction) {
    var cardonStack = data.extraCard;
    var newCardonStack;

    switch (direction) {
        case config.shiftDirection.DOWN:
            var movePlayer = playersinRow(index);
            data.lab.forEach((line) => {
                newCardonStack = line[index];
                line[index] = cardonStack;
                cardonStack = newCardonStack;
            })
            movePlayer.forEach((player) => {
                player.currentIndex[1] = (player.currentIndex[1] + 1) % data.lab.length
            });
            break;
        case config.shiftDirection.UP:
            var movePlayer = playersinRow(index);
            for (var i = data.lab.length; i > 0; i--) {
                newCardonStack = data.lab[i - 1][index];
                data.lab[i - 1][index] = cardonStack;
                cardonStack = newCardonStack;
            }
            movePlayer.forEach((player) => {
                player.currentIndex[1] = (data.lab.length + player.currentIndex[1] - 1) % data.lab.length
            });
            break;
        case config.shiftDirection.RIGHT:
            var movePlayer = playersinLine(index);
            data.lab[index].forEach((card, ind, array) => {
                newCardonStack = card;
                array[ind] = cardonStack;
                cardonStack = newCardonStack;
            })
            movePlayer.forEach((player) => {
                player.currentIndex[0] = (player.currentIndex[0] + 1) % data.lab[0].length
            });
            break;
        case config.shiftDirection.LEFT:
            var movePlayer = playersinLine(index);
            for (var i = data.lab[0].length; i > 0; i--) {
                newCardonStack = data.lab[index][i - 1];
                data.lab[index][i - 1] = cardonStack;
                cardonStack = newCardonStack;
            }
            movePlayer.forEach((player) => {
                player.currentIndex[0] = (data.lab.length + player.currentIndex[0] - 1) % data.lab[0].length
            });
            break;
    }
    data.extraCard = newCardonStack;
    disableAllButtons();
    logShift(index, direction);
    drawLab(config, data, ctx);
}

function initGame() {
    data.game.turns = [{ player: 0 }];
    drawLab(config, data, ctx);
}

function logPlayerPosition(card) { }
function logShift(index, direction) {
    let turns = data.game.turns;
    turns[turns.length - 1].shift = {
        index: index,
        direction: direction
    }
}

function getButtonfromShift(shift) {
    let buttons = data.buttonShapes;
    return buttons.find((button) => {
        if (button.direction == shift.direction) {
            switch (shift.direction) {
                case config.shiftDirection.UP:
                case config.shiftDirection.DOWN:
                    return shift.index == button.points[0].x;
                case config.shiftDirection.LEFT:
                case config.shiftDirection.RIGHT:
                    return shift.index == button.points[0].y;
            }
        }
        return false
    })
}

function disableLastShiftButton() {
    let turns = data.game.turns;
    let lastShift = turns[turns.length - 1].shift;
    if (lastShift) {
        let button = getButtonfromShift(lastShift);
        button.enabled = false;
    }

}

function enableAllButtons() {
    data.buttonShapes.forEach((button) => button.enabled = true)
}

function disableAllButtons() {
    data.buttonShapes.forEach((button) => button.enabled = false)
}

function endTurn(card) {
    logPlayerPosition(card);
    let turns = data.game.turns;
    let playerIndex = turns[turns.length - 1].player;
    enableAllButtons();
    disableLastShiftButton();
    turns.push({ player: (playerIndex + 1) % data.players.length });
}


function defineShape(shape) {
    var points = shape.points;
    switch (shape.cat) {
        case config.interactiveType.PLAYER:
            ctx.beginPath();
            if (!shape.isDragging) {
                let point = getPlayerPixels(shape);
                ctx.arc(point[0], point[1], config.playerRadius, 0, 2 * Math.PI);
            } else {
                ctx.arc(shape.draggingPosition[0], shape.draggingPosition[1],
                    config.playerRadius, 0, 2 * Math.PI);
            }
            break;
        case config.interactiveType.BUTTON:
            let point = getButtonPixels(shape);
            ctx.beginPath();
            ctx.arc(point[0], point[1], config.buttonRadius, 0, 2 * Math.PI);
            break;
        case config.interactiveType.EXTRACARD:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[0].x + config.cardSize, points[0].y);
            ctx.lineTo(points[0].x + config.cardSize, points[0].y + config.cardSize);
            ctx.lineTo(points[0].x, points[0].y + config.cardSize);
            break;
        case config.interactiveType.ENDTURNBUTTON:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[0].x + shape.width, points[0].y);
            ctx.lineTo(points[0].x + shape.width, points[0].y + shape.height);
            ctx.lineTo(points[0].x, points[0].y + shape.height);
        default:
            break;
    }
}

function getCardFromMousePosition(x, y) {
    let xIndex = Math.floor((x - config.margin) / config.cardSize);
    let yIndex = Math.floor((y - config.margin) / config.cardSize);
    if ((xIndex < data.lab.length) & (yIndex < data.lab[0].length)) {
        return [xIndex, yIndex]
    }
    return undefined
}

export function getButtonPixels(button) {
    let dir = config.shiftDirection;
    switch (button.direction) {
        case dir.DOWN:
            return [
                button.points[0].x * config.cardSize + config.margin + Math.floor(config.cardSize / 2),
                config.margin / 2
            ];
        case dir.UP:
            return [
                button.points[0].x * config.cardSize + config.margin + Math.floor(config.cardSize / 2),
                data.lab.length * config.cardSize + config.margin + config.margin / 2
            ];
        case dir.RIGHT:
            return [
                config.margin / 2,
                button.points[0].y * config.cardSize + config.margin + Math.floor(config.cardSize / 2)
            ];
        case dir.LEFT:
            return [
                data.lab[0].length * config.cardSize + config.margin / 2 + config.margin,
                button.points[0].y * config.cardSize + config.margin + Math.floor(config.cardSize / 2)
            ];
    }
}

export function getPlayerPixels(player) {
    return [
        (player.currentIndex[0] * config.cardSize) + config.cardSize / 2 + config.margin,
        (player.currentIndex[1] * config.cardSize) + config.cardSize / 2 + config.margin
    ]
}

function getNextNumberIndex(list) {
    return list.findIndex((number) => !number.solved);
}

function cardsEqual(card1, card2) {
    return card1.length == card2.length && card1.every(function (value, index) { return value === card2[index] })
}

function noPlayerOnCard(card) {
    return !data.players.find((player) => {
        return cardsEqual(player.currentIndex, card)
    })
}

function handleMouseDown(x, y) {
    data.isDragging = false;
    data.players.forEach((shape, index) => {
        defineShape(shape);
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case config.interactiveType.PLAYER:
                    let turns = data.game.turns;
                    if (turns[turns.length - 1].player == index) {
                        data.isDragging = true;
                        shape.isDragging = true;
                    }
                    break;
                default:
                    break;
            }
        }
    })
    if (!data.isDragging) {
        data.clickableShapes.forEach((shape, index) => {
            defineShape(shape);
            if (ctx.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case config.interactiveType.EXTRACARD:
                        rotateExtraCard();
                        break;
                    default:
                        break;
                }
            }
        })
        data.buttonShapes.forEach((shape) => {
            defineShape(shape);
            if (ctx.isPointInPath(x, y)) {
                if (shape.enabled) {
                    switch (shape.direction) {
                        case config.shiftDirection.DOWN:
                        case config.shiftDirection.UP:
                            shiftCards(shape.points[0].x, shape.direction);
                            break;
                        case config.shiftDirection.RIGHT:
                        case config.shiftDirection.LEFT:
                            shiftCards(shape.points[0].y, shape.direction);
                            break;
                        default:
                            break;
                    }
                }
            }
        });
        data.rectangleButtons.forEach((shape) => {
            defineShape(shape);
            if (ctx.isPointInPath(x, y)) {

                switch (shape.cat) {
                    case config.interactiveType.ENDTURNBUTTON:
                        endTurn(data.players[data.game.turns[data.game.turns.length - 1].player].currentIndex);
                    break;
                    default:
                        break;
                }

            }
        })
    }

}

function handleMouseMove(x, y) {
    if (data.isDragging) {
        data.players.forEach((shape, index) => {

            switch (shape.cat) {
                case config.interactiveType.PLAYER:
                    if (shape.isDragging) {
                        shape.draggingPosition = [x, y];
                        drawLab(config, data, ctx);
                    }
                    break;
                default:
                    break;
            }

        });
    }
    /*if (!data.isDragging) {
        data.clickableShapes.forEach((shape, index) => {
            defineShape(shape);
            // test if the mouse is in the current shape
            if (ctx.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case config.interactiveType.EXTRACARD:
                        markExtraCard();
                        mouseout = false;
                        break;
                    case config.interactiveType.HORTOPEDGECARD || config.interactiveType.HORBOTEDGECARD:
                        markMovableVerLine(shape.points[0].x, (data.lab.length - 1) * config.cardSize);
                        mouseout = false;
                        break;
                    case config.interactiveType.VERLEFTEDGECARD || config.interactiveType.VERRIGHTEDGECARD:
                        markMovableHorLine((data.lab[0].length - 1) * config.cardSize, shape.points[0].y);
                        mouseout = false;
                        break;
                }
            }
        });
    }*/

}

function handleMouseUp(x, y) {
    data.players.forEach((shape, index) => {
        defineShape(shape);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case config.interactiveType.PLAYER:
                    //getCard
                    //if Card test Free
                    //if Free test Path
                    //if Path move Player
                    let card = getCardFromMousePosition(x, y);
                    if (card) {
                        if (noPlayerOnCard(card)) {
                            if (findPath(shape.currentIndex, card, data.lab)) {
                                shape.currentIndex = card;
                                endTurn(card);
                                // test if number on card
                                let numberOnCard = data.lab[card[1]][card[0]].number;
                                if (numberOnCard) {
                                    let nextCardIndex = getNextNumberIndex(shape.listNumbers)
                                    if (nextCardIndex > -1 && numberOnCard == shape.listNumbers[nextCardIndex].number) {
                                        shape.listNumbers[nextCardIndex].solved = true;
                                    }
                                }
                            }
                        }
                    }

                    shape.isDragging = false;
                    data.isDragging = false;

                    break;
                default: break;
            }
        }

    });
    drawLab(config, data, ctx);
}

canvas.addEventListener('mousedown', e => {
    var x = e.offsetX;
    var y = e.offsetY;
    handleMouseDown(x, y);
});
canvas.addEventListener('mousemove', e => {
    var x = e.offsetX;
    var y = e.offsetY;
    handleMouseMove(x, y);
})
canvas.addEventListener('mouseup', e => {
    var x = e.offsetX;
    var y = e.offsetY;
    handleMouseUp(x, y);
})


window.onload = () => {
    initLab(5, 5, config, data, canvas);
    initPlayers(2, 5, 5);
    initGame();
}