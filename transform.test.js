const assert = require('assert');
const Quaternion = require('quaternion');
const Transform = require('./transform.js');

const EPSILON = 1e-5;

/** check that a and b are no more than epsilon apart */
const assertEpsilonEqual = (a, b) => {
  const getMsg = (aspect) => {
    return `wrong ${aspect}, ${JSON.stringify({a,b}, 2, 2)}`;
  };

  assert(a.orientation.equals(b.orientation), getMsg('orientation'));
  assert(Math.abs(a.position.x - b.position.x) < EPSILON, getMsg('x'));
  assert(Math.abs(a.position.y - b.position.y) < EPSILON, getMsg('y'));
  assert(Math.abs(a.position.z - b.position.z) < EPSILON, getMsg('z'));
}

const origin = {
  position: { x: 0, y: 0, z: 0 },
  orientation: Quaternion.fromEuler(0, 0, 0)
};

describe('test Transform', function() {

  it('should transform a pose back to origin when using the inversse of the transform created from the pose itself', function() {
    const pose = {
      position: { x: 1, y: 0, z: 1 },
      orientation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    };
    const t = new Transform({
      translation: pose.position,
      rotation: pose.orientation
    });
    const tInv = t.getInverse();
    assertEpsilonEqual(tInv.apply(pose), origin);
  });


  it('should transform the origin to the origin of the transform', function() {
    const transform = {
      translation: { x: 1, y: 2, z: 3 },
      rotation: Quaternion.fromEuler(Math.PI/2, 3, -2).normalize()
    };
    const t = new Transform(transform);
    assertEpsilonEqual(t.apply(origin), {
      position: transform.translation,
      orientation: transform.rotation
    });
  });

  it('should translate correctly', function() {
    const pose = { // in frame y
      position: { x: 1, y: 0, z: 0 },
      orientation: Quaternion.fromEuler(0, 0, 0)
    };
    const t = new Transform({ // from frame x to frame y
      translation: { x: -1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, 0)
    });
    assertEpsilonEqual(t.apply(pose), origin);
  });

  it('should performs a known transform correctly', function() {
    const pose = { // in frame y
      position: { x: 1, y: 0, z: 0 },
      orientation: Quaternion.fromEuler(0, 0, 0)
    };
    const t = new Transform({ // from frame x to frame y
      translation: { x: -1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(Math.PI/2, 0, 0).normalize()
    });
    const shouldBePose = {
      position: { x: -1, y: 1, z: 0 },
      orientation: Quaternion.fromEuler(Math.PI/2, 0, 0).normalize()
    };
    assertEpsilonEqual(t.apply(pose), shouldBePose);
  });

  it('should invert correctly', function() {
    const pose = {
      position: { x: 1, y: 0, z: 1 },
      orientation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    };
    const t = new Transform({
      translation: { x: 0, y: 1, z: 0 },
      rotation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    });
    const tInv = t.getInverse();
    assertEpsilonEqual(tInv.apply(t.apply(pose)), pose);
  });

  it('should multiply two transforms correctly', function() {
    const t1 = new Transform({
      translation: { x: 0, y: 1, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, 0)
    });
    const t2 = new Transform({
      translation: { x: 1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, 0)
    });
    const tCombined = t1.multiply(t2);
    const shouldBePose = {
      position: { x: 1, y: 1, z: 0 },
      orientation: Quaternion.fromEuler(0, 0, 0)
    };
    assertEpsilonEqual(tCombined.apply(origin), shouldBePose);
  });


  it('should multiply two transforms correctly 2', function() {
    const t1 = new Transform({
      translation: { x: 0, y: 1, z: 0 },
      rotation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    });
    const t2 = new Transform({
      translation: { x: 1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, 0)
    });
    const tCombined = t1.multiply(t2);
    const shouldBePose = {
      position: { x: 0, y: 2, z: 0 },
      orientation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    };
    assertEpsilonEqual(tCombined.apply(origin), shouldBePose);
  });

  it('should multiply two transforms correctly 3', function() {
    const t1 = new Transform({
      translation: { x: 0, y: 1, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, 0)
    });
    const t2 = new Transform({
      translation: { x: 1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, Math.PI/2)
    });
    const tCombined = t1.multiply(t2);
    const shouldBePose = {
      position: { x: 1, y: 1, z: 0 },
      orientation: Quaternion.fromEuler(0, 0, Math.PI/2)
    };
    assertEpsilonEqual(tCombined.apply(origin), shouldBePose);
  });

  it('should multiply two transforms correctly 3', function() {
    const t1 = new Transform({
      translation: { x: 0, y: 1, z: 0 },
      rotation: Quaternion.fromEuler(Math.PI/2, 0, 0)
    });
    const t2 = new Transform({
      translation: { x: 1, y: 0, z: 0 },
      rotation: Quaternion.fromEuler(0, 0, Math.PI/2)
    });
    const tCombined = t1.multiply(t2);
    const shouldBePose = {
      position: { x: 0, y: 2, z: 0 },
      orientation: Quaternion.fromEuler(Math.PI/2, 0, Math.PI/2)
    };
    assertEpsilonEqual(tCombined.apply(origin), shouldBePose);
  });
});
