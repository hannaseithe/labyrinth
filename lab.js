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
import {  drawLab  } from './drawLab.js';

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

const config = {
    cardSize : 50,
    margin: 20,
    playerRadius: 10,
    buttonRadius: 6,
    extraCardPosition: undefined,
    cardType : {
        CORNER: 0,
        STRAIGHT: 1,
        TCROSS: 2,
        CROSS: 3
    },
    interactiveType : {
        EXTRACARD: 0,
        BUTTON: 1,
        PLAYER: 2
    },
    shiftDirection : {
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
    isDragging: false,
    extraCard: undefined
}
 

function setExtraCard(x, y) {
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


function setPlayer(pos, id) {
    draggableShapes.push({
        points: [{
            x: pos[0] * cardSize + Math.floor(cardSize/2) + config.margin,
            y: pos[1] * config.cardSize + Math.floor(config.cardSize/2) + config.margin
        }],
        cat: config.interactiveType.PLAYER,
        playerId: id
    })
}

function setButtons(x,y) {
    for (var j = 0; j < x; j++) {
        if (j % 2 == 1) {
            data.buttonShapes.push({
                points: [{
                    x: j * config.cardSize + config.margin + Math.floor(config.cardSize/2),
                    y: 0 + config.margin/2
                }],
                direction: config.shiftDirection.DOWN,
                cat: config.interactiveType.BUTTON
            });
            data.buttonShapes.push({
                points: [{
                    x: j * config.cardSize + config.margin + Math.floor(config.cardSize/2),
                    y: (y) * config.cardSize + config.margin + config.margin/2
                }],
                direction: config.shiftDirection.UP,
                cat: config.interactiveType.BUTTON
            });
        }
    }
    for (var j = 0; j < y; j++) {
        if (j % 2 == 1) {
            data.buttonShapes.push({
                points: [{
                    y: j * config.cardSize + config.margin + Math.floor(config.cardSize/2),
                    x: 0 + config.margin/2
                }],
                direction: config.shiftDirection.RIGHT,
                cat: config.interactiveType.BUTTON
            });
            data.buttonShapes.push({
                points: [{
                    y: j * config.cardSize + config.margin + Math.floor(config.cardSize/2),
                    x: (x) * config.cardSize + config.margin/2 + config.margin
                }],
                direction: config.shiftDirection.LEFT,
                cat: config.interactiveType.BUTTON
            });
        }
    }
}

function initLab(x, y) { // create Lab var mit width:x and height:y + set fixed stones + fill random cards
    canvas.width = x * config.cardSize + 2 * config.cardSize + config.margin * 2;
    canvas.height = y * config.cardSize + config.margin * 2;

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
        data.lab.push(newRow)
    }

    let amountNumbers = Math.floor((x*y)/3); 
    for (let i=0; i < amountNumbers; i++) {
        let numberSet = false;
        while (!numberSet) {
            let randomX = Math.floor(Math.random() * x);
            let randomY = Math.floor(Math.random() * y);
            console.log("randomX & randomY",randomX, randomY);
            if (!data.lab[randomX][randomY].number) {
                console.log("!data.lab.number")
                data.lab[randomX][randomY].number = i + 1;
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
        data.players[i] = {
            currentIndex: [indexX,indexY],
            listNumbers: listNumbers,
            isDragging: false,
            draggingPosition: [],
            cat: config.interactiveType.PLAYER
        };
    }
}

function rotateExtraCard() {
    data.extraCard.orientation++;
    drawLab(config,data,ctx);
}

function shiftRow(row, down) {
    var cardonStack = data.extraCard;
    var newCardonStack;
    if (down) {
        data.lab.forEach((line, index) => {
            newCardonStack = line[row];
            line[row] = cardonStack;
            cardonStack = newCardonStack;
        })
    } else {
        for (var i = data.lab.length; i > 0; i--) {
            newCardonStack = data.lab[i - 1][row];
            data.lab[i - 1][row] = cardonStack;
            cardonStack = newCardonStack;
        }
    }
    data.extraCard = newCardonStack;
    drawLab(config,data,ctx);

}

function shiftLine(line, right) {
    var cardonStack = data.extraCard;
    var newCardonStack;
    if (right) {
        data.lab[line].forEach((card, index, array) => {
            newCardonStack = card;
            array[index] = cardonStack;
            cardonStack = newCardonStack;
        })
    } else {
        for (var i = data.lab[0].length; i > 0; i--) {
            newCardonStack = data.lab[line][i - 1];
            data.lab[line][i - 1] = cardonStack;
            cardonStack = newCardonStack;
        }
    }
    data.extraCard = newCardonStack;
    drawLab(config,data,ctx);

}

function markExtraCard() {
    drawLab(config,data,ctx);
    ctx.save();
    ctx.translate(config.extraCardPosition.x, config.extraCardPosition.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, config.cardSize, config.cardSize);
    ctx.restore();
}

function markMovableVerLine(x, y) {
    drawLab(config,data,ctx);
    ctx.save();
    ctx.translate(x, 0);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, config.cardSize, y + config.cardSize);
    ctx.restore();
}

function markMovableHorLine(x, y) {
    drawLab(config,data,ctx);
    ctx.save();
    ctx.translate(0, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.9)';
    ctx.strokeRect(0, 0, x + config.cardSize, config.cardSize);
    ctx.restore();
}

function drawPath(pfad) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(25,25,0,0.8)';
    pfad.forEach((field1, index, array) => {
        if (index < array.length - 1) {
            ctx.save();
            ctx.translate(field1[1] * config.cardSize + (Math.floor(config.cardSize / 2)),
                field1[0] * config.cardSize + Math.floor(config.cardSize / 2));
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo((array[index + 1][1] - field1[1]) * config.cardSize,
                (array[index + 1][0] - field1[0]) * config.cardSize);
            ctx.stroke();
            ctx.restore();
        }
    })
}



function defineShape(shape) {
    var points = shape.points;
    switch(shape.cat) {
        case config.interactiveType.PLAYER:
            ctx.beginPath();
            if (!shape.isDragging) {
                ctx.arc((shape.currentIndex[0] * config.cardSize) + config.cardSize/2 + config.margin,
                (shape.currentIndex[1] * config.cardSize) + config.cardSize/2 + config.margin,config.playerRadius,0,2*Math.PI);
            } else {
                ctx.arc(shape.draggingPosition[0],shape.draggingPosition[1],config.playerRadius,0,2*Math.PI);
            }
            
            break;
        case config.interactiveType.BUTTON:
            ctx.beginPath();
            ctx.arc(shape.points[0].x,shape.points[0].y,config.buttonRadius,0,2*Math.PI);
            break;
        case config.interactiveType.EXTRACARD:
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[0].x + config.cardSize, points[0].y);
            ctx.lineTo(points[0].x + config.cardSize, points[0].y + config.cardSize);
            ctx.lineTo(points[0].x, points[0].y + config.cardSize);
            break;
        default:
            break;
    }
}

function handleMouseDown(x, y) {
    data.isDragging = false;
    data.players.forEach((shape, index) => {
        defineShape(shape);
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case config.interactiveType.PLAYER:
                    data.isDragging = true;
                    shape.isDragging = true;
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
                switch (shape.direction) {
                    
                    case config.shiftDirection.DOWN:
                        shiftRow((shape.points[0].x - config.cardSize/2 - config.margin) / config.cardSize, true);
                        break;
                    case config.shiftDirection.UP:
                        shiftRow((shape.points[0].x - config.cardSize/2 - config.margin) / config.cardSize, false);
                        break;
                    case config.shiftDirection.RIGHT:
                        shiftLine((shape.points[0].y - config.cardSize/2 - config.margin) / config.cardSize, true);
                        break;
                    case config.shiftDirection.LEFT:
                        shiftLine((shape.points[0].y - config.cardSize/2 - config.margin) / config.cardSize, false);
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
                        shape.draggingPosition = [x,y];
                        drawLab(config,data,ctx); }
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

function getCardFromMousePosition(x,y) {
    let xIndex = Math.floor((x - config.margin)/config.cardSize);
    let yIndex = Math.floor((y - config.margin)/config.cardSize);
    if ((xIndex < data.lab.length) & (yIndex < data.lab[0].length)) {
        return [xIndex,yIndex]
    }
    return undefined
}

function handleMouseUp(x, y) {
    data.players.forEach((shape, index) => {
        defineShape(shape);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case config.interactiveType.PLAYER:
                    //getCard
                    //if Card test Path
                    //if Path move Player
                    let card = getCardFromMousePosition(x,y);
                    if (card) {
                        if (findPath(shape.currentIndex, card, data.lab)) {
                            shape.currentIndex = card;
                    } 
                    }
                     
                    shape.isDragging = false;
                    data.isDragging = false;
                    
                    break;
                default: break;
            }
        }

    });
     drawLab(config,data,ctx);
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
    drawLab(config,data,ctx);

}