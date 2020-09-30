const rosnodejs = require('rosnodejs');
const tf = require('./tf.js');
const { exec, spawn } = require('child_process');

const assert = require('assert');

/** this test requires there being a publisher of the map to odom transform */
describe('test TF', function() {
  const processes = [];

  before(function(done) {
    this.timeout(3000); // allow longer setup

    rosnodejs.initNode('/tfjs_test').then(async (rosNode) => {
      tf.init(rosNode);
      setTimeout(() => console.log(JSON.stringify(tf.getForest(), 2, 2)), 500);
    });

    console.log('starting some static publishers');
    /** f1
         ├─f4
         └─f2
            └─f3
    */
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 2 0 0 0 0 0 f1 f4'.split(' ')));
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 1 0 0 0 0 0 f1 f2'.split(' ')));
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 0 1 0 0 0 0 f2 f3'.split(' ')));

    setTimeout(done, 1000);
  })

  after(function() {
    console.log('shutting down');
    processes.forEach(p => p.kill('SIGINT'));
    rosnodejs.shutdown();
  })

  it('should receive TFs from static, forward', function() {
    const transform = tf.getTF('f1','f3');
    assert(transform);
    assert.equal(transform.translation.x, 1);
    assert.equal(transform.translation.y, 1);
    assert.equal(transform.translation.z, 0);
  });

  it('should receive TFs from static, reverse', function() {
    const transform = tf.getTF('f3','f1');
    assert(transform);
    assert.equal(transform.translation.x, -1);
    assert.equal(transform.translation.y, -1);
    assert.equal(transform.translation.z, 0);
  });

  it('should receive TFs from static, across', function() {
    const transform = tf.getTF('f2','f4');
    assert(transform);
    assert.equal(transform.translation.x, 1);
    assert.equal(transform.translation.y, 0);
    assert.equal(transform.translation.z, 0);
  });
});
