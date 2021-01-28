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
var extraCardPosition;
var path = [];



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
    VERRIGHTEDGECARD: 4
}

var lab = [];
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

function drawLab() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lab.forEach((line, line_index) => {
        line.forEach((card, row_index) => {
            drawCardinLab(row_index, line_index, card)
        })
    })
    drawXCard();
}

function defineShape(shape) {
    var points = shape.points;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
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


window.onload = () => {
    initLab(7, 7);
    drawLab();
}