import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../../store/useThemeStore'
import { act } from '@testing-library/react'

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ isDark: false })
    document.documentElement.classList.remove('dark')
  })

  it('should start with light mode', () => {
    expect(useThemeStore.getState().isDark).toBe(false)
  })

  it('should toggle to dark mode', () => {
    act(() => {
      useThemeStore.getState().toggle()
    })
    expect(useThemeStore.getState().isDark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should toggle back to light mode', () => {
    act(() => {
      useThemeStore.getState().toggle()
      useThemeStore.getState().toggle()
    })
    expect(useThemeStore.getState().isDark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})