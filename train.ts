//set up model
//initial Game with agents
//play game x number of times
//learn


//create Model

//STATE:
//CONVOLUTIONAL layer for labyrinth [x][y] : shape, orientation, number -> so wie RGB Pixel
//player: currentIndex: [indexX, indexY],listNumbers: listNumbers
//extraCard: shape,orientation,number
//currentPlayer

import * as tf from '@tensorflow/tfjs-node'
import * as fs from 'fs';
import * as path from 'path';
import * as argparse from 'argparse';
import { LabGameSuperAgent } from './agent.js';
import { LabGame } from './lab.js';
import { copyWeights } from './dqn.js';


async function train(superAgent, batchSize, gamma, learningRate, cumulativeRewardThreshold,
  maxNumFrames, syncEveryFrames, savePath, logDir) {


  while (!superAgent.buffersFull) {
    const { done, cumulativeRewards} = superAgent.playTurn();
    if (done) {
      console.log(`game finished - counter: ${superAgent.doneCounter} ratio: ${superAgent.doneCounter / superAgent.frameCount}`)
    }
    const totalReward = cumulativeRewards.reduce((acc, value) => (acc + value));
    if (superAgent.frameCount % 1000 == 0) {
      console.log("Turn: " + superAgent.frameCount)
    }
 
  }

  const optimizer = tf.train.adam(learningRate);
  let totalRewardBest = -100000;
  console.log('starting training on Replay Batch')
  while (true) {

    superAgent.trainOnReplayBatch(batchSize, gamma, optimizer);
    const { done, cumulativeRewards } = superAgent.playTurn();
    const totalReward = cumulativeRewards.reduce((acc, value) => (acc + value));
    if (done) {
      console.log(`\x1b[35m game finished - counter: ${superAgent.doneCounter}  ratio: ${superAgent.doneCounter / superAgent.frameCount} \x1b[37m`)
      

      if (totalReward > totalRewardBest) {
        totalRewardBest = totalReward;
        if (savePath != null) {
          if (!fs.existsSync(savePath)) {
            fs.mkdir(path.join(__dirname, savePath),
              { recursive: true },
              (err) => {
                if (err) {
                  return console.error(err);
                }
                console.log('Directory created successfully!');
              });

          }
          await superAgent.onlineNetwork.save(`file://${savePath}`);
          console.log(`\x1b[33m Saved DQN to ${savePath} with total reward: ${totalReward} \x1b[37m`);
        }
      }
    }
    if (superAgent.frameCount % 100 == 0) {
      console.log("Turn: " + superAgent.frameCount)
      superAgent.agents.forEach((agent, i) => {
        console.log(`Agent ${i} current exponential moving average: \x1b[36m ${agent.loss} \x1b[37m`)
        console.log(`epsilon: ${agent.epsilon}`)
      })
    }
    if (superAgent.frameCount % 1000 === 0) {
      if (savePath != null) {
        if (!fs.existsSync(savePath)) {
          fs.mkdir(path.join(__dirname, savePath),
            { recursive: true },
            (err) => {
              if (err) {
                return console.error(err);
              }
              console.log('Directory created successfully!');
            });
        }
        await superAgent.onlineNetwork.save(`file://${savePath}`);
        console.log(`%c Saved DQN to ${savePath}`, "color:green;");
      }
    }
    if (superAgent.frameCount >= maxNumFrames) {
      if (totalReward > totalRewardBest) {
        totalRewardBest = totalReward;
        if (savePath != null) {
          if (!fs.existsSync(savePath)) {
            fs.mkdir(path.join(__dirname, savePath),
              { recursive: true },
              (err) => {
                if (err) {
                  return console.error(err);
                }
                console.log('Directory created successfully!');
              });
          }
          await superAgent.onlineNetwork.save(`file://${savePath}`);
          console.log(`%c Saved DQN to ${savePath}`, "color:green;");
        }
      }
      break;
    }
    if (superAgent.frameCount % syncEveryFrames === 0) {
      copyWeights(superAgent.targetNetwork, superAgent.onlineNetwork);
      console.log('Sync\'ed weights from online network to target network');
    }
  }


}

function parseArguments() {
  const parser = new argparse.ArgumentParser({
    description: 'Training script for a DQN that plays the labyrinth game'
  });
  parser.addArgument('--gpu', {
    action: 'storeTrue',
    help: 'Whether to use tfjs-node-gpu for training ' +
      '(requires CUDA GPU, drivers, and libraries).'
  });
  parser.addArgument('--height', {
    type: 'int',
    defaultValue: 3,
    help: 'Height of the game board.'
  });
  parser.addArgument('--width', {
    type: 'int',
    defaultValue: 3,
    help: 'Width of the game board.'
  });
  parser.addArgument('--cumulativeRewardThreshold', {
    type: 'float',
    defaultValue: 100,
    help: 'Threshold for cumulative reward (its moving ' +
      'average) over the 100 latest games. Training stops as soon as this ' +
      'threshold is reached (or when --maxNumFrames is reached).'
  });
  parser.addArgument('--maxNumFrames', {
    type: 'float',
    defaultValue: 7e5,
    help: 'Maximum number of frames to run durnig the training. ' +
      'Training ends immediately when this frame count is reached.'
  });
  parser.addArgument('--replayBufferSize', {
    type: 'int',
    defaultValue: 5e4,
    help: 'Length of the replay memory buffer.'
  });
  parser.addArgument('--epsilonInit', {
    type: 'float',
    defaultValue: 1,
    help: 'Initial value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonFinal', {
    type: 'float',
    defaultValue: 0.1,
    help: 'Final value of epsilon, used for the epsilon-greedy algorithm.'
  });
  parser.addArgument('--epsilonDecayFrames', {
    type: 'int',
    defaultValue: 3e4,
    help: 'Number of frames of game over which the value of epsilon ' +
      'decays from epsilonInit to epsilonFinal'
  });
  parser.addArgument('--epsilonDecayFactor', {
    type: 'int',
    defaultValue: 0.99995,
    help: 'Factor by watch epsilon is exponentially decayed'
  });
  parser.addArgument('--batchSize', {
    type: 'int',
    defaultValue: 32,
    help: 'Batch size for DQN training.'
  });
  parser.addArgument('--gamma', {
    type: 'float',
    defaultValue: 0.97,
    help: 'Reward discount rate.'
  });
  parser.addArgument('--learningRate', {
    type: 'float',
    defaultValue: 1e-4,
    help: 'Learning rate for DQN training.'
  });
  parser.addArgument('--syncEveryFrames', {
    type: 'int',
    defaultValue: 5e2,
    help: 'Frequency at which weights are sync\'ed from the online network ' +
      'to the target network.'
  });
  parser.addArgument('--savePath', {
    type: 'string',
    defaultValue: '../models/dqn',
    help: 'File path to which the online DQN will be saved after training.'
  });
  parser.addArgument('--logDir', {
    type: 'string',
    defaultValue: null,
    help: 'Path to the directory for writing TensorBoard logs in.'
  });
  return parser.parseArgs();
}

async function main() {

  const args = parseArguments();

  console.log(`args: ${JSON.stringify(args, null, 2)}`);

  let game = new LabGame(0, 1, args.height, args.width, false);

  let agentConfig = {
    replayBufferSize: args.replayBufferSize,
    epsilonInit: args.epsilonInit,
    epsilonFinal: args.epsilonFinal,
    epsilonDecayFrames: args.epsilonDecayFrames,
    epsilonDecayFactor: args.epsilonDecayFactor,
    learningRate: args.learningRate
  }

  let superAgent = new LabGameSuperAgent(1, game, agentConfig);

  await train(
    superAgent, args.batchSize, args.gamma, args.learningRate,
    args.cumulativeRewardThreshold, args.maxNumFrames,
    args.syncEveryFrames, args.savePath, args.logDir);
}


main();