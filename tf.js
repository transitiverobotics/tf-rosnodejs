/**
  Implements all we need in terms of TF (tf tree buffering, lookup,
  interpolation).

  TODO: so far only supports forward lookup. Not yet reverse and
  up-down. See algorithm used in https://github.com/RethinkRobotics-opensource/tf2_nodejs/blob/kinetic-devel/src/TfChain.js#L36.
*/

const _ = require('lodash');
const Transform = require('./transform.js');
const Vector3 = require('./vector3.js');
const Quaternion = require('quaternion');

// -----------------------------------------------------------------------
// TF Buffering

/* tfBuffer is a matrix
  { fromName1: {
      toName1: transform1,
      toName2: transform2,
      ....
    },
    fromName2: ...
  }
*/
const tfBuffer = {};

/* paths in the TF tree of the form:
  { fromName1: {
      toName1: [list of frames to go through, incl. toName1],
      ...
    },
    ...
  }
  We buffer all forward paths so we don't need to search
  for forward lookups.
*/
const tfPaths = {};

const enumeratePathsTo = function * (to) {
  for (let from in tfPaths) {
    const tos = tfPaths[from];
    if (tos[to]) {
      yield {
        from,
        path: tos[to] // the path from 'from' to 'to'
      };
    }
  }
};

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


const bufferTFs = (tfs) => {
  tfs.transforms.forEach((tf) => {

    const parentFrame = tf.header.frame_id.replace(/^\//, '');
    const childFrame = tf.child_frame_id.replace(/^\//, '');
    // console.log('tf', parentFrame, childFrame);

    if (!tfBuffer[parentFrame]) {
      tfBuffer[parentFrame] = {};
    }

    const parent = tfBuffer[parentFrame];

    if (!parent[childFrame]) {
      console.log('got tf for', parentFrame, childFrame);
      parent[childFrame] = new Queue(10);

      if (!tfPaths[parentFrame]) {
        tfPaths[parentFrame] = {};
      }

      // add new paths
      const pathsToParent = Array.from(enumeratePathsTo(parentFrame));
      const pathsFromChild = tfPaths[childFrame];

      // for each path from the child
      _.each( pathsFromChild, (subPath, subChild) => {
        const newSubPath = [childFrame].concat(subPath);
        // for each path to the parent
        _.each( pathsToParent, ({from, path}) => {
          // add that child-path to the path-to-the-parent
          tfPaths[from][subChild] = path.concat(newSubPath);
        });

        tfPaths[parentFrame][subChild] = newSubPath;
      });

      _.each( pathsToParent, ({from, path}) => {
        // add that child-path to the path-to-the-parent
        tfPaths[from][childFrame] = path.concat([childFrame]);
      });
      tfPaths[parentFrame][childFrame] = [childFrame];
    }

    parent[childFrame].add(tf);
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

/** get the TF between the given frames, interpolated to time */
const getInterpolatedTF = (frame1, frame2, time) => {
  const list = tfBuffer[frame1][frame2].getList();
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

/** lookup path from a to b at time {secs, nsecs} */
const getTF = (a, b, time = undefined) => {
  const path = tfPaths[a] && tfPaths[a][b];

  if (path) {
    let currentFrame = a;
    let currentTF;
    path.forEach( (nextFrame) => {

      // find the transform in the buffer that is closest in time
      const closestTransform = (
        time ? getInterpolatedTF(currentFrame, nextFrame, time)
        : tfBuffer[currentFrame][nextFrame].getTop()
      );

      const nextTF = new Transform(closestTransform.transform);
      if (currentTF) {
        currentTF = currentTF.multiply(nextTF);
      } else {
        currentTF = nextTF;
      }
      currentFrame = nextFrame;
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

  getTF: getTF
};
