import { getStateTensors, getRandomActions, REWARDS} from './lab.js';
import { ReplayMemory } from './replayMemory.js';

class LabGameAgent {
    constructor(game, config, model) {

        this.game = game;
        this.onlineNetwork = model;
        this.replayMemory = new ReplayMemory(config.replayBufferSize);
        this.cumulativeReward = 0;

    }

    playStep() {

        // The epsilon-greedy algorithm.
        let action1, action2, action3;
        let negativeReward = 0;
        const state = this.game.getState();
        if (Math.random() < this.epsilon) {
            // Pick an action at random.
            [action1, action2, action3 ] = getRandomActions();
        } else {
            // Greedily pick an action based on online DQN output.
            tf.tidy(() => {
                const {labTensor,otherTensor} =
                    getStateTensors(state);
                const predictionTensor = this.onlineNetwork.predict([labTensor,otherTensor]);
                action1 = predictionTensor.slice(0, 4).argMax(-1).dataSync()[0]
                action2 = predictionTensor.slice(4, 20).argMax(-1).dataSync()[0]
                action3 = predictionTensor.slice(20, 100).argMax(-1).dataSync()[0]
            });
        }

        const { state: nextState, reward, done } = this.game.step(action1, action2, action3);

        this.replayMemory.append([state, [action1, action2, action3], reward, 0, done, nextState, null]);

        this.cumulativeReward_ += reward;

        switch (reward) {
            case REWARDS.WIN: 
                negativeReward = REWARDS.LOST;
                break;
            case REWARDS.NUMBER_FOUND:
                negativeReward = REWARDS.OTHER_FOUND_NUMBER;
                break;
        }

        return {
            state: nextState,
            cumulativeReward: this.cumulativeReward,
            done: done,
            negativeReward: negativeReward
        }


    }

    trainOnReplayBatch(batchSize, gamma, optimizer) {
        // Get a batch of examples from the replay buffer.
        const batch = this.replayMemory.sample(batchSize);
        const lossFunction = () => tf.tidy(() => {
            const stateTensors = getStateTensors(
                batch.map(example => example[0]), this.game.height, this.game.width);
            const actionTensor = tf.tensor1d(
                batch.map(example => tf.oneHot(example[1][0],4)
                    .concat(tf.oneHot(example[1][1],16))
                    .concat(tf.oneHot(example[1][2],81))), 'int32');
            const qs = tf.split(this.onlineNetwork.apply(stateTensors, { training: true }),[4,16,81])
                .mul(actionTensor).sum(-1);

            const rewardTensor = tf.tensor1d(batch.map(example => example[2]));
            const nextStateTensor = getStateTensor(
                batch.map(example => example[4]), this.game.height, this.game.width);
            const nextMaxQTensor =
                this.targetNetwork.predict(nextStateTensor).max(-1);
            const doneMask = tf.scalar(1).sub(
                tf.tensor1d(batch.map(example => example[3])).asType('float32'));
            const targetQs =
                rewardTensor.add(nextMaxQTensor.mul(doneMask).mul(gamma));
            return tf.losses.meanSquaredError(targetQs, qs);
        });

        // Calculate the gradients of the loss function with repsect to the weights
        // of the online DQN.
        const grads = tf.variableGrads(lossFunction);
        // Use the gradients to update the online DQN's weights.
        optimizer.applyGradients(grads.grads);
        tf.dispose(grads);
        // TODO(cais): Return the loss value here?
    }

    reset() {
        this.cumulativeReward = 0;
    }

    addNegativeReward(reward) {
        this.replayMemory.addNegativeReward(reward);
    }

    addFinalState(state) {
        this.replayMemory.addFinalState(state);
    }

    setDone() {
        this.replayMemory.setDone();
    }

}

export class LabGameSuperAgent {
    constructor(number, game, config) {

        this.epsilonInit = config.epsilonInit;
        this.epsilonFinal = config.epsilonFinal;
        this.epsilonDecayFrames = config.epsilonDecayFrames;
        this.epsilonIncrement_ = (this.epsilonFinal - this.epsilonInit) /
            this.epsilonDecayFrames;

            //TODO import "createDeepQNetwork"
        this.onlineNetwork =
            createDeepQNetwork(game.height, game.width);
        //TODO create targetNetwork and hand it over to LabGameAgents(not entirely sure we really need it though)

        this.agents = [];
        for (i = 0; i < number; i++) {
            this.agents[i] = new LabGameAgent(game, config, this.s)
        }

    }

    playTurn() {

        let doneTurn = false;
        let turnResults = [];
        let step = 0;
        //TODO doneTurn bleibt immer TRUE!!! Ordentliche Loop
        while (!doneTurn) {
            step++;
            let { state, cumulativeReward, negativeReward, done} = this.agents[step].playStep();
            if (!done) {
                turnResults.append({ state, cumulativeReward, done });
                this.agents[step - 1].addNegativeReward(negativeReward);
                this.agents[step - 2].addNegativeReward(negativeReward);
                this.agents[step - 3].addNegativeReward(negativeReward);
                this.agents[step - 3].addFinalState(state);
            } else {
                doneTurn = true;
                this.agents[step - 1].addNegativeReward(negativeReward);
                this.agents[step - 2].addNegativeReward(negativeReward);
                this.agents[step - 3].addNegativeReward(negativeReward);
                this.agents[step - 1].addFinalState(state);
                this.agents[step - 2].addFinalState(state);
                this.agents[step - 3].addFinalState(state);
                this.agents[step - 1].setDone();
                this.agents[step - 2].setDone();
                this.agents[step - 3].setDone();

            }
        }
        //TODO punish other agents on success (doneTurn as well as numberFound)?

        this.cumulativeRewards_ = turnResults.map((result) => result.cumulativeReward);

        this.actions_ = turnsResults.map((result) => result.actions);

        const output = {
            actions: this.actions_,
            cumulativeReward: this.cumulativeRewards_,
            done: doneTurn,
            stepsPlayed: step
        };
        if (doneTurn) {
            this.reset();
        }
        return output;

    }

    trainOnReplayBatch(batchSize, gamma, optimizer) {
        this.agents.forEach((agent) => agent.trainOnReplayBatch(batchSize, gamma, optimizer))
    }

    reset() {
        this.agents.forEach((agent) => agent.reset());

        this.game.reset();
    }

}