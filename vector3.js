/** a simple 3d vector */
class Vector3 {

  constructor(xyz) {
    this.xyz = xyz;
  }

  /** cunstrucot from flat array (length 3) */
  static fromArray(a) {
    return new Vector3({x: a[0], y: a[1], z: a[2]});
  }

  get x() { return this.xyz.x; }
  get y() { return this.xyz.y; }
  get z() { return this.xyz.z; }

  /** add another vector, or another {x,y,z} , either works*/
  add(xyz) {
    return new Vector3({
      x: this.xyz.x + xyz.x,
      y: this.xyz.y + xyz.y,
      z: this.xyz.z + xyz.z,
    });
  }

  /** multiply by a scalar */
  multiply(scalar) {
    return new Vector3({
      x: this.xyz.x * scalar,
      y: this.xyz.y * scalar,
      z: this.xyz.z * scalar,
    });
  }

  /** get as a flat array (length 3) */
  asArray() {
    return [this.xyz.x, this.xyz.y, this.xyz.z];
  }
}

module.exports = Vector3;
