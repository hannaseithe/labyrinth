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
const playerRadius = 10;
var extraCardPosition;



const cardType = {
    CORNER: 0,
    STRAIGHT: 1,
    TCROSS: 2,
    CROSS: 3
}
const clickableType = {
    EXTRACARD: 0,
    HORTOPEDGECARD: 1,
    HORBOTEDGECARD: 2,
    VERLEFTEDGECARD: 3,
    VERRIGHTEDGECARD: 4,
    PLAYER: 5
}

var lab = [];
let players = [];
var clickableShapes = [];


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
            x: extraCardPosition.x,
            y: extraCardPosition.y
        }, {
            x: extraCardPosition.x + cardSize,
            y: extraCardPosition.y
        }, {
            x: extraCardPosition.x + cardSize,
            y: extraCardPosition.y + cardSize
        }, {
            x: extraCardPosition.x,
            y: extraCardPosition.y + cardSize
        }],
        cat: clickableType.EXTRACARD
    });
}

function setEdgeCards(x, y) {
    for (var j = 0; j < x; j++) {
        if (j % 2 == 1) {
            clickableShapes.push({
                points: [{
                    x: j * cardSize,
                    y: 0
                }, {
                    x: j * cardSize + cardSize,
                    y: 0
                }, {
                    x: j * cardSize + cardSize,
                    y: cardSize
                }, {
                    x: j * cardSize,
                    y: cardSize
                }],
                cat: clickableType.HORTOPEDGECARD
            });
            clickableShapes.push({
                points: [{
                    x: j * cardSize,
                    y: (y - 1) * cardSize
                }, {
                    x: j * cardSize + cardSize,
                    y: (y - 1) * cardSize
                }, {
                    x: j * cardSize + cardSize,
                    y: y * cardSize
                }, {
                    x: j * cardSize,
                    y: y * cardSize
                }],
                cat: clickableType.HORBOTEDGECARD
            });
        }
    }
    for (var j = 0; j < y; j++) {
        if (j % 2 == 1) {
            clickableShapes.push({
                points: [{
                    y: j * cardSize,
                    x: 0
                }, {
                    y: j * cardSize + cardSize,
                    x: 0
                }, {
                    y: j * cardSize + cardSize,
                    x: cardSize
                }, {
                    y: j * cardSize,
                    x: cardSize
                }],
                cat: clickableType.VERLEFTEDGECARD
            });
            clickableShapes.push({
                points: [{
                    y: j * cardSize,
                    x: (x - 1) * cardSize
                }, {
                    y: j * cardSize + cardSize,
                    x: (x - 1) * cardSize
                }, {
                    y: j * cardSize + cardSize,
                    x: x * cardSize
                }, {
                    y: j * cardSize,
                    x: x * cardSize
                }],
                cat: clickableType.VERRIGHTEDGECARD
            });
        }
    }
}

function setPlayer(pos, id) {
    clickableShapes.push({
        points: [{
            x: pos[0] * cardSize + Math.floor(cardSize/2),
            y: pos[1] * cardSize + Math.floor(cardSize/2)
        }],
        cat: clickableType.PLAYER,
        playerId: id
    })
}

function initLab(x, y) { // create Lab var mit width:x and height:y + set fixed stones + fill random cards
    canvas.width = x * cardSize + 2 * cardSize;
    canvas.height = y * cardSize;

    setExtraCard(x, y);
    setEdgeCards(x, y);

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
    drawCard(i * cardSize + (Math.floor(cardSize / 2)), j * cardSize + Math.floor(cardSize / 2), card);
}

function drawXCard() {
    drawCard(extraCardPosition.x + Math.floor(cardSize / 2), extraCardPosition.y + Math.floor(cardSize / 2), extraCard);
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
            drawPlayer(players[i].currentPosition[0] * cardSize + (Math.floor(cardSize / 2)),players[i].currentPosition[1] * cardSize + (Math.floor(cardSize / 2)))
        } else {
            drawPlayer(players[i].draggingPosition[0], players[i].draggingPosition[1])
        }
        
    }
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
}

function defineShape(shape) {
    var points = shape.points;
    if (shape.cat == clickableType.PLAYER) {
        console.log("In Define Shape -> Player");
        ctx.beginPath();
        ctx.arc(shape.points[0].x,shape.points[0].y,playerRadius,0,2*Math.PI);
    } else {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
    }
    
}

function handleMouseDown(x, y) {
    clickableShapes.forEach((shape, index) => {
        defineShape(shape);
        //console.log(shape);
        //console.log(x, y);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
        

            switch (shape.cat) {
                case clickableType.EXTRACARD:
                    rotateExtraCard();
                    break;
                case clickableType.HORTOPEDGECARD:
                    shiftRow(shape.points[0].x / cardSize, true);
                    if (findPath([0, 0], [3, 5], lab, [[0, 0]])) {
                        console.log('path found!');
                        drawPath([...shortestPath, [3, 5]]);
                    } else {
                        console.log('path not found')
                    };
                    break;
                case clickableType.HORBOTEDGECARD:
                    shiftRow(shape.points[0].x / cardSize, false);
                    if (findPath([0, 0], [3, 5], lab, [[0, 0]])) {
                        console.log('path found!');
                        drawPath([...shortestPath, [3, 5]]);
                    } else {
                        console.log('path not found')
                    };
                    break;
                case clickableType.VERLEFTEDGECARD:
                    shiftLine(shape.points[0].y / cardSize, true);
                    if (findPath([0, 0], [3, 5], lab)) {
                        console.log('path found!');
                        drawPath([...shortestPath, [3, 5]]);
                    } else {
                        console.log('path not found')
                    };
                    break;
                case clickableType.VERRIGHTEDGECARD:
                    shiftLine(shape.points[0].y / cardSize, false);
                    if (findPath([0, 0], [3, 5], lab)) {
                        console.log('path found!');
                        drawPath([...shortestPath, [3, 5]]);
                    } else {
                        console.log('path not found')
                    };
                    break;
                case clickableType.PLAYER:
                    console.log("Is Player");
                    players[shape.playerId].isDragging = true;
                    players[shape.playerId].draggingPosition = [x,y]
                    break;
                default:
                    drawLab();
                    break;
            }
        }
    })

}

function handleMouseMove(x, y) {
    var mouseout = true;
    clickableShapes.forEach((shape, index) => {
        defineShape(shape);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case clickableType.PLAYER:
                    players[shape.playerId].draggingPosition = [x,y];
                    shape.points[0] = {x:x,y:y};
                    break;
                case clickableType.EXTRACARD:
                    markExtraCard();
                    mouseout = false;
                    break;
                case clickableType.HORTOPEDGECARD || clickableType.HORBOTEDGECARD:
                    markMovableVerLine(shape.points[0].x, (lab.length - 1) * cardSize);
                    mouseout = false;
                    break;
                case clickableType.VERLEFTEDGECARD || clickableType.VERRIGHTEDGECARD:
                    markMovableHorLine((lab[0].length - 1) * cardSize, shape.points[0].y);
                    mouseout = false;
                    break;
            }
        }

    });
    if (mouseout) { drawLab() }
}

function getCardFromMousePosition(x,y) {
    let xIndex = Math.floor(x/cardSize);
    let yIndex = Math.floor(y/cardSize);
    if (xIndex < lab.length & (yIndex < lab[0].length)) {
        return [xIndex,yIndex]
    }
    return undefined
}

function handleMouseUp(x, y) {
    clickableShapes.forEach((shape, index) => {
        defineShape(shape);
        // test if the mouse is in the current shape
        if (ctx.isPointInPath(x, y)) {
            switch (shape.cat) {
                case clickableType.PLAYER:
                    //getCard
                    //if Card test Path
                    //if Path move Player
                    let card = getCardFromMousePosition(x,y);
                    if (card) {
                        if (findPath(players[shape.playerId].currentPosition, card, lab)) {
                            players[shape.playerId].currentPosition = card;
                            shape.points[0] = {x: x, y:y};
                    } else {
                        shape.points[0] = {x: players[shape.playerId].currentPosition[0]*cardSize +(cardSize/2), y:players[shape.playerId].currentPosition[1]*cardSize + (cardSize/2)};
                    }
                    } else {
                        shape.points[0] = {x: players[shape.playerId].currentPosition[0]*cardSize +(cardSize/2), y:players[shape.playerId].currentPosition[1]*cardSize + (cardSize/2)};
                    }
                     
                    players[shape.playerId].isDragging = false;
                    
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
    initLab(7, 7);
    initPlayers(3,7,7);
    drawLab();
}