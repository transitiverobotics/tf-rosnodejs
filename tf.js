/**
  Implements all we need in terms of TF (tf tree buffering, lookup,
  interpolation).
*/

const _ = require('lodash');
const Quaternion = require('quaternion');
const Transform = require('./transform.js');
const Vector3 = require('./vector3.js');
const Forest = require('./forest');

// -----------------------------------------------------------------------
// TF Buffering

/* tfBuffer buffers the TFs, indexed by child_frame_id
   { toName1: transform1,
     toName2: transform2,
     ....
   }
*/
const tfBuffer = {};

/** put together edges into a forrest, or, hopefully, a tree if only one root */
const tfForest = new Forest();


/** Simple FIFO queue */
class Queue {
  constructor(size) {
    this.size = size;
    this.list = [];
  }

  add(element) {
    this.list.push(element);
    if (this.list.length > this.size) {
      this.list.shift();
    }
  }

  getTop() {
    return this.list[this.list.length - 1];
  }

  getList() {
    return this.list;
  }
}


const bufferTFs = (tfs, size, nodeUri) => {
  tfs.transforms.forEach((tf) => {

    const parentFrame = tf.header.frame_id.replace(/^\//, '');
    const childFrame = tf.child_frame_id.replace(/^\//, '');
    const treeChanged = tfForest.add(parentFrame, childFrame, {nodeUri, tf});
    // #TODO: need to allow for multiple nodes on the same edge, just for reporting

    // if (treeChanged) {
    //   console.log(JSON.stringify(tfForest.roots, 2, 2));
    // }

    if (!tfBuffer[childFrame]) {
      tfBuffer[childFrame] = new Queue(10);
    }
    tfBuffer[childFrame].add(tf);
  });
};

/** convert ROS timestamp to milliseconds */
const stampToMS = (stamp) => stamp.secs * 1e3 + stamp.nsecs / 1e6;

/** compute difference (in ms) between two ROS time stamps */
const timeDiff = (a, b) => stampToMS(b) - stampToMS(a);


/** Interpolate between two transforms, before and after,
  proportionate to their distance to time */
const interpolateTF = (before, after, time) => {
  const b = stampToMS(before.header.stamp);
  const a = stampToMS(after.header.stamp);
  const t = stampToMS(time);
  const lambda = (a - t)/(a - b);

  const rtv = { transform: {
    translation: (new Vector3(before.transform.translation)).multiply(lambda).add(
      (new Vector3(after.transform.translation)).multiply(1 - lambda) ),
    rotation: (new Quaternion(before.transform.rotation))
      .slerp(new Quaternion(after.transform.rotation))(1 - lambda)
  }};
  return rtv;
};

/** get the TF from the given frame's parent to the frame, interpolated to time */
const getInterpolatedTF = (frame, time) => {
  const list = tfBuffer[frame].getList();
  let before;
  let after;
  // find buffered TF before and after given time
  for (let i = 0; i < list.length; i++) {
    diff = timeDiff(list[i].header.stamp, time);
    if (diff > 0) {
      before = list[i];
    }
    if (diff < 0) {
      after = list[i];
      break;
    }
  }
  if (before && after) {
    // we have a before and an after: interpolate
    return interpolateTF(before, after, time);
  } else {
    return before || after; // return whichever one we found
  }
};

/** given a node name, generate list of all ancestors node names (from root to node) */
const getAncestors = (nodeName) => {
  let current = tfForest.nodes[nodeName];
  const ancestors = [];
  while (current.parentName) {
    ancestors.unshift(current.name);
    current = tfForest.nodes[current.parentName];
  }
  ancestors.unshift(current.name);
  return ancestors;
};

/** find path from a to b in the tree */
const findPath = (a, b) => {
  // get list on ancestors for both nodes
  const aAncestors = getAncestors(a);
  const bAncestors = getAncestors(b);
  // truncate maximal common prefix
  while (aAncestors[0] == bAncestors[0]) {
    aAncestors.shift();
    bAncestors.shift();
  }
  // yes, we don't need the common ancestor because edge data (TFs) is stored
  // on the child nodes

  // now merge into one path
  const path = aAncestors
      .reverse().map(x => `-${x}`) // up the a chain, '-' denotes inverse
      .concat(bAncestors); // down the b chain
  return path;
};

/** lookup path from a to b at time {secs, nsecs} */
const getTF = (a, b, time = undefined) => {
  const path = findPath(a, b);

  if (path) {
    let currentTF;
    path.forEach( (nextFrame) => {
      const reverse = (nextFrame[0] == '-');
      if (reverse) nextFrame = nextFrame.slice(1);

      // find the transform in the buffer that is closest in time
      const closestTransform = (time ? getInterpolatedTF(nextFrame, time)
        : tfBuffer[nextFrame].getTop());

      let nextTF = new Transform(closestTransform.transform);
      if (reverse) nextTF = nextTF.getInverse();

      if (currentTF) {
        currentTF = currentTF.multiply(nextTF);
      } else {
        currentTF = nextTF;
      }
    });
    return currentTF;

  } else {
    console.log(`no path from ${a} to ${b}`);
  }
};

// const waitForTF = (a, b) => {
//   const waiter = (resolve, reject) => {
//     const transform = getTF(a, b);
//     if (transform) {
//       resolve(transform);
//     } else {
//       setTimeout(() => waiter(resolve, reject), 2000);
//     }
//   };
//   return new Promise(waiter);
// }

const options = {queueSize: 1, throttleMs: -1, latching: true};

module.exports = {

  init(rosNode) {
    rosNode.subscribe('/tf', 'tf2_msgs/TFMessage', bufferTFs, options);
    rosNode.subscribe('/tf_static', 'tf2_msgs/TFMessage', bufferTFs, options);
  },

  getTF: getTF,

  getForest: () => tfForest.roots
};
