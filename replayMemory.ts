import * as tf from '@tensorflow/tfjs-node'
//import * as tf from '@tensorflow/tfjs';

/** Replay buffer for DQN training. */
export class ReplayMemory {
  maxLen;
  buffer;
  sBuffer;
  index;
  length;
  bufferIndices_;
  initialNegativeReward;
  bufferFull;
  constructor(maxLen) {
    this.maxLen = maxLen;
    this.buffer = [];
    this.bufferFull = false;
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
    if (!item) {
      throw new Error("undefined item appended to replayMemory")
    }
    this.buffer[this.index] = item;
    if (this.index == 0 && !this.bufferFull) {
      this.buffer[this.index][3] = this.initialNegativeReward
    }
    this.length = Math.min(this.length + 1, this.maxLen);
    if (this.index == this.maxLen - 1) {
      this.bufferFull = true
    }
    this.index = (this.index + 1) % this.maxLen;

    return this.bufferFull
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
    if (!this.bufferFull) {
      throw new Error(`trying to sample before buffer is filled. Current index at: ${this.index}`)
    }
    tf.util.shuffle(this.bufferIndices_);
    const preOut = []
    const out = [];

    /*To learn from more meaningful moves we chose moves with higher rewards with greater probablity
    */
    // preselect a Set (preOut) of Size 1% of Buffer Size
    for (let i = 0; i < this.maxLen * 0.01 * batchSize; ++i) { 
      let item = this.buffer[this.bufferIndices_[i]]
      if (item) {
        preOut.push(item);
      }else {
        throw new Error(`null item in batch at ${this.bufferIndices_[i]}`)
      }
      
    }
    //Sort preselection so that highest reward is in front
    preOut.sort((i1,i2) => {return (i2[2]+i2[3]) - (i1[2] + i1[3])})
    //return batchsize elements of sorted preseclection
    return preOut.slice(0,batchSize);
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

