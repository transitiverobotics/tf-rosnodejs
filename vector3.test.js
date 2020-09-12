const assert = require('assert');
const Vector3 = require('./vector3');

describe('test Vector3', function() {

  it('should add', function() {
    const a = {x: Math.random(), y: Math.random(), z: Math.random()};
    const b = {x: Math.random(), y: Math.random(), z: Math.random()};
    const c = (new Vector3(a)).add(new Vector3(b));

    assert(c.x == a.x + b.x);
    assert(c.y == a.y + b.y);
    assert(c.z == a.z + b.z);
  });
});
