const tf_r = require('@tensorflow/tfjs-node')
//import * as tf from '@tensorflow/tfjs'
//import * as tf from '@tensorflow/tfjs';

/** Replay buffer for DQN training. */
class ReplayMemory {
maxLen;
buffer;
index;
length;
bufferIndices_;
initialNegativeReward;
  constructor(maxLen) {
    this.maxLen = maxLen;
    this.buffer = [];
    for (let i = 0; i < maxLen; ++i) {
      this.buffer.push(null);
    }
    this.index = 0;
    this.length = 0;
    this.initialNegativeReward = 0;

    this.bufferIndices_ = [];
    for (let i = 0; i < maxLen; ++i) {
      this.bufferIndices_.push(i);
    }
  }

  /**
   * Append an item to the replay buffer.
   *
   * @param {any} item The item to append.
   */
  append(item) {
    this.buffer[this.index] = item;
    if(this.index == 0) {
      this.buffer[this.index][3] = this.initialNegativeReward
    }
    this.length = Math.min(this.length + 1, this.maxLen);
    this.index = (this.index + 1) % this.maxLen;
  }

  /**
   * Randomly sample a batch of items from the replay buffer.
   *
   * The sampling is done *without* replacement.
   *
   * @param {number} batchSize Size of the batch.
   * @return {Array<any>} Sampled items.
   */
  sample(batchSize) {
    if (batchSize > this.maxLen) {
      throw new Error(
          `batchSize (${batchSize}) exceeds buffer length (${this.maxLen})`);
    }
    tf_r.util.shuffle(this.bufferIndices_);

    const out = [];
    for (let i = 0; i < batchSize; ++i) {
      out.push(this.buffer[this.bufferIndices_[i]]);
    }
    return out;
  }

  addNegativeReward(reward) {
    if (this.index == 0) {
      this.initialNegativeReward += reward 
    } else {
      this.buffer[this.index - 1][3] += reward
    }

  }

  addFinalState(state) {
    if (this.index > 0) {
        this.buffer[this.index - 1][6] = state;
    }
}
setDone() {
    if (this.index > 0) {
        this.buffer[this.index - 1][4] = true;
    }

}
}
module.exports = { ReplayMemory}