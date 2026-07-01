import { describe, it, expect } from 'vitest'
import { numberToFrenchWords } from '@/lib/number-to-words'

describe('numberToFrenchWords', () => {
  // ─── Edge Cases ──────────────────────────────────────────────────────────────
  it('returns "zéro" for 0', () => {
    expect(numberToFrenchWords(0)).toBe('zéro')
  })

  it('handles negative numbers', () => {
    expect(numberToFrenchWords(-5)).toBe('moins cinq')
    expect(numberToFrenchWords(-1000)).toBe('moins mille')
  })

  // ─── Units ───────────────────────────────────────────────────────────────────
  it('converts single digits correctly', () => {
    expect(numberToFrenchWords(1)).toBe('un')
    expect(numberToFrenchWords(7)).toBe('sept')
    expect(numberToFrenchWords(9)).toBe('neuf')
  })

  // ─── Tens ────────────────────────────────────────────────────────────────────
  it('converts tens correctly', () => {
    expect(numberToFrenchWords(10)).toBe('dix')
    expect(numberToFrenchWords(20)).toBe('vingt')
    expect(numberToFrenchWords(80)).toBe('quatre-vingt')
  })

  it('handles teens correctly', () => {
    expect(numberToFrenchWords(11)).toBe('onze')
    expect(numberToFrenchWords(16)).toBe('seize')
    expect(numberToFrenchWords(19)).toBe('dix-neuf')
  })

  it('handles compound tens correctly', () => {
    expect(numberToFrenchWords(21)).toBe('vingt-et-un')
    expect(numberToFrenchWords(71)).toBe('soixante-et-onze')
    expect(numberToFrenchWords(91)).toBe('quatre-vingt-onze')
  })

  // ─── Hundreds ─────────────────────────────────────────────────────────────────
  it('converts hundreds correctly', () => {
    expect(numberToFrenchWords(100)).toBe('cent')
    expect(numberToFrenchWords(200)).toBe('deux cents')
    expect(numberToFrenchWords(500)).toBe('cinq cents')
  })

  it('converts hundreds with remainder correctly', () => {
    expect(numberToFrenchWords(101)).toBe('cent un')
    expect(numberToFrenchWords(250)).toBe('deux cent cinquante')
    expect(numberToFrenchWords(999)).toBe('neuf cent quatre-vingt-dix-neuf')
  })

  // ─── Thousands ────────────────────────────────────────────────────────────────
  it('converts thousands correctly', () => {
    expect(numberToFrenchWords(1000)).toBe('mille')
    expect(numberToFrenchWords(2000)).toBe('deux mille')
    expect(numberToFrenchWords(10000)).toBe('dix mille')
  })

  it('converts thousands with remainder correctly', () => {
    expect(numberToFrenchWords(1500)).toBe('mille cinq cents')
    expect(numberToFrenchWords(250000)).toBe('deux cent cinquante mille')
  })

  // ─── DZD-specific amounts ─────────────────────────────────────────────────────
  it('handles typical Algerian Dinar amounts', () => {
    // Common cashier amounts in Algeria
    expect(numberToFrenchWords(10000)).toBe('dix mille')
    expect(numberToFrenchWords(100000)).toBe('cent mille')
    expect(numberToFrenchWords(500000)).toBe('cinq cents mille')
    expect(numberToFrenchWords(1000000)).toBe('un million')
    expect(numberToFrenchWords(2500000)).toBe('deux millions cinq cents mille')
  })

  // ─── Millions ────────────────────────────────────────────────────────────────
  it('converts millions correctly', () => {
    expect(numberToFrenchWords(1000000)).toBe('un million')
    expect(numberToFrenchWords(2000000)).toBe('deux millions')
    expect(numberToFrenchWords(5500000)).toBe('cinq millions cinq cents mille')
  })
})
