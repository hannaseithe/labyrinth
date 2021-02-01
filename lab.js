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

import { shortestPath, findPath } from './findPath.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const cardSize = 50;
const margin = 20;
const playerRadius = 10;
const buttonRadius = 6;
var extraCardPosition;
var isDragging = false;



const cardType = {
    CORNER: 0,
    STRAIGHT: 1,
    TCROSS: 2,
    CROSS: 3
}
const interactiveType = {
    EXTRACARD: 0,
    BUTTON: 1,
    PLAYER: 2
}
const shiftDirection = {
    DOWN: 0,
    LEFT: 1,
    UP: 2,
    RIGHT: 3
}
 

var lab = [];
let players = [];
var clickableShapes = [];
var draggableShapes = [];
var buttonShapes = [];


var extraCard;

function setExtraCard(x, y) {
    extraCard = {
        shape: Math.floor(Math.random() * 4) % 4,
        orientation: Math.floor(Math.random() * 4) % 4,
        fixed: false
    };
    extraCardPosition = {
        x: x * cardSize + cardSize,
        y: 0
    }
    clickableShapes.push({
        points: [{
            x: extraCardPosition.x + margin,
            y: extraCardPosition.y + margin
        }],
        cat: interactiveType.EXTRACARD
    });
}


function setPlayer(pos, id) {
    draggableShapes.push({
        points: [{
            x: pos[0] * cardSize + Math.floor(cardSize/2) + margin,
            y: pos[1] * cardSize + Math.floor(cardSize/2) + margin
        }],
        cat: interactiveType.PLAYER,
        playerId: id
    })
}

function setButtons(x,y) {
    for (var j = 0; j < x; j++) {
        if (j % 2 == 1) {
            buttonShapes.push({
                points: [{
                    x: j * cardSize + margin + Math.floor(cardSize/2),
                    y: 0 + margin/2
                }],
                direction: shiftDirection.DOWN,
                cat: interactiveType.BUTTON
            });
            buttonShapes.push({
                points: [{
                    x: j * cardSize + margin + Math.floor(cardSize/2),
                    y: (y) * cardSize + margin + margin/2
                }],
                direction: shiftDirection.UP,
                cat: interactiveType.BUTTON
            });
        }
    }
    for (var j = 0; j < y; j++) {
        if (j % 2 == 1) {
            buttonShapes.push({
                points: [{
                    y: j * cardSize + margin + Math.floor(cardSize/2),
                    x: 0 + margin/2
                }],
                direction: shiftDirection.RIGHT,
                cat: interactiveType.BUTTON
            });
            buttonShapes.push({
                points: [{
                    y: j * cardSize + margin + Math.floor(cardSize/2),
                    x: (x) * cardSize + margin/2 + margin
                }],
                direction: shiftDirection.LEFT,
                cat: interactiveType.BUTTON
            });
        }
    }
}

function initLab(x, y) { // create Lab var mit width:x and height:y + set fixed stones + fill random cards
    canvas.width = x * cardSize + 2 * cardSize + margin * 2;
    canvas.height = y * cardSize + margin * 2;

    setExtraCard(x, y);
    setButtons(x, y);

    for (var i = 0; i < y; i++) {
        var newRow = [];
        for (var j = 0; j < x; j++) {
            var newCard = {
                shape: Math.floor(Math.random() * 4) % 4,
                orientation: Math.floor(Math.random() * 4) % 4,
                fixed: ((i % 2 == 0) && (j % 2 == 0)),
                number: undefined
            };
            newRow.push(newCard);
        }
        lab.push(newRow)
    }

    let amountNumbers = Math.floor((x*y)/3); 
    for (let i=0; i < amountNumbers; i++) {
        let numberSet = false;
        while (!numberSet) {
            let randomX = Math.floor(Math.random() * x);
            let randomY = Math.floor(Math.random() * y);
            console.log("randomX & randomY",randomX, randomY);
            if (!lab[randomX][randomY].number) {
                console.log("!lab.number")
                lab[randomX][randomY].number = i + 1;
                numberSet = true;
            }
        }
        
    }
}

function initPlayers(amountPlayers, x, y) {
    let amountNumbers = Math.floor((x*y)/3);
    console.log("amountNumbers",amountNumbers);
    let usedNumbers = new Array(amountNumbers);
    for (let i = 0; i < amountPlayers; i++) {
        let indexX = (i % 2) * (x-1);
        let indexY = ((Math.floor(i/2)) % 2) * (y-1);
        let listNumbers = [];
        for (let j = 0; j < Math.floor(amountNumbers/amountPlayers); j++) {
            let newNumber = Math.floor(Math.random() * amountNumbers) ;
            while (usedNumbers[newNumber]) {
                newNumber = Math.floor(Math.random()* amountNumbers);  
                }
            usedNumbers[newNumber] = true;
            listNumbers.push({number: newNumber + 1, solved: false})
            }
        players[i] = {
            currentPosition: [indexX,indexY],
            listNumbers: listNumbers,
            isDragging: false,
            draggingPosition: []
        };
        setPlayer(players[i].currentPosition,i)
    }
    console.log(players);
}

function drawCard(x, y, card) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(card.orientation * Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(-Math.floor(cardSize / 2), -Math.floor(cardSize / 2), cardSize, cardSize);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,25,0,0.8)';
    switch (card.shape) {
        case cardType.CORNER:
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -Math.floor(cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.floor(cardSize / 2), 0);
            ctx.stroke();

            break;
        case cardType.STRAIGHT:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(cardSize / 2));
            ctx.lineTo(0, Math.floor(cardSize / 2));
            ctx.stroke();
            break;
        case cardType.TCROSS:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(cardSize / 2));
            ctx.lineTo(0, Math.floor(cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.floor(cardSize / 2), 0);
            ctx.stroke();
            break;
        case cardType.CROSS:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(cardSize / 2));
            ctx.lineTo(0, Math.floor(cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-Math.floor(cardSize / 2), 0);
            ctx.lineTo(Math.floor(cardSize / 2), 0);
            ctx.stroke();
            break;
        //...
        default:
            console.log('default: ', card.shape);
            break;
    }
    ctx.lineWidth = 1;
    if (card.fixed) {
        ctx.strokeStyle = 'rgba(40,40,255,0.9)';
    } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    };
    ctx.strokeRect(-Math.floor(cardSize / 2), -Math.floor(cardSize / 2), cardSize, cardSize);
    
    ctx.fillStyle = 'rgba(0,0,150,0.8)';
    if (card.number) {
        ctx.fillText(card.number + ".", Math.floor(cardSize / 5), Math.floor(cardSize / 3))
    }

    ctx.restore();
}

function drawCardinLab(i, j, card) {
    drawCard(i * cardSize + (Math.floor(cardSize / 2)) + margin, j * cardSize + Math.floor(cardSize / 2) + margin, card);
}

function drawXCard() {
    drawCard(extraCardPosition.x + Math.floor(cardSize / 2) + margin, extraCardPosition.y + Math.floor(cardSize / 2) + margin, extraCard);
}

function rotateExtraCard() {
    extraCard.orientation++;
    drawLab();
}

function shiftRow(row, down) {
    var cardonStack = extraCard;
    var newCardonStack;
    if (down) {
        lab.forEach((line, index) => {
            newCardonStack = line[row];
            line[row] = cardonStack;
            cardonStack = newCardonStack;
        })
    } else {
        for (var i = lab.length; i > 0; i--) {
            newCardonStack = lab[i - 1][row];
            lab[i - 1][row] = cardonStack;
            cardonStack = newCardonStack;
        }
    }
    extraCard = newCardonStack;
    drawLab();

}

function shiftLine(line, right) {
    var cardonStack = extraCard;
    var newCardonStack;
    if (right) {
        lab[line].forEach((card, index, array) => {
            newCardonStack = card;
            array[index] = cardonStack;
            cardonStack = newCardonStack;
        })
    } else {
        for (var i = lab[0].length; i > 0; i--) {
            newCardonStack = lab[line][i - 1];
            lab[line][i - 1] = cardonStack;
            cardonStack = newCardonStack;
        }
    }
    extraCard = newCardonStack;
    drawLab();

}

function markExtraCard() {
    drawLab();
    ctx.save();
    ctx.translate(extraCardPosition.x, extraCardPosition.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, cardSize, cardSize);
    ctx.restore();
}

function markMovableVerLine(x, y) {
    drawLab();
    ctx.save();
    ctx.translate(x, 0);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, cardSize, y + cardSize);
    ctx.restore();
}

function markMovableHorLine(x, y) {
    drawLab();
    ctx.save();
    ctx.translate(0, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, x + cardSize, cardSize);
    ctx.restore();
}

function drawPath(pfad) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(25,25,0,0.8)';
    pfad.forEach((field1, index, array) => {
        if (index < array.length - 1) {
            ctx.save();
            ctx.translate(field1[1] * cardSize + (Math.floor(cardSize / 2)),
                field1[0] * cardSize + Math.floor(cardSize / 2));
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo((array[index + 1][1] - field1[1]) * cardSize,
                (array[index + 1][0] - field1[0]) * cardSize);
            ctx.stroke();
            ctx.restore();
        }
    })
}

function drawPlayer(x,y) {
    console.log(x,y);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(200,0,0,0.9)';
    ctx.beginPath();
    ctx.arc(0,0,playerRadius,0,2*Math.PI);
    ctx.fill()
    ctx.restore();
}

function drawPlayers() {

    for (let i = 0; i < players.length; i ++) {
        if (!players[i].isDragging) {
            drawPlayer(players[i].currentPosition[0] * cardSize + (Math.floor(cardSize / 2)) + margin,players[i].currentPosition[1] * cardSize + (Math.floor(cardSize / 2)) + margin)
        } else {
            drawPlayer(players[i].draggingPosition[0], players[i].draggingPosition[1])
        }
        
    }
}
function drawButton(x,y,direction) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((direction +1) * Math.PI / 2);
    ctx.fillStyle = 'rgba(200,0,0,0.9)';
    ctx.strokeStyle = 'rgba(200,0,0,0.9)';
    ctx.beginPath();
    ctx.arc(0,0,buttonRadius,0,2*Math.PI);
    ctx.stroke();
    ctx.fillText(">", -buttonRadius/2, buttonRadius/2);
    ctx.restore();
}

function drawButtons() {

    buttonShapes.forEach((button,index) => {
        drawButton(button.points[0].x, button.points[0].y, button.direction)
    })

}

function drawLab() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lab.forEach((line, line_index) => {
        line.forEach((card, row_index) => {
            drawCardinLab(row_index, line_index, card)
        })
    })
    drawXCard();
    drawPlayers();
    drawButtons();
}

function defineShape(shape) {
    var points = shape.points;
    switch(shape.cat) {
        case interactiveType.PLAYER:
            ctx.beginPath();
            ctx.arc(shape.points[0].x,shape.points[0].y,playerRadius,0,2*Math.PI);
            break;
        case interactiveType.BUTTON:
            ctx.beginPath();
            ctx.arc(shape.points[0].x,shape.points[0].y,buttonRadius,0,2*Math.PI);
            break;
        case interactiveType.EXTRACARD:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[0].x + cardSize, points[0].y);
            ctx.lineTo(points[0].x + cardSize, points[0].y + cardSize);
            ctx.lineTo(points[0].x, points[0].y + cardSize);
            break;
        default:
            break;
    }
}

function handleMouseDown(x, y) {
    isDragging = false;
    draggableShapes.forEach((shape, index) => {
        defineShape(shape);
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case interactiveType.PLAYER:
                    isDragging = true;
                    players[shape.playerId].isDragging = true;
                    break;
                default:
                    break;
            }
        }
    })
    if (!isDragging) {
        clickableShapes.forEach((shape, index) => {
            defineShape(shape);
            if (ctx.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case interactiveType.EXTRACARD:
                        rotateExtraCard();
                        break;
                    default:
                        break;
                }
            }
        })
        buttonShapes.forEach((shape) => {
            defineShape(shape);
            if (ctx.isPointInPath(x, y)) {
                switch (shape.direction) {
                    
                    case shiftDirection.DOWN:
                        shiftRow((shape.points[0].x - cardSize/2 - margin) / cardSize, true);
                        break;
                    case shiftDirection.UP:
                        shiftRow((shape.points[0].x - cardSize/2 - margin) / cardSize, false);
                        break;
                    case shiftDirection.RIGHT:
                        shiftLine((shape.points[0].y - cardSize/2 - margin) / cardSize, true);
                        break;
                    case shiftDirection.LEFT:
                        shiftLine((shape.points[0].y - cardSize/2 - margin) / cardSize, false);
                        break;
                    default:
                        break;
                }
            }
        })
    }
 
}

function handleMouseMove(x, y) {
    var mouseout = true;
    if (isDragging) {
        draggableShapes.forEach((shape, index) => {
            
                switch (shape.cat) {
                    case interactiveType.PLAYER:
                        if (players[shape.playerId].isDragging) {
                        players[shape.playerId].draggingPosition = [x,y];
                        shape.points[0] = {x:x,y:y};
                        drawLab(); }
                        break;
                    default:
                        break;
                }
    
        });
    }
    /*if (!isDragging) {
        clickableShapes.forEach((shape, index) => {
            defineShape(shape);
            // test if the mouse is in the current shape
            if (ctx.isPointInPath(x, y)) {
                switch (shape.cat) {
                    case interactiveType.EXTRACARD:
                        markExtraCard();
                        mouseout = false;
                        break;
                    case interactiveType.HORTOPEDGECARD || interactiveType.HORBOTEDGECARD:
                        markMovableVerLine(shape.points[0].x, (lab.length - 1) * cardSize);
                        mouseout = false;
                        break;
                    case interactiveType.VERLEFTEDGECARD || interactiveType.VERRIGHTEDGECARD:
                        markMovableHorLine((lab[0].length - 1) * cardSize, shape.points[0].y);
                        mouseout = false;
                        break;
                }
            }
        });
    }*/
    
}

function getCardFromMousePosition(x,y) {
    let xIndex = Math.floor((x - margin)/cardSize);
    let yIndex = Math.floor((y - margin)/cardSize);
    if ((xIndex < lab.length) & (yIndex < lab[0].length)) {
        return [xIndex,yIndex]
    }
    return undefined
}

function handleMouseUp(x, y) {
    draggableShapes.forEach((shape, index) => {
        defineShape(shape);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case interactiveType.PLAYER:
                    //getCard
                    //if Card test Path
                    //if Path move Player
                    let card = getCardFromMousePosition(x,y);
                    if (card) {
                        if (findPath(players[shape.playerId].currentPosition, card, lab)) {
                            players[shape.playerId].currentPosition = card;
                            shape.points[0] = {x: card[0], y:card[1]};
                    } else {
                        shape.points[0] = {x: players[shape.playerId].currentPosition[0]*cardSize +(cardSize/2), y:players[shape.playerId].currentPosition[1]*cardSize + (cardSize/2)};
                    }
                    } else {
                        shape.points[0] = {x: players[shape.playerId].currentPosition[0]*cardSize +(cardSize/2), y:players[shape.playerId].currentPosition[1]*cardSize + (cardSize/2)};
                    }
                     
                    players[shape.playerId].isDragging = false;
                    isDragging = false;
                    
                    break;
                default: break;
            }
        }

    });
     drawLab();
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
    initLab(5, 5);
    initPlayers(2,5,5);
    drawLab();

}