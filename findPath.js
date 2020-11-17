/*****
Fragen: - wie finde ich die aktuelle Zielkarte an Hand der Nummer der Goals?


Pathfinding?
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

function isHalfPath(card,direction) { // direction: 1 -> left, 2 -> bottom, 3 -> right
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

function isPath(cindex1,cindex2,lab) {
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

    function cardNotinPath(index,path) {
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
    
    export var potentialPath = [];
    export function findPath(startindex,goalindex,lab, path) {

        console.log(path);
    
        //test up
        if (startindex[0] > 0 && isPath(startindex,[startindex[0] -1,startindex[1]],lab)) { 
            if (((startindex[0] - 1) == goalindex[0]) && (startindex[1] == goalindex[1])) {
                return true;
            } else if (cardNotinPath([startindex[0] -1,startindex[1]],path)) {
                if (findPath([startindex[0] -1,startindex[1]],goalindex,lab,[...path,[startindex[0] -1,startindex[1]]])) {return true}
            }
        }   
        // test right
        if (startindex[1] < lab[0].length -1 && isPath(startindex,[startindex[0],startindex[1]+1],lab)) {
             if (((startindex[0]) == goalindex[0]) && (startindex[1] + 1 == goalindex[1])) {
                return true;
            } else if (cardNotinPath([startindex[0],startindex[1] + 1],path)) {
                if (findPath([startindex[0],startindex[1] + 1],goalindex,lab,[...path,[startindex[0],startindex[1] + 1]])) { return true }
            }
        }
        // test down
        if (startindex[0] < lab.length - 1 && isPath(startindex,[startindex[0] + 1,startindex[1]],lab)) {
             if (((startindex[0] + 1) == goalindex[0]) && (startindex[1] == goalindex[1])) {
                return true;
            } else if (cardNotinPath([startindex[0] + 1,startindex[1]],path)) {
                if (findPath([startindex[0] + 1,startindex[1]],goalindex,lab,[...path,[startindex[0] + 1,startindex[1]]])) {return true}
            }
        }
        // test left
        if (startindex[1] > 0 && isPath(startindex,[startindex[0],startindex[1] - 1],lab)) {
             if (((startindex[0]) == goalindex[0]) && (startindex[1] - 1 == goalindex[1])) {
                return true;
            } else if (cardNotinPath([startindex[0],startindex[1] - 1],path)) {
                if (findPath([startindex[0],startindex[1] - 1],goalindex,lab,[...path,[startindex[0],startindex[1] - 1]])) {return true}
            }
        } 
            return false
        
    };