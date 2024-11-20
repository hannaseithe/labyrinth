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
      
            // Greedily pick an action based on online DQN output.
            tf.tidy(() => {
                const [labTensor,otherTensor] =
                    getStateTensors(state,this.game.config);
                const predictionTensor = this.onlineNetwork.predict([labTensor,otherTensor]).reshape([-1]);
                action1 = predictionTensor.slice(0, 4).argMax(-1).dataSync()[0]
                action2 = predictionTensor.slice(4, this.game.config.numActionsShiftCard).argMax(-1).dataSync()[0]
                action3 = predictionTensor.slice(4 + this.game.config.numActionsShiftCard, this.game.config.numActionsMove).argMax(-1).dataSync()[0]
            });
        

        this.game.step(action1, action2, action3);


    }
}