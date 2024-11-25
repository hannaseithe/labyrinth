/*****
        - "weg nach oben" : 
            corner -> card.orientation      == (0 || 3)
            straight -> card.orientation    == (0 || 2)
            tcross -> card.orientation      == (0 || 2 || 3)
            cross = TRUE
        - "weg nach rechts" 
            corner -> card.orientation      == (1 || 0)
            etc.
Card1 unterhalb von Card2:
    - card1 {orientation: 2, type: corner}
    - card2 {orientation: 3, type: straight}

    ***/
const DIRECTION = {
    top: 0,
    right: 3,
    bottom: 2,
    left: 1
}

function isHalfPath(card, direction) { // direction: 1 -> left, 2 -> bottom, 3 -> right
    switch (card.shape) {
        case 0:
            return ((card.orientation + direction) % 4 == 0)
                || ((card.orientation + direction) % 4 == 3);
        case 1:
            return ((card.orientation + direction) % 4 == 0)
                || ((card.orientation + direction) % 4 == 2);
        case 2:
            return (card.orientation + direction) % 4 == 0
                || (card.orientation + direction) % 4 == 2
                || (card.orientation + direction) % 4 == 3;
        case 3:
            return true;
        default:
            //throw exception;
            break;
    }
}

function isPath(cindex1, cindex2, lab) {
    var isPath = true;
    var direction;
    //direction = cindex1[0] > cindex2[0] : 
    if (cindex1[0] > cindex2[0]) {
        return isHalfPath(lab[cindex1[0]][cindex1[1]], DIRECTION.top) && isHalfPath(lab[cindex2[0]][cindex2[1]], DIRECTION.bottom)
    } else if (cindex1[0] < cindex2[0]) {
        return isHalfPath(lab[cindex1[0]][cindex1[1]], DIRECTION.bottom) && isHalfPath(lab[cindex2[0]][cindex2[1]], DIRECTION.top)
    } else if (cindex1[1] > cindex2[1]) {
        return isHalfPath(lab[cindex1[0]][cindex1[1]], DIRECTION.left) && isHalfPath(lab[cindex2[0]][cindex2[1]], DIRECTION.right)
    } else if (cindex1[1] < cindex2[1]) {
        return isHalfPath(lab[cindex1[0]][cindex1[1]], DIRECTION.right) && isHalfPath(lab[cindex2[0]][cindex2[1]], DIRECTION.left)
    } else {
        //throw exception
    }


}

function cardNotinPath(index, path) {
    var inPath = true
    path.forEach((card) => {
        if ((card[0] == index[0]) && (card[1] == index[1])) {
            inPath = false;
        }
    })
    return inPath;
}

/***
card11,card12,card13 / card21,card22, card23 / card31, card32, card33
player is at card31 and wants to move to card13 
test top > right > bottom > left
***/

var shortestPath;
var pathExists;

function testShortestPath(path) {
    if ((shortestPath.length === 0) || (shortestPath.length > path.length)) {
        shortestPath = path;
    }
    pathExists = true;
}

function indexEqual(index1, index2) {
    return index1.every((val, index) => val === index2[index]);
}

function testNextIndex(startIndex, nextIndex, goalIndex, lab, path) {
    if (isPath(startIndex, nextIndex, lab)) {
        if (indexEqual(nextIndex, goalIndex)) {
            testShortestPath(path);
        } else if (cardNotinPath(nextIndex, path)) {
            if (findPathR(nextIndex, goalIndex, lab, [...path, nextIndex])) { return true }
        }
    }
}


function findPathR(startIndex, goalIndex, lab, path) {
    var nextIndex;
    //test up
    if (startIndex[0] > 0) {
        nextIndex = [startIndex[0] - 1, startIndex[1]];
        testNextIndex(startIndex, nextIndex, goalIndex, lab, path);
    }

    // test right
    if (startIndex[1] < lab[0].length - 1) {
        nextIndex = [startIndex[0], startIndex[1] + 1];
        testNextIndex(startIndex, nextIndex, goalIndex, lab, path);
    }

    // test down
    if (startIndex[0] < lab.length - 1) {
        nextIndex = [startIndex[0] + 1, startIndex[1]];
        testNextIndex(startIndex, nextIndex, goalIndex, lab, path);
    }
    // test left
    if (startIndex[1] > 0) {
        nextIndex = [startIndex[0], startIndex[1] - 1];
        testNextIndex(startIndex, nextIndex, goalIndex, lab, path);
    }

    return pathExists;
};


export function findPath(startIndex, goalIndex, lab) {
    shortestPath = [];
    pathExists = false;
    let startIndexR = [startIndex[1], startIndex[0]];
    let goalIndexR = [goalIndex[1], goalIndex[0]];
    return findPathR(startIndexR, goalIndexR, lab, [startIndexR]);
}
export function getCardCode(shape, orientation) {
    //shape: 0
    let bin_array = [[1, 1, 0, 0], [1, 0, 1, 0], [1, 1, 1, 0], [1, 1, 1, 1]]

    let bin_card = bin_array[shape]

    for (let i = 0; i < orientation; i++) {

        const lastElement = bin_card.pop();
        bin_card.unshift(lastElement);
    }

return bin_card.reduce((acc,val,index) => acc + (val * 2^index))

}