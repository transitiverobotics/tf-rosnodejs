const rosnodejs = require('rosnodejs');
const tf = require('./tf.js');

const assert = require('assert');

rosnodejs.initNode('/tfjs_test').then(async (rosNode) => {
  tf.init(rosNode);
  setTimeout(() => console.log(JSON.stringify(tf.getForest(), 2, 2)), 500);
  setTimeout(() => console.log(JSON.stringify(tf.getForest(), 2, 2)), 1500);
});

/** this test requires there being a publisher of the map to odom transform */
describe('test TF', function() {
  it('should receive TFs from static', function(done) {
    this.timeout(5000);
    setTimeout(() => {
        const transform = tf.getTF('map','odom');
        assert(transform, 'received static TF');
        done();
      }, 4000);
  });
});
