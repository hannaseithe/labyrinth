import * as tf from '@tensorflow/tfjs'
import { getStateTensors } from './lab.js';

export class LabGamePlayer {
    game;
    onlineNetwork;
    constructor(game, online) {
        this.game = game;
        this.onlineNetwork = online;
    }

    playStep() {


        // The epsilon-greedy algorithm.
        let action1, action2, action3;
        const state = this.game.getState();
        let numA3 = this.game.config.numActionsMove
        let numA2 = this.game.config.numActionsShiftCard
      

            tf.tidy(() => {
                const [labTensor, otherTensor] =
                    getStateTensors(state, this.game.config);
                // const a = labTensor.dataSync()
                //const b = otherTensor.dataSync()
                const predValue = this.onlineNetwork.predict([labTensor, otherTensor]).argMax(-1).dataSync()[0];
                action1 = Math.floor(predValue / (numA2*numA3))
                action2 = Math.floor((predValue % (numA2+numA3))/numA3)
                action3 = predValue % numA3
            });
        

        this.game.stepAsync(action1, action2, action3);


    }
}