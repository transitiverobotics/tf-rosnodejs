/** a simple 3d vector */
class Vector3 {

  constructor(xyz) {
    Object.assign(this, xyz);
  }

  /** cunstrucot from flat array (length 3) */
  static fromArray(a) {
    return new Vector3({x: a[0], y: a[1], z: a[2]});
  }

  /** add another vector, or another {x,y,z} , either works*/
  add(xyz) {
    return new Vector3({
      x: this.x + xyz.x,
      y: this.y + xyz.y,
      z: this.z + xyz.z,
    });
  }

  /** multiply by a scalar */
  multiply(scalar) {
    return new Vector3({
      x: this.x * scalar,
      y: this.y * scalar,
      z: this.z * scalar,
    });
  }

  /** get as a flat array (length 3) */
  asArray() {
    return [this.x, this.y, this.z];
  }
}

module.exports = Vector3;
