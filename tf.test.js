const rosnodejs = require('rosnodejs');
const tf = require('./tf.js');
const { exec, spawn } = require('child_process');

const assert = require('assert');

rosnodejs.initNode('/tfjs_test').then(async (rosNode) => {
  tf.init(rosNode);
  setTimeout(() => console.log(JSON.stringify(tf.getForest(), 2, 2)), 500);
});

/** this test requires there being a publisher of the map to odom transform */
describe('test TF', function() {
  const processes = [];

  before(function() {
    console.log('starting some static publishers');
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 1 0 0  0 0 0 f1 f2'.split(' ')));
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 2 0 0  0 0 0 f1 f4'.split(' ')));
    processes.push(spawn('rosrun',
      'tf2_ros static_transform_publisher 0 1 0  0 0 0 f2 f3'.split(' ')));
  })

  after(function() {
    console.log('shutting down');
    processes.forEach(p => p.kill('SIGINT'));
    rosnodejs.shutdown();
  })

  it('should receive TFs from static', function(done) {
    this.timeout(3000);
    setTimeout(() => {
        const transform = tf.getTF('f1','f3');
        assert(transform, 'received static TF');
        done();
      }, 1000);
  });
});
