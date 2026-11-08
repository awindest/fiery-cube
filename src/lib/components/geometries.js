import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js'

export function setColor(g, color) {
  const c = color.isColor ? color : new THREE.Color(color)
  g.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      Array.from({ length: g.attributes.position.count }, () => [...c]).flat(),
      3
    )
  )
}

export class EighthGeometry extends THREE.BufferGeometry {
  constructor(aX = 0, aY = 0, aZ = 0, chamfer = 0.05) {
    super()
    const c = 1 - chamfer * 2
    const basePoints = [
      [0,0,0],[1,0,0],[0,1,0],[0,0,1],
      [1,c,0],[c,1,0],[0,c,1],[0,1,c],
      [1,0,c],[c,0,1],[1,c,c],[c,1,c],[c,c,1]
    ].map(p => new THREE.Vector3(...p))

    const baseMoves = [
      [1,1,1],[0,1,1],[1,0,1],[1,1,0],
      [0,0,1],[0,0,1],[1,0,0],[1,0,0],
      [0,1,0],[0,1,0],[0,0,0],[0,0,0],[0,0,0]
    ].flat()

    const g = new THREE.BufferGeometry().setFromPoints(basePoints)
    g.setAttribute('moves', new THREE.Float32BufferAttribute(baseMoves, 3))
    g.setIndex([
      0,4,1, 0,2,5, 0,5,4,
      0,7,2, 0,3,6, 0,6,7,
      0,1,8, 0,9,3, 0,8,9,
      6,3,9, 6,9,12,
      8,1,4, 8,4,10,
      5,2,7, 5,7,11,
      4,5,11, 4,11,10,
      7,6,12, 7,12,11,
      9,8,10, 9,10,12,
      10,11,12
    ])

    const hPI = Math.PI * 0.5
    const angleX = hPI * aX
    const angleY = hPI * aY
    const angleZ = hPI * aZ

    g.rotateX(angleX)
    g.rotateY(angleY)
    g.rotateZ(angleZ)

    const m1 = new THREE.Matrix4()
    const rotateMoves = (axis, angle) => {
      m1['makeRotation' + axis](angle)
      g.attributes.moves.applyMatrix4(m1)
    }
    rotateMoves('X', angleX)
    rotateMoves('Y', angleY)
    rotateMoves('Z', angleZ)

    const finalG = g.toNonIndexed()
    finalG.computeVertexNormals()
    this.copy(finalG)
  }
}

export class BoxyGeometry extends THREE.BufferGeometry {
  constructor(chamfer = 0.05, roundness = 0.1) {
    super()

    const setID = (g, gID) => {
      g.setAttribute(
        'geometryID',
        new THREE.Float32BufferAttribute(
          Array.from({ length: g.attributes.position.count }, () => gID).flat(),
          1
        )
      )
    }

    const gs = [
      new EighthGeometry(0,0,0), new EighthGeometry(0,1,0),
      new EighthGeometry(0,2,0), new EighthGeometry(0,3,0),
      new EighthGeometry(1,0,0), new EighthGeometry(1,1,0),
      new EighthGeometry(1,2,0), new EighthGeometry(1,3,0)
    ]
    gs.forEach((g, gID) => {
      setColor(g, '#111')
      setID(g, gID)
    })

    const innerSize = 2 - chamfer * 6
    const gInnerBox = new RoundedBoxGeometry(innerSize, innerSize, innerSize, 1, roundness)
    gInnerBox.setAttribute(
      'moves',
      new THREE.Float32BufferAttribute(new Array(gInnerBox.attributes.position.count * 3).fill(0), 3)
    )
    gInnerBox.deleteAttribute('uv')
    setColor(gInnerBox, '#fca')
    setID(gInnerBox, 8)
    gs.push(gInnerBox)

    this.copy(BGU.mergeGeometries(gs))
  }
}
