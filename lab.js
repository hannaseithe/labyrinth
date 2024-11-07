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
import { getRandomInteger } from './utils.js';

const NUM_ACTIONS_XCARD = 4;
const NUM_ACTIONS_SHIFTCARD = 16;
const NUM_ACTIONS_MOVE = 81;

export const REWARDS = {
    WIN : 100,
    NUMBER_FOUND : 10,
    OTHER_FOUND_NUMBER : -2,
    LOST : -10
}


export class LabGame {
    constructor(hPlayers, mPlayers, draw) {



        this.draw = draw;

        this.config_ = {
            cardSize: 50,
            margin: 20,
            playerRadius: 10,
            buttonRadius: 6,
            extraCardPosition: undefined,
            height: 9,
            width: 9,
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

        this.data_ = {
            lab: [],
            players: [],
            buttonShapes: [],
            clickableShapes: [],
            rectangleButtons: [],
            isDragging: false,
            extraCard: undefined,
            game: {}
        }



        this.initLab_(this.data_.width, this.data_.height);
        this.initPlayers_(hPlayers, mPlayers);
        this.initGame_();


    }


    initGraphics_(x, y) {
        window.onload = () => {
            this.canvas_ = document.getElementById("canvas");
            this.ctx_ = this.canvas_.getContext("2d");

            this.canvas_.width = x * this.config_.cardSize + 2 * this.config_.cardSize + this.config_.margin * 2;
            this.canvas_.height = y * this.config_.cardSize + this.config_.margin * 2;

            this.initExtraCard_(x, y);
            this.initButtons_(x, y);
            this.initEndTurnButton_();
        }
    }

    initExtraCard_(x, y) {
        if (this.draw) {
            this.config_.extraCardPosition = {
                x: x * this.config_.cardSize + this.config_.cardSize,
                y: 0
            };
            this.data_.clickableShapes.push({
                points: [{
                    x: this.config_.extraCardPosition.x + this.config_.margin,
                    y: this.config_.extraCardPosition.y + this.config_.margin
                }],
                cat: this.config_.interactiveType.EXTRACARD
            });
        }

    }

    initEndTurnButton_() {
        this.config_.endTurnButtonPosition = {
            x: this.config_.extraCardPosition.x,
            y: this.canvas_.height - Math.floor(this.config_.cardSize / 2)
        }

        this.data_.rectangleButtons.push({
            cat: this.config_.interactiveType.ENDTURNBUTTON,
            points: [{
                x: this.config_.endTurnButtonPosition.x + this.config_.margin,
                y: this.config_.endTurnButtonPosition.y - this.config_.margin
            }],
            width: this.config_.cardSize,
            height: this.canvas_.height - this.config_.endTurnButtonPosition.y,
            label: 'End Turn'
        })
    }

    initButtons_(x, y) {
        for (var j = 0; j < x; j++) {
            if (j % 2 == 1) {
                this.data_.buttonShapes.push({
                    points: [{
                        x: j,
                        y: -1
                    }],
                    direction: this.config_.shiftDirection.DOWN,
                    cat: this.config_.interactiveType.BUTTON,
                    enabled: true
                });
                this.data_.buttonShapes.push({
                    points: [{
                        x: j,
                        y: -1
                    }],
                    direction: this.config_.shiftDirection.UP,
                    cat: this.config_.interactiveType.BUTTON,
                    enabled: true
                });
            }
        }
        for (var j = 0; j < y; j++) {
            if (j % 2 == 1) {
                this.data_.buttonShapes.push({
                    points: [{
                        y: j,
                        x: 0 + this.config_.margin / 2
                    }],
                    direction: this.config_.shiftDirection.RIGHT,
                    cat: this.config_.interactiveType.BUTTON,
                    enabled: true
                });
                this.data_.buttonShapes.push({
                    points: [{
                        y: j,
                        x: -1
                    }],
                    direction: this.config_.shiftDirection.LEFT,
                    cat: this.config_.interactiveType.BUTTON,
                    enabled: true
                });
            }
        }
    }

    initLab_(x, y) { // create Lab var mit width:x and height:y + set fixed stones + fill random cards

        if (this.draw) {
            this.initGraphics_(x, y);
        }

        this.data_.extraCard = {
            shape: Math.floor(Math.random() * 4) % 4,
            orientation: Math.floor(Math.random() * 4) % 4,
            fixed: false
        };

        for (var i = 0; i < y; i++) {
            this.data_.lab[i] = []
            for (var j = 0; j < x; j++) {
                this.data_.lab[i][j] = undefined
            }
        }

        this.data_.lab[0][0] = {
            shape: this.config_.cardType.CORNER,
            orientation: 1,
            fixed: true,
            number: undefined
        };
        this.data_.lab[0][x - 1] = {
            shape: this.config_.cardType.CORNER,
            orientation: 2,
            fixed: true,
            number: undefined
        };
        this.data_.lab[y - 1][x - 1] = {
            shape: this.config_.cardType.CORNER,
            orientation: 3,
            fixed: true,
            number: undefined
        };
        this.data_.lab[y - 1][0] = {
            shape: this.config_.cardType.CORNER,
            orientation: 0,
            fixed: true,
            number: undefined
        };


        for (var i = 0; i < y; i++) {
            for (var j = 0; j < x; j++) {
                if (!this.data_.lab[i][j]) {
                    this.data_.lab[i][j] = {
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
                if (!this.data_.lab[randomX][randomY].number) {
                    console.log("!this.data_.lab.number")
                    this.data_.lab[randomX][randomY].number = i + 1;
                    numberSet = true;
                }
            }

        }
    }

    initPlayers_(hPlayers, mPlayers, x, y) {
        let x = this.data_.lab[0].length;
        let y = this.data_.lab.length;
        let amountPlayers = hPlayers + mPlayers;
        let amountNumbers = Math.floor((x * y) / 3);
        console.log("amountNumbers", amountNumbers);
        let usedNumbers = new Array(amountNumbers);
        for (let i = 0; i < amountPlayers; i++) {
            let indexX = (i % 2) * (x - 1);
            let indexY = ((Math.floor(i / 2)) % 2) * (y - 1);
            let listNumbers = [];
            let human = i < hPlayers;
            for (let j = 0; j < Math.floor(amountNumbers / amountPlayers); j++) {
                let newNumber = Math.floor(Math.random() * amountNumbers);
                while (usedNumbers[newNumber]) {
                    newNumber = Math.floor(Math.random() * amountNumbers);
                }
                usedNumbers[newNumber] = true;
                listNumbers.push({ number: newNumber + 1, solved: false })
            }
            this.data_.players[i] = {
                currentIndex: [indexX, indexY],
                listNumbers: listNumbers,
                isDragging: false,
                draggingPosition: [],
                cat: this.config_.interactiveType.PLAYER,
                name: "Player " + i,
                human: human
            };
        }
    }

    initGame_() {
        this.data_.game.turns = [{ player: 0 }];
        this.data_.game.finished = false;
        if (this.draw) {
            let this_ = this;
            window.onload = (this) => {
                drawLab(this.config_, this.data_, this.ctx_);
                this.canvas_.addEventListener('mousedown', e => {
                    var x = e.offsetX;
                    var y = e.offsetY;
                    this_.handleMouseDown_(x, y);
                });
                this.canvas_.addEventListener('mousemove', e => {
                    var x = e.offsetX;
                    var y = e.offsetY;
                    this_.handleMouseMove_(x, y);
                })
                this.canvas_.addEventListener('mouseup', e => {
                    var x = e.offsetX;
                    var y = e.offsetY;
                    this_.handleMouseUp_(x, y);
                })
            }
        }
    }

    _rotateExtraCard_(action) {
        for (i = 0; i < action; i++) {
            this.data_.extraCard.orientation++
        }
    }

    _shiftCards_(index, direction) {
        var cardonStack = this.data_.extraCard;
        var newCardonStack;


        switch (direction) {
            case this.config_.shiftDirection.DOWN:
                var movePlayer = this.playersinRow_(index);
                this.data_.lab.forEach((line) => {
                    newCardonStack = line[index];
                    line[index] = cardonStack;
                    cardonStack = newCardonStack;
                })
                movePlayer.forEach((player) => {
                    player.currentIndex[1] = (player.currentIndex[1] + 1) % this.data_.lab.length
                });
                break;
            case this.config_.shiftDirection.UP:
                var movePlayer = this.playersinRow_(index);
                for (var i = this.data_.lab.length; i > 0; i--) {
                    newCardonStack = this.data_.lab[i - 1][index];
                    this.data_.lab[i - 1][index] = cardonStack;
                    cardonStack = newCardonStack;
                }
                movePlayer.forEach((player) => {
                    player.currentIndex[1] = (this.data_.lab.length + player.currentIndex[1] - 1) % this.data_.lab.length
                });
                break;
            case this.config_.shiftDirection.RIGHT:
                var movePlayer = this.playersinLine_(index);
                this.data_.lab[index].forEach((card, ind, array) => {
                    newCardonStack = card;
                    array[ind] = cardonStack;
                    cardonStack = newCardonStack;
                })
                movePlayer.forEach((player) => {
                    player.currentIndex[0] = (player.currentIndex[0] + 1) % this.data_.lab[0].length
                });
                break;
            case this.config_.shiftDirection.LEFT:
                var movePlayer = this.playersinLine_(index);
                for (var i = this.data_.lab[0].length; i > 0; i--) {
                    newCardonStack = this.data_.lab[index][i - 1];
                    this.data_.lab[index][i - 1] = cardonStack;
                    cardonStack = newCardonStack;
                }
                movePlayer.forEach((player) => {
                    player.currentIndex[0] = (this.data_.lab.length + player.currentIndex[0] - 1) % this.data_.lab[0].length
                });
                break;
        }
        this.data_.extraCard = newCardonStack;
        this.logShift_(index, direction);
    };

    _moveCurrentPlayer_(x, y) {

        let reward = 0;

        let card = getCardFromMousePosition(x, y);
        let currentPlayer = this.data_.players[this.data_.game.turns[this.data_.game.turns.length - 1].player];
        if (card) {
            if (noPlayerOnCard(card)) {
                if (findPath(currentPlayer.currentIndex, card, this.data_.lab)) {
                    currentPlayer.currentIndex = card;

                    // test if number on card
                    let numberOnCard = this.data_.lab[card[1]][card[0]].number;
                    if (numberOnCard) {
                        let nextCardIndex = getNextNumberIndex(currentPlayer.listNumbers);
                        if (nextCardIndex + 1 == currentPlayer.listNumbers.length) {
                            this.endGame_();
                            reward = REWARDS.WIN;
                        } else {
                            if (numberOnCard == currentPlayer.listNumbers[nextCardIndex].number) {
                                currentPlayer.listNumbers[nextCardIndex].solved = true;
                                reward = REWARDS.NUMBER_FOUND;
                            }
                        }

                    }

                }
            }
        }
        this.endTurn_(card);
    }

    step(a1, a2, a3) {
        let reward, done;
        //TODO: Calculate Reward, State and Done
        this._rotateExtraCard_(a1);
        this._shiftCards_(Math.floor(a2 / Math.floor(this.data_.width / 2)), a2 % Math.floor(this.data_.width / 2));
        ({ reward, done } = this._moveCurrentPlayer_(Math.floor(a3 / this.data_.width), a3 % this.data_.width));
        let state = this.getState();

        return { reward, state, done }
    }

    getState() {

        let turns = this.data_.game.turns;
        let currentPlayerIndex = turns[turns.length - 1].player;

        let relevantState = {
            lab: this.data_.lab,
            currentPlayer: currentPlayerIndex,
            players: this.data_.players,
            extraCard: this.data_.extraCard,
            lastShift: turns[turns.length - 2].shift
        }
        return relevantState;
    }

    rotateExtraCard_() {
        this.data_.extraCard.orientation++;
        drawLab(this.config_, this.data_, this.ctx_);
    }

    playersinRow_(row) {
        var result = [];
        this.data_.players.forEach((player) => {
            if (player.currentIndex[0] == row) {
                result.push(player)
            }
        })
        return result;
    }

    playersinLine_(line) {
        var result = [];
        this.data_.players.forEach((player) => {
            if (player.currentIndex[1] == line) {
                result.push(player)
            }
        })
        return result;
    }

    shiftCards_(index, direction) {
        this._shiftCards_(index, direction);
        this.disableAllButtons_();
        drawLab(this.config_, this.data_, this.ctx_);
    }

    logPlayerPosition_(card) { }

    logShift_(index, direction) {
        let turns = this.data_.game.turns;
        turns[turns.length - 1].shift = {
            index: index,
            direction: direction
        }
    }

    getButtonfromShift_(shift) {
        let buttons = this.data_.buttonShapes;
        return buttons.find((button) => {
            if (button.direction == shift.direction) {
                switch (shift.direction) {
                    case this.config_.shiftDirection.UP:
                    case this.config_.shiftDirection.DOWN:
                        return shift.index == button.points[0].x;
                    case this.config_.shiftDirection.LEFT:
                    case this.config_.shiftDirection.RIGHT:
                        return shift.index == button.points[0].y;
                }
            }
            return false
        })
    }

    getReturnShift_(shift) {
        return {
            direction: (shift.direction + 2) % 4,
            index: shift.index
        }
    }

    disableLastShiftButton_() {
        let turns = this.data_.game.turns;
        let lastShift = turns[turns.length - 1].shift;
        if (lastShift) {
            let returnShift = this.getReturnShift_(lastShift);
            let button = this.getButtonfromShift_(returnShift);
            button.enabled = false;
        }

    }

    enableAllButtons_() {
        this.data_.buttonShapes.forEach((button) => button.enabled = true)
    }

    disableAllButtons_() {
        this.data_.buttonShapes.forEach((button) => button.enabled = false)
    }

    getRectangleButton_(type) {
        return this.data_.rectangleButtons.find((button) => button.cat == type)
    }

    disableEndTurnButton_() {
        let endTurnButton = this.getRectangleButton_(this.config_.interactiveType.ENDTURNBUTTON);
        endTurnButton.enabled = false;
    }

    enableEndTurnButton_() {
        let endTurnButton = this.getRectangleButton_(this.config_.interactiveType.ENDTURNBUTTON);
        endTurnButton.enabled = true;
    }

    endTurn_(card) {
        this.logPlayerPosition_(card);
        let turns = this.data_.game.turns;
        let playerIndex = turns[turns.length - 1].player;
        
        if (this.draw) {
            this.enableAllButtons_();
            this.disableLastShiftButton_();
        }

        turns.push({ player: (playerIndex + 1) % this.data_.players.length });
    }

    endGame_() {
        this.data_.game.finished = true;
    }


    defineShape_(shape) {
        var points = shape.points;
        switch (shape.cat) {
            case this.config_.interactiveType.PLAYER:
                this.ctx_.beginPath();
                if (!shape.isDragging) {
                    let point = getPlayerPixels(shape);
                    this.ctx_.arc(point[0], point[1], this.config_.playerRadius, 0, 2 * Math.PI);
                } else {
                    this.ctx_.arc(shape.draggingPosition[0], shape.draggingPosition[1],
                        this.config_.playerRadius, 0, 2 * Math.PI);
                }
                break;
            case this.config_.interactiveType.BUTTON:
                let point = getButtonPixels(shape);
                this.ctx_.beginPath();
                this.ctx_.arc(point[0], point[1], this.config_.buttonRadius, 0, 2 * Math.PI);
                break;
            case this.config_.interactiveType.EXTRACARD:
                this.ctx_.beginPath();
                this.ctx_.moveTo(points[0].x, points[0].y);
                this.ctx_.lineTo(points[0].x + this.config_.cardSize, points[0].y);
                this.ctx_.lineTo(points[0].x + this.config_.cardSize, points[0].y + this.config_.cardSize);
                this.ctx_.lineTo(points[0].x, points[0].y + this.config_.cardSize);
                break;
            case this.config_.interactiveType.ENDTURNBUTTON:
                this.ctx_.beginPath();
                this.ctx_.moveTo(points[0].x, points[0].y);
                this.ctx_.lineTo(points[0].x + shape.width, points[0].y);
                this.ctx_.lineTo(points[0].x + shape.width, points[0].y + shape.height);
                this.ctx_.lineTo(points[0].x, points[0].y + shape.height);
            default:
                break;
        }
    }

    getCardFromMousePosition_(x, y) {
        let xIndex = Math.floor((x - this.config_.margin) / this.config_.cardSize);
        let yIndex = Math.floor((y - this.config_.margin) / this.config_.cardSize);
        if ((xIndex < this.data_.lab.length) & (yIndex < this.data_.lab[0].length)) {
            return [xIndex, yIndex]
        }
        return undefined
    }

    getButtonPixels_(button) {
        let dir = this.config_.shiftDirection;
        switch (button.direction) {
            case dir.DOWN:
                return [
                    button.points[0].x * this.config_.cardSize + this.config_.margin + Math.floor(this.config_.cardSize / 2),
                    this.config_.margin / 2
                ];
            case dir.UP:
                return [
                    button.points[0].x * this.config_.cardSize + this.config_.margin + Math.floor(this.config_.cardSize / 2),
                    this.data_.lab.length * this.config_.cardSize + this.config_.margin + this.config_.margin / 2
                ];
            case dir.RIGHT:
                return [
                    this.config_.margin / 2,
                    button.points[0].y * this.config_.cardSize + this.config_.margin + Math.floor(this.config_.cardSize / 2)
                ];
            case dir.LEFT:
                return [
                    this.data_.lab[0].length * this.config_.cardSize + this.config_.margin / 2 + this.config_.margin,
                    button.points[0].y * this.config_.cardSize + this.config_.margin + Math.floor(this.config_.cardSize / 2)
                ];
        }
    }

    getPlayerPixels_(player) {
        return [
            (player.currentIndex[0] * this.config_.cardSize) + this.config_.cardSize / 2 + this.config_.margin,
            (player.currentIndex[1] * this.config_.cardSize) + this.config_.cardSize / 2 + this.config_.margin
        ]
    }

    getNextNumberIndex_(list) {
        return list.findIndex((number) => !number.solved);
    }

    cardsEqual_(card1, card2) {
        return card1.length == card2.length && card1.every(function (value, index) { return value === card2[index] })
    }

    noPlayerOnCard_(card) {
        return !this.data_.players.find((player) => {
            return this.cardsEqual_(player.currentIndex, card)
        })
    }

    handleMouseDown_(x, y) {
        this.data_.isDragging = false;
        this.data_.players.forEach((shape, index) => {
            this.defineShape_(shape);
            if (this.ctx_.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case this.config_.interactiveType.PLAYER:
                        let turns = this.data_.game.turns;
                        if ((turns[turns.length - 1].player == index) && (turns[turns.length - 1].shift)) {
                            this.data_.isDragging = true;
                            shape.isDragging = true;
                        }
                        break;
                    default:
                        break;
                }
            }
        })
        if (!this.data_.isDragging) {
            this.data_.clickableShapes.forEach((shape, index) => {
                this.defineShape_(shape);
                if (this.ctx_.isPointInPath(x, y)) {
                    switch (shape.cat) {
                        case this.config_.interactiveType.EXTRACARD:
                            this.rotateExtraCard_();
                            break;
                        default:
                            break;
                    }
                }
            })
            this.data_.buttonShapes.forEach((shape) => {
                this.defineShape_(shape);
                if (this.ctx_.isPointInPath(x, y)) {
                    if (shape.enabled) {
                        switch (shape.direction) {
                            case this.config_.shiftDirection.DOWN:
                            case this.config_.shiftDirection.UP:
                                this.shiftCards_(shape.points[0].x, shape.direction);
                                break;
                            case this.config_.shiftDirection.RIGHT:
                            case this.config_.shiftDirection.LEFT:
                                this.shiftCards_(shape.points[0].y, shape.direction);
                                break;
                            default:
                                break;
                        }
                    }
                }
            });
            this.data_.rectangleButtons.forEach((shape) => {
                this.defineShape_(shape);
                if (this.ctx_.isPointInPath(x, y)) {
                    if (this.data_.game.turns[this.data_.game.turns.length - 1].shift) {
                        switch (shape.cat) {
                            case this.config_.interactiveType.ENDTURNBUTTON:
                                this.endTurn_(this.data_.players[this.data_.game.turns[this.data_.game.turns.length - 1].player].currentIndex);
                                break;
                            default:
                                break;
                        }
                    }
                }
            })
        }

    }

    handleMouseMove_(x, y) {
        if (this.data_.isDragging) {
            this.data_.players.forEach((shape, index) => {

                switch (shape.cat) {
                    case this.config_.interactiveType.PLAYER:
                        if (shape.isDragging) {
                            shape.draggingPosition = [x, y];
                            drawLab(this.config_, this.data_, this.ctx_);
                        }
                        break;
                    default:
                        break;
                }

            });
        }
        /*if (!this.data_.isDragging) {
            this.data_.clickableShapes.forEach((shape, index) => {
                defineShape(shape);
                // test if the mouse is in the current shape
                if (this.ctx_.isPointInPath(x, y)) {
                    switch (shape.cat) {
                        case this.config_.interactiveType.EXTRACARD:
                            markExtraCard();
                            mouseout = false;
                            break;
                        case this.config_.interactiveType.HORTOPEDGECARD || this.config_.interactiveType.HORBOTEDGECARD:
                            markMovableVerLine(shape.points[0].x, (this.data_.lab.length - 1) * this.config_.cardSize);
                            mouseout = false;
                            break;
                        case this.config_.interactiveType.VERLEFTEDGECARD || this.config_.interactiveType.VERRIGHTEDGECARD:
                            markMovableHorLine((this.data_.lab[0].length - 1) * this.config_.cardSize, shape.points[0].y);
                            mouseout = false;
                            break;
                    }
                }
            });
        }*/

    }

    handleMouseUp_(x, y) {
        this.data_.players.forEach((shape, index) => {
            this.defineShape_(shape);
            // test if the mouse is in the current shape
            if (this.ctx_.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case this.config_.interactiveType.PLAYER:
                        //getCard
                        //if Card test Free
                        //if Free test Path
                        //if Path move Player
                        let card = this.getCardFromMousePosition_(x, y);
                        if (card) {
                            if (this.noPlayerOnCard_(card)) {
                                if (findPath(shape.currentIndex, card, this.data_.lab)) {
                                    shape.currentIndex = card;

                                    // test if number on card
                                    let numberOnCard = this.data_.lab[card[1]][card[0]].number;
                                    if (numberOnCard) {
                                        let nextCardIndex = this.getNextNumberIndex_(shape.listNumbers);
                                        if (nextCardIndex + 1 == shape.listNumbers.length) {
                                            this.endGame_();
                                        } else {
                                            if (numberOnCard == shape.listNumbers[nextCardIndex].number) {
                                                shape.listNumbers[nextCardIndex].solved = true;
                                            }
                                        }

                                    }
                                    this.endTurn_(card);
                                }
                            }
                        }

                        shape.isDragging = false;
                        this.data_.isDragging = false;

                        break;
                    default: break;
                }
            }

        });
        drawLab(this.config_, this.data_, this.ctx_);
    }

}

export function getRandomActions() {
    let action1 = getRandomInteger(0, NUM_ACTIONS_XCARD);
    let action2 = getRandomInteger(0, NUM_ACTIONS_SHIFTCARD);
    let action3 = getRandomInteger(0, NUM_ACTIONS_MOVE);
    return [action1, action2, action3];
}

export function getStateTensors(state) {

/*     let relevantState = {
        lab: this.data_.lab,
        currentPlayer: currentPlayer,
        otherPlayers,
        extraCard: this.data_.extraCard,
        lastShift: turns[turns.length - 2].shift
    } */



    let labShape, labOrientation, labNumber, labCP, labOP = [];
    state.lab.forEach((column, cIndex) => {
        column.forEach((card, rIndex) => {
            labShape[cIndex][rIndex] = card.shape;
            labOrientation[cIndex][rIndex] = card.orientation;
            labNumber[cIndex][rIndex] = card.number;
            labCP[cIndex][rIndex] = -1;
            labOP[cIndex][rIndex] = -1;
        })
    })

    labCP[state.players[currentPlayer].currentIndex[0]][state.players[currentPlayer].currentIndex[1]] = currentPlayer;
    state.players.forEach(player => {
        if (currentPlayer != index) {
            labOP[player.currentIndex[0]][player.currentIndex[1]] = index
        }
    })


    let otherState = [];

    state.currentPlayer.listNumbers.forEach((item) => {
        otherState.push(item.number);
        otherState.push(item.solved ? 1 : 0);
    })

    otherState.push(state.extraCard.shape);
    otherState.push(state.extraCard.orientation);
    otherState.push(state.extraCard.number);

    otherState.push(((state.lastShift.index + 1) / 4) * (state.lastShift.direction + 1))


    let labTensor = tf.tensor([labShape, labOrientation, labNumber, labCP, labOP]);
    let otherTensor = tf.tensor1d(otherState);

    return [labTensor, otherTensor]
    
}