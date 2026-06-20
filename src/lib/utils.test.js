import { describe, it, expect } from 'vitest'
import { cn, isIframe } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
  })

  it('handles conditional classes', () => {
    expect(cn('btn', true && 'btn-active', false && 'hidden')).toBe('btn btn-active')
  })

  it('merges tailwind classes correctly', () => {
    // tailwind-merge should resolve conflicts
    expect(cn('px-2 py-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles object inputs', () => {
    expect(cn({ 'bg-red-500': true, 'text-white': true, 'hidden': false })).toBe('bg-red-500 text-white')
  })

  it('handles array inputs', () => {
    expect(cn(['bg-red-500', 'text-white'])).toBe('bg-red-500 text-white')
  })

  it('handles empty or undefined inputs', () => {
    expect(cn()).toBe('')
    expect(cn(undefined, null, false, '')).toBe('')
  })

  it('handles complex nested inputs', () => {
    expect(cn('base', ['nested-1', { 'nested-2': true }], { 'hidden': false })).toBe('base nested-1 nested-2')
  })

  it('merges complex tailwind conflicts', () => {
    expect(cn('grid-cols-1 md:grid-cols-2', 'grid-cols-3')).toBe('md:grid-cols-2 grid-cols-3')
  })
})

describe('isIframe utility', () => {
  it('identifies if running in an iframe', () => {
    expect(typeof isIframe).toBe('boolean')
    // In standard JSDOM test environment, self === top
    expect(isIframe).toBe(false)
  })
})
