
const Vector3 = require('./vector3');
const Quaternion = require('quaternion');

const quaternion2theta = (q) => {
  const siny_cosp = 2.0 * (q.w * q.z + q.x * q.y);
  const cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z);
  // return -180 * (Math.atan2(siny_cosp, cosy_cosp) / Math.PI);
  return -Math.atan2(siny_cosp, cosy_cosp);
};

/** A transform */
class Transform {

  constructor(tf) {
    this.translation = new Vector3(tf.translation);
    this.rotation = (new Quaternion(tf.rotation)).normalize();
  }

  getTranslation() {
    return this.translation;
  }

  /** Get the corresponding pose on a 2D map: {x, y, theta} */
  get2DPose() {
    return {
      x: this.translation.x,
      y: this.translation.y,
      theta: quaternion2theta(this.rotation)
    }
  }

  /** Get the inverse of this transform.
    Corresponds to Transform.h's inverse function:
     Matrix3x3 inv = m_basis.transpose();
     return Transform(inv, inv * -m_origin);
  */
  getInverse() {
    const rot = this.rotation.inverse();
    const neg = this.translation.multiply(-1)
    const trans = rot.rotateVector(neg.asArray());

    return new Transform({
      translation: {x: trans[0], y: trans[1], z: trans[2]},
      rotation: this.rotation.inverse()
    });
  }

  /** Apply this transform to the given pose ({position, orientation}).

  Does the same as operator() in Transform.h of tf2:

  return Vector3(m_basis[0].dot(x) + m_origin.x(),
    m_basis[1].dot(x) + m_origin.y(),
    m_basis[2].dot(x) + m_origin.z());

  Here m_basis the 3x3 rotation matrix, and m_basis[i] is the i'th row of it.
  */
  apply(pose) {
    const position = (Vector3.fromArray(this.rotation.rotateVector([
        pose.position.x, pose.position.y, pose.position.z ])))
        .add(this.translation);

    const orientation = pose.orientation ?
      new Quaternion(pose.orientation).mul(this.rotation).normalize()
      : new Quaternion(1,0,0,0);

    return {position, orientation};
  }

  /** Multiply transform with another one to get the combined transform.
    Corresponds to Transform.h's mult function except that we return the result:
    m_basis = t1.m_basis * t2.m_basis;
    m_origin = t1(t2.m_origin);
  */
  multiply(transform) {
    const rotation = this.rotation.mul(transform.rotation);
    const trans = this.apply({position: transform.getTranslation()});

    return new Transform({
      translation: trans.position,
      rotation
    });
  }
}


module.exports = Transform;
