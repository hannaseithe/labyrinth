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
import { initLab, initPlayers   } from './initLab.js';

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

function rotateExtraCard() {
    data.extraCard.orientation++;
    drawLab(config,data,ctx);
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

function shiftRow(row, down) {
    var cardonStack = data.extraCard;
    var newCardonStack;
    var movePlayer = playersinRow(row);
    if (down) {
        data.lab.forEach((line, index) => {
            newCardonStack = line[row];
            line[row] = cardonStack;
            cardonStack = newCardonStack;
        })
        movePlayer.forEach((player) => {
            player.currentIndex[1] = (player.currentIndex[1] + 1) % data.lab.length
        })
    } else {
        for (var i = data.lab.length; i > 0; i--) {
            newCardonStack = data.lab[i - 1][row];
            data.lab[i - 1][row] = cardonStack;
            cardonStack = newCardonStack;
        }
        movePlayer.forEach((player) => {
            player.currentIndex[1] = (data.lab.length + player.currentIndex[1] - 1) % data.lab.length
        })
    }
    data.extraCard = newCardonStack;
    drawLab(config,data,ctx);

}

function shiftLine(line, right) {
    var cardonStack = data.extraCard;
    var newCardonStack;
    var movePlayer = playersinLine(line);
    if (right) {
        data.lab[line].forEach((card, index, array) => {
            newCardonStack = card;
            array[index] = cardonStack;
            cardonStack = newCardonStack;
        })
        movePlayer.forEach((player) => {
            player.currentIndex[0] = (player.currentIndex[0] + 1) % data.lab[0].length
        })
    } else {
        for (var i = data.lab[0].length; i > 0; i--) {
            newCardonStack = data.lab[line][i - 1];
            data.lab[line][i - 1] = cardonStack;
            cardonStack = newCardonStack;
        }
        movePlayer.forEach((player) => {
            player.currentIndex[0] = (data.lab.length + player.currentIndex[0] - 1) % data.lab[0].length
        })
    }
    data.extraCard = newCardonStack;
    drawLab(config,data,ctx);

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

function getCardFromMousePosition(x,y) {
    let xIndex = Math.floor((x - config.margin)/config.cardSize);
    let yIndex = Math.floor((y - config.margin)/config.cardSize);
    if ((xIndex < data.lab.length) & (yIndex < data.lab[0].length)) {
        return [xIndex,yIndex]
    }
    return undefined
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
    initLab(5, 5, config,data,canvas);
    initPlayers(2,5,5);
    drawLab(config,data,ctx);
}