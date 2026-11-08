import * as THREE from 'three'

const mu = THREE.MathUtils

export class SplitSampler {
  constructor(chamfer, roundness, splitPoint, splitWidth = 0.09875) {
    this.splitPoint = splitPoint
    this.splitWidth = splitWidth

    this.axisX = new THREE.Vector3(1, 0, 0)
    this.axisY = new THREE.Vector3(0, 1, 0)

    const shift = 1 - chamfer * 3 - roundness
    const quart = Math.PI * 0.5
    const add = 0.5
    this.add = add
    this.path = new THREE.Path()
      .absarc( shift,  shift, roundness + add, quart * 0, quart * 1)
      .absarc(-shift,  shift, roundness + add, quart * 1, quart * 2)
      .absarc(-shift, -shift, roundness + add, quart * 2, quart * 3)
      .absarc( shift, -shift, roundness + add, quart * 3, quart * 4)
    this.path.closePath()
  }

  sample(v = new THREE.Vector3(), n = new THREE.Vector3()) {
    const quart = Math.PI * 0.5
    const randVal = Math.random()
    const randFwd = (randVal + 0.001) % 1

    this.path.getPointAt(randVal, v)
    this.path.getPointAt(randFwd, n)
    const diffX = n.x - v.x
    const diffY = n.y - v.y
    n.set(diffY, -diffX, 0).normalize()

    v.addScaledVector(n, -this.add)

    n.x += mu.randFloatSpread(0.1)
    n.y += mu.randFloatSpread(0.1)
    n.z += mu.randFloatSpread(0.1)
    n.normalize()

    v.z = (Math.random() - 0.5) * 2 * this.splitWidth
    const plane = mu.randInt(0, 2)

    if (plane === 0) {
      v.z += this.splitPoint.z
    } else if (plane === 1) {
      v.applyAxisAngle(this.axisX, quart)
      v.y += this.splitPoint.y
      n.applyAxisAngle(this.axisX, quart)
    } else if (plane === 2) {
      v.applyAxisAngle(this.axisY, -quart)
      v.x += this.splitPoint.x
      n.applyAxisAngle(this.axisY, -quart)
    }
    return [v, n]
  }
}
