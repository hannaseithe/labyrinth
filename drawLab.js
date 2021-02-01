var config,data,ctx;

function drawCard(x, y, card) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(card.orientation * Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(-Math.floor(config.cardSize / 2), -Math.floor(config.cardSize / 2), config.cardSize, config.cardSize);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,25,0,0.8)';
    switch (card.shape) {
        case config.cardType.CORNER:
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -Math.floor(config.cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.floor(config.cardSize / 2), 0);
            ctx.stroke();

            break;
        case config.cardType.STRAIGHT:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(config.cardSize / 2));
            ctx.lineTo(0, Math.floor(config.cardSize / 2));
            ctx.stroke();
            break;
        case config.cardType.TCROSS:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(config.cardSize / 2));
            ctx.lineTo(0, Math.floor(config.cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.floor(config.cardSize / 2), 0);
            ctx.stroke();
            break;
        case config.cardType.CROSS:
            ctx.beginPath();
            ctx.moveTo(0, -Math.floor(config.cardSize / 2));
            ctx.lineTo(0, Math.floor(config.cardSize / 2));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-Math.floor(config.cardSize / 2), 0);
            ctx.lineTo(Math.floor(config.cardSize / 2), 0);
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
    ctx.strokeRect(-Math.floor(config.cardSize / 2), -Math.floor(config.cardSize / 2), config.cardSize, config.cardSize);
    
    ctx.fillStyle = 'rgba(0,0,150,0.8)';
    if (card.number) {
        ctx.fillText(card.number + ".", Math.floor(config.cardSize / 5), Math.floor(config.cardSize / 3))
    }

    ctx.restore();
}

function drawCardinLab(i, j, card) {
    drawCard(i * config.cardSize + (Math.floor(config.cardSize / 2)) + config.margin, j * config.cardSize + Math.floor(config.cardSize / 2) + config.margin, card);
}

function drawXCard() {
    drawCard(config.extraCardPosition.x + Math.floor(config.cardSize / 2) + config.margin, config.extraCardPosition.y + Math.floor(config.cardSize / 2) + config.margin, data.extraCard);
}

function drawPlayer(x,y) {
    console.log(x,y);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(200,0,0,0.9)';
    ctx.beginPath();
    ctx.arc(0,0,config.playerRadius,0,2*Math.PI);
    ctx.fill()
    ctx.restore();
}

function drawPlayers() {

    for (let i = 0; i < data.players.length; i ++) {
        if (!data.players[i].isDragging) {
            drawPlayer(data.players[i].currentIndex[0] * config.cardSize + (Math.floor(config.cardSize / 2)) + config.margin,
            data.players[i].currentIndex[1] * config.cardSize + (Math.floor(config.cardSize / 2)) + config.margin)
        } else {
            drawPlayer(data.players[i].draggingPosition[0], data.players[i].draggingPosition[1])
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
    ctx.arc(0,0,config.buttonRadius,0,2*Math.PI);
    ctx.stroke();
    ctx.fillText(">", -config.buttonRadius/2, config.buttonRadius/2);
    ctx.restore();
}

function drawButtons() {

    data.buttonShapes.forEach((button,index) => {
        drawButton(button.points[0].x, button.points[0].y, button.direction)
    })

}

export function drawLab(con,dat,c) {
    config = con;
    data = dat;
    ctx = c;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    data.lab.forEach((line, line_index) => {
        line.forEach((card, row_index) => {
            drawCardinLab(row_index, line_index, card)
        })
    })
    drawXCard();
    drawPlayers();
    drawButtons();
}