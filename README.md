# TF-rosnodejs

ROS TF support for rosnodejs.

## Installation

```
npm install --save tf-rosnodejs
```

## Example

This example shows how to use tf.js to transform a point cloud from one frame,
typically the sensors frame, to another frame, here the map.

```js
const rosnodejs = require('rosnodejs');
const tf = require('tf-rosnodejs');

const MAP_FRAME = 'map';

/** read one point in a point-cloud message */
const readPoint = (fields, buffer, offset) => {
  const rtv = {};
  fields.forEach(field => {
    assert(field.datatype == 7);
    rtv[field.name] = buffer.readFloatLE(offset + field.offset);
  });
  return rtv;
};


rosnodejs.initNode('/test_tf').then((rosNode) => {
  tf.init(rosNode);

  const sub = rosNode.subscribe('/some_point_cloud', 'sensor_msgs/PointCloud2',
  (data) => {    
    const transform = tf.getTF(MAP_FRAME, data.header.frame_id, data.header.stamp);

    for (let offset = 0; offset < data.data.length; offset += data.point_step) {
      const point = readPoint(data.fields, data.data, offset);
      const mapPose = tfs.transform.apply({position: point});

      console.log('point in map frame:', mapPose.position);
    }    
  });
});
```
