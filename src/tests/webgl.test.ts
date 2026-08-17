import { describe, expect, it } from 'vitest'
import { isWebGLAvailable, probeWebGL } from '../utils/webgl'
import { enableFakeWebGL } from './setup'

describe('probeWebGL', () => {
  it('conclut à l’absence de WebGL quand aucun contexte n’est fourni', () => {
    const report = probeWebGL()
    expect(report.available).toBe(false)
    expect(report.version).toBe(0)
    expect(report.reason).toBe('context-creation-failed')
    expect(isWebGLAvailable()).toBe(false)
  })

  it('détecte WebGL2 quand le contexte est disponible', () => {
    enableFakeWebGL()
    const report = probeWebGL()
    expect(report.available).toBe(true)
    expect(report.version).toBe(2)
  })

  it('ne propage jamais d’exception levée par le navigateur', () => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = () => {
      throw new Error('Not implemented')
    }

    try {
      const report = probeWebGL()
      expect(report.available).toBe(false)
      expect(report.reason).toBe('Not implemented')
    } finally {
      HTMLCanvasElement.prototype.getContext = original
    }
  })
})
