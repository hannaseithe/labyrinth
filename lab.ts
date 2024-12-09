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
import * as tf from '@tensorflow/tfjs-node'
import { findPath, getCardCode } from './findPath.js';
import { drawLab, drawMachLab } from './drawLab.js';
import { getRandomInteger } from './utils.js';
import { LabGamePlayer } from './machPlayer.js';


export const REWARDS = {
    WIN: 2,
    NUMBER_FOUND: 0.8,
    CLEARED_PATH: 0.2,
    BLOCKED_PATH:-0.1,
    //NUMBER_ON_CARD:0.05,
    //MOVED: 0.01,
    PLAYER_ON_CARD: -0.1,
    PATH_NOT_FOUND: -0.05,
    OTHER_FOUND_NUMBER: -0.05,
    LOST: -0.1
}


export class LabGame {
    draw;

    config;
    data_;
    canvas_;
    ctx_;
    constructor(hPlayers, mPlayers, width, height, draw, agents?) {





        this.draw = draw;

        this.config = {
            cardSize: 50,
            margin: 20,
            playerRadius: 10,
            buttonRadius: 6,
            extraCardPosition: undefined,
            height: height,
            width: width,
            numActionsMove: width * height,
            numActionsShiftCard: (Math.floor(width / 2) + Math.floor(height / 2)) * 2,
            numActions: 4 + width * height + (Math.floor(width / 2) + Math.floor(height / 2)) * 2,
            otherStateLength: 2 * Math.floor(Math.floor(width * height / 3) / (hPlayers + mPlayers)) + 5,
            humanPlayers: hPlayers,
            machinePlayers: mPlayers,
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



        this.initLab_(this.config.width, this.config.height);
        this.initPlayers_(this.config.humanPlayers, this.config.machinePlayers);

        this.initGame_();
        if (this.draw) {
            this.initGraphics_(this.config.width, this.config.height)
        }


    }


    initGraphics_(x, y) {
        window.onload = () => {
            this.canvas_ = document.getElementById("canvas");
            this.ctx_ = this.canvas_.getContext("2d");

            this.canvas_.width = x * this.config.cardSize + 2 * this.config.cardSize + this.config.margin * 2;
            this.canvas_.height = y * this.config.cardSize + this.config.margin * 2;

            this.initExtraCard_(x, y);
            this.initButtons_(x, y);
            this.initEndTurnButton_();
            drawLab(this);

            this.canvas_.addEventListener('mousedown', e => {
                var x = e.offsetX;
                var y = e.offsetY;
                this.handleMouseDown_(x, y);
            });
            this.canvas_.addEventListener('mousemove', e => {
                var x = e.offsetX;
                var y = e.offsetY;
                this.handleMouseMove_(x, y);
            })
            this.canvas_.addEventListener('mouseup', e => {
                var x = e.offsetX;
                var y = e.offsetY;
                this.handleMouseUp_(x, y);


            })
        }
    }

    initExtraCard_(x, y) {
        if (this.draw) {
            this.config.extraCardPosition = {
                x: x * this.config.cardSize + this.config.cardSize,
                y: 0
            };
            this.data_.clickableShapes.push({
                points: [{
                    x: this.config.extraCardPosition.x + this.config.margin,
                    y: this.config.extraCardPosition.y + this.config.margin
                }],
                cat: this.config.interactiveType.EXTRACARD
            });
        }

    }

    initEndTurnButton_() {
        this.config.endTurnButtonPosition = {
            x: this.config.extraCardPosition.x,
            y: this.canvas_.height - Math.floor(this.config.cardSize / 2)
        }

        this.data_.rectangleButtons.push({
            cat: this.config.interactiveType.ENDTURNBUTTON,
            points: [{
                x: this.config.endTurnButtonPosition.x + this.config.margin,
                y: this.config.endTurnButtonPosition.y - this.config.margin
            }],
            width: this.config.cardSize,
            height: this.canvas_.height - this.config.endTurnButtonPosition.y,
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
                    direction: this.config.shiftDirection.DOWN,
                    cat: this.config.interactiveType.BUTTON,
                    enabled: true
                });
                this.data_.buttonShapes.push({
                    points: [{
                        x: j,
                        y: -1
                    }],
                    direction: this.config.shiftDirection.UP,
                    cat: this.config.interactiveType.BUTTON,
                    enabled: true
                });
            }
        }
        for (var j = 0; j < y; j++) {
            if (j % 2 == 1) {
                this.data_.buttonShapes.push({
                    points: [{
                        y: j,
                        x: 0 + this.config.margin / 2
                    }],
                    direction: this.config.shiftDirection.RIGHT,
                    cat: this.config.interactiveType.BUTTON,
                    enabled: true
                });
                this.data_.buttonShapes.push({
                    points: [{
                        y: j,
                        x: -1
                    }],
                    direction: this.config.shiftDirection.LEFT,
                    cat: this.config.interactiveType.BUTTON,
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
            shape: this.config.cardType.CORNER,
            orientation: 1,
            fixed: true,
            number: undefined
        };
        this.data_.lab[0][x - 1] = {
            shape: this.config.cardType.CORNER,
            orientation: 2,
            fixed: true,
            number: undefined
        };
        this.data_.lab[y - 1][x - 1] = {
            shape: this.config.cardType.CORNER,
            orientation: 3,
            fixed: true,
            number: undefined
        };
        this.data_.lab[y - 1][0] = {
            shape: this.config.cardType.CORNER,
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
        this.config.amountNumbers = amountNumbers;
        for (let i = 0; i < amountNumbers; i++) {
            let numberSet = false;
            while (!numberSet) {
                let randomX = Math.floor(Math.random() * x);
                let randomY = Math.floor(Math.random() * y);
                if (!this.data_.lab[randomX][randomY].number) {
                    this.data_.lab[randomX][randomY].number = i + 1;
                    numberSet = true;
                }
            }

        }
    }

    async initPlayers_(hPlayers, mPlayers) {
        let qNet;
        let x = this.data_.lab[0].length;
        let y = this.data_.lab.length;
        let amountPlayers = hPlayers + mPlayers;
        let amountNumbers = Math.floor((x * y) / 3);
        let usedNumbers = new Array(amountNumbers);
        if (this.draw && mPlayers > 0) {
            let LOCAL_MODEL_URL = '../models/dqn/model.json';
            qNet = await tf.loadLayersModel(LOCAL_MODEL_URL);
            console.log('Local Model loaded')
        }
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
                cat: this.config.interactiveType.PLAYER,
                name: "Player " + i,
                human: human
            };
            if (this.draw && !human) {

                this.data_.players[i].agent = new LabGamePlayer(this, qNet)

            }
        }
    }

    initGame_() {
        this.data_.game.turns = [{ player: 0 }];
        this.data_.game.finished = false;

    }

    findCardNumber(array, element) {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col].number === element) {
                    return [row, col];
                }
            }
        }
        return null; // Return null if the element is not found
    }

    _rotateExtraCard_(action):Promise<any> {
        for (let i = 0; i < action; i++) {
            this.data_.extraCard.orientation++
        }
        if (this.draw) {
            drawMachLab(this)
            return new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    _shiftCards_(index, direction) {
        let reward = 0;
        let currentPlayer = this.data_.players[this.data_.game.turns[this.data_.game.turns.length - 1].player];
        let nextCardNumber = currentPlayer.listNumbers.find((card)=> !card.solved)
        let nextCard = this.findCardNumber(this.data_.lab, nextCardNumber.number)
        let pathBeforeShift = nextCard ? findPath(currentPlayer.currentIndex, nextCard, this.data_.lab) : false
        if (index % 2 == 1) {
            var cardonStack = this.data_.extraCard;
            var newCardonStack;
    
            switch (direction) {
                case this.config.shiftDirection.DOWN:
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
                case this.config.shiftDirection.UP:
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
                case this.config.shiftDirection.RIGHT:
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
                case this.config.shiftDirection.LEFT:
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
            nextCard = this.findCardNumber(this.data_.lab, nextCardNumber.number)
            let pathAfterShift = nextCard ? findPath(currentPlayer.currentIndex, nextCard, this.data_.lab) : false
            
            
            if (!pathBeforeShift && pathAfterShift) {
                reward += REWARDS.CLEARED_PATH
            }
            if (pathBeforeShift && !pathAfterShift) {
                reward+= REWARDS.BLOCKED_PATH
            }
        }
        if (this.draw) {
            drawMachLab(this)
            return new Promise(resolve => setTimeout(resolve, 500));
        }
        return reward
    };

    _moveCurrentPlayer_(x, y):Promise<any> | any {

        let reward = 0;
        let done = false;

        let card = [x, y]
        let currentPlayer = this.data_.players[this.data_.game.turns[this.data_.game.turns.length - 1].player];
        if (card) {
            if (this.noPlayerOnCard_(card)) {
                if (findPath(currentPlayer.currentIndex, card, this.data_.lab)) {
                    //reward += REWARDS.MOVED
                    currentPlayer.currentIndex = card;

                    // test if number on card
                    let numberOnCard = this.data_.lab[card[1]][card[0]].number;
                    if (numberOnCard) {
                        //reward += REWARDS.NUMBER_ON_CARD;
                        let nextCardIndex = this.getNextNumberIndex_(currentPlayer.listNumbers);
                        if (nextCardIndex + 1 == currentPlayer.listNumbers.length) {
                            if (numberOnCard == currentPlayer.listNumbers[nextCardIndex].number) {
                                currentPlayer.listNumbers[nextCardIndex].solved = true;
                                this.endGame_();
                                reward += REWARDS.WIN;
                                done = true
                            }

                        } else {
                            if (numberOnCard == currentPlayer.listNumbers[nextCardIndex].number) {
                                currentPlayer.listNumbers[nextCardIndex].solved = true;
                                reward += REWARDS.NUMBER_FOUND;
                            }
                        }

                    }

                } else {
                    reward += REWARDS.PATH_NOT_FOUND
                }
            } else {
                reward += REWARDS.PLAYER_ON_CARD
            }
        }
        
        this.endTurn_(card);
        if (this.draw) {
            drawMachLab(this)
            return new Promise(resolve => setTimeout(() => resolve({ reward: reward, done: done }), 500));
        }
        return { rewardMove: reward, done: done }
    }

    step(a1, a2, a3) {
        let rewardMove, rewardShift, done;
        //TODO: Calculate Reward, State and Done
        this._rotateExtraCard_(a1);
        rewardShift = this._shiftCards_(((Math.floor(a2/4)) * 2) + 1, a2 % 4);
        ({ rewardMove, done } = this._moveCurrentPlayer_(Math.floor(a3 / this.config.width), a3 % this.config.width));
        let state = this.getState();

        return { reward: rewardShift + rewardMove, state, done }
    }

    async stepAsync(a1, a2, a3) {
        let reward, done;
        //TODO: Calculate Reward, State and Done
        await this._rotateExtraCard_(a1);
        await this._shiftCards_(Math.floor(a2 / Math.floor(this.config.width / 2)), a2 % Math.floor(this.config.width / 2));
        ({ reward, done } = await this._moveCurrentPlayer_(Math.floor(a3 / this.config.width), a3 % this.config.width));
        let state = this.getState();

        return { reward, state, done }
    }

    getState() {

        let turns = this.data_.game.turns;
        let currentPlayerIndex = turns[turns.length - 1].player;
        let lastShift = turns.length > 1 ? turns[turns.length - 2].shift ? turns[turns.length - 2].shift: {index:-1,direction:-1} : {index:-1,direction:-1};

        let relevantState = {
            lab: this.data_.lab,
            currentPlayer: currentPlayerIndex,
            players: this.data_.players,
            extraCard: this.data_.extraCard,
            lastShift: lastShift
        }
        return relevantState;
    }

    reset() {

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

        this.initLab_(this.config.width, this.config.height);
        this.initPlayers_(this.config.humanPlayers, this.config.machinePlayers);
        this.initGame_();

        return this.getState();
    }

    rotateExtraCard_() {
        this.data_.extraCard.orientation++;
        drawLab(this);
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
        drawLab(this);
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
                    case this.config.shiftDirection.UP:
                    case this.config.shiftDirection.DOWN:
                        return shift.index == button.points[0].x;
                    case this.config.shiftDirection.LEFT:
                    case this.config.shiftDirection.RIGHT:
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
        let endTurnButton = this.getRectangleButton_(this.config.interactiveType.ENDTURNBUTTON);
        endTurnButton.enabled = false;
    }

    enableEndTurnButton_() {
        let endTurnButton = this.getRectangleButton_(this.config.interactiveType.ENDTURNBUTTON);
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
        let nextPlayer = (playerIndex + 1) % this.data_.players.length
        turns.push({ player: nextPlayer });
        if (this.draw && !this.data_.players[nextPlayer].human) {
            this.data_.players[nextPlayer].agent.playStep()
        }
    }

    endGame_() {
        this.data_.game.finished = true;
    }


    defineShape_(shape) {
        var points = shape.points;
        switch (shape.cat) {
            case this.config.interactiveType.PLAYER:
                this.ctx_.beginPath();
                if (!shape.isDragging) {
                    let point = this.getPlayerPixels_(shape);
                    this.ctx_.arc(point[0], point[1], this.config.playerRadius, 0, 2 * Math.PI);
                } else {
                    this.ctx_.arc(shape.draggingPosition[0], shape.draggingPosition[1],
                        this.config.playerRadius, 0, 2 * Math.PI);
                }
                break;
            case this.config.interactiveType.BUTTON:
                let point = this.getButtonPixels_(shape);
                this.ctx_.beginPath();
                this.ctx_.arc(point[0], point[1], this.config.buttonRadius, 0, 2 * Math.PI);
                break;
            case this.config.interactiveType.EXTRACARD:
                this.ctx_.beginPath();
                this.ctx_.moveTo(points[0].x, points[0].y);
                this.ctx_.lineTo(points[0].x + this.config.cardSize, points[0].y);
                this.ctx_.lineTo(points[0].x + this.config.cardSize, points[0].y + this.config.cardSize);
                this.ctx_.lineTo(points[0].x, points[0].y + this.config.cardSize);
                break;
            case this.config.interactiveType.ENDTURNBUTTON:
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
        let xIndex = Math.floor((x - this.config.margin) / this.config.cardSize);
        let yIndex = Math.floor((y - this.config.margin) / this.config.cardSize);
        if ((xIndex < this.data_.lab.length) && (yIndex < this.data_.lab[0].length)) {
            return [xIndex, yIndex]
        }
        return undefined
    }

    getButtonPixels_(button) {
        let dir = this.config.shiftDirection;
        switch (button.direction) {
            case dir.DOWN:
                return [
                    button.points[0].x * this.config.cardSize + this.config.margin + Math.floor(this.config.cardSize / 2),
                    this.config.margin / 2
                ];
            case dir.UP:
                return [
                    button.points[0].x * this.config.cardSize + this.config.margin + Math.floor(this.config.cardSize / 2),
                    this.data_.lab.length * this.config.cardSize + this.config.margin + this.config.margin / 2
                ];
            case dir.RIGHT:
                return [
                    this.config.margin / 2,
                    button.points[0].y * this.config.cardSize + this.config.margin + Math.floor(this.config.cardSize / 2)
                ];
            case dir.LEFT:
                return [
                    this.data_.lab[0].length * this.config.cardSize + this.config.margin / 2 + this.config.margin,
                    button.points[0].y * this.config.cardSize + this.config.margin + Math.floor(this.config.cardSize / 2)
                ];
        }
    }

    getPlayerPixels_(player) {
        return [
            (player.currentIndex[0] * this.config.cardSize) + this.config.cardSize / 2 + this.config.margin,
            (player.currentIndex[1] * this.config.cardSize) + this.config.cardSize / 2 + this.config.margin
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
                    case this.config.interactiveType.PLAYER:
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
                        case this.config.interactiveType.EXTRACARD:
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
                            case this.config.shiftDirection.DOWN:
                            case this.config.shiftDirection.UP:
                                this.shiftCards_(shape.points[0].x, shape.direction);
                                break;
                            case this.config.shiftDirection.RIGHT:
                            case this.config.shiftDirection.LEFT:
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
                            case this.config.interactiveType.ENDTURNBUTTON:
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
                    case this.config.interactiveType.PLAYER:
                        if (shape.isDragging) {
                            shape.draggingPosition = [x, y];
                            drawLab(this);
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
                        case this.config.interactiveType.EXTRACARD:
                            markExtraCard();
                            mouseout = false;
                            break;
                        case this.config.interactiveType.HORTOPEDGECARD || this.config.interactiveType.HORBOTEDGECARD:
                            markMovableVerLine(shape.points[0].x, (this.data_.lab.length - 1) * this.config.cardSize);
                            mouseout = false;
                            break;
                        case this.config.interactiveType.VERLEFTEDGECARD || this.config.interactiveType.VERRIGHTEDGECARD:
                            markMovableHorLine((this.data_.lab[0].length - 1) * this.config.cardSize, shape.points[0].y);
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
                    case this.config.interactiveType.PLAYER:
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
        drawLab(this);
    }

    isMoveAllowed(a3,cp) {
        let cpIndex = this.data_.players[cp].currentIndex
        let r = Math.floor(a3 / this.config.width)
        let c = a3 % this.config.width
        if (r == cpIndex[0] && c == cpIndex[1]) return true;
        return this.noPlayerOnCard_([r,c]) && findPath(cpIndex, [r,c], this.data_.lab)
    }
    
    isShiftAllowed(a2) {
        let lastTurn = this.data_.game.turns[this.data_.game.turns.length - 1].shift
        if (!lastTurn) {return true}
        return (lastTurn.index == ((Math.floor(a2/4)) * 2) + 1) && (lastTurn.direction == a2 % 4)
    }

}

export function getRandomActions(game) {
    let action1 = getRandomInteger(0, 4);
    let action2 = getRandomInteger(0, game.config.numActionsShiftCard);
    let action3 = getRandomInteger(0,game.config.numActionsMove);
    return [action1, action2, action3];
}

export function getStateTensors(state, config) {

    /*     let relevantState = {
            lab: this.data_.lab,
            currentPlayer: currentPlayer,
            otherPlayers,
            extraCard: this.data_.extraCard,
            lastShift: turns[turns.length - 2].shift
        } */
    if (!Array.isArray(state)) {
        state = [state];
    }

    if (!Array.isArray(state)) {
        state = [state];
    }
    const numExamples = state.length;

    const columns = config.width;
    const rows = config.height;
    const firstBuffer = tf.buffer([numExamples, 7, rows, columns]);
    const secondBuffer = tf.buffer([numExamples, config.otherStateLength]);
    let pNumber = state[0].players.length

    for (let n = 0; n < numExamples; ++n) {

        let currentPlayer = state[n].currentPlayer
        let cpPosition = state[n].players[currentPlayer].currentIndex

        state[n].lab.forEach((column, cIndex) => {
            column.forEach((card, rIndex) => {
                firstBuffer.set((card.shape + 1)/4, n,0,  cIndex, rIndex)
                firstBuffer.set((card.orientation % 4 + 1)/4, n, 1, cIndex, rIndex)
                firstBuffer.set(card.number ? card.number / config.amountNumbers : 0, n, 2,  cIndex, rIndex)
                firstBuffer.set(getCardCode(card.shape,card.orientation)/15,n,3,cIndex,rIndex)
                firstBuffer.set(findPath(cpPosition, [cIndex,rIndex],state[n].lab)? 1:0,n,4,cIndex,rIndex)
            })
        })

        firstBuffer.set(1, n, 5, cpPosition[0], cpPosition[1])
        
        state[n].players.forEach((player, index) => {
            if (currentPlayer != index) {
                firstBuffer.set((index+1)/pNumber, n, 6, player.currentIndex[0], player.currentIndex[1])
            }
        })

        let otherStateIndex = 0

        state[n].players[currentPlayer].listNumbers.forEach((card) => {
            secondBuffer.set(card.number / config.amountNumbers, n, otherStateIndex);
            secondBuffer.set(card.solved ? 1 : 0, n, otherStateIndex + 1);
            otherStateIndex += 2
        })
        secondBuffer.set((state[n].extraCard.shape + 1)/4, n, otherStateIndex);
        secondBuffer.set((state[n].extraCard.orientation % 4 + 1) / 4, n, otherStateIndex + 1);
        secondBuffer.set(state[n].extraCard.number ? state[n].extraCard.number  / config.amountNumbers : 0, n, otherStateIndex + 2);
        secondBuffer.set(state[n].lastShift.index / (columns - 2), n, otherStateIndex + 3);
        secondBuffer.set(state[n].lastShift.direction / 3 , n, otherStateIndex + 4);


    }


    return [firstBuffer.toTensor(), secondBuffer.toTensor()]

}