import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusPill from '../../components/layout/ui/StatusPill'

describe('StatusPill', () => {
  it('renders Live correctly', () => {
    render(<StatusPill status="live" />)
    const pill = screen.getByText('Live')
    expect(pill).toBeInTheDocument()
    expect(pill.className).toContain('bg-green-100')
    expect(pill.className).toContain('text-green-700')
  })

  it('renders Pending Review correctly', () => {
    render(<StatusPill status="pending" />)
    const pill = screen.getByText('Pending Review')
    expect(pill).toBeInTheDocument()
    expect(pill.className).toContain('bg-amber-100')
    expect(pill.className).toContain('text-amber-700')
  })

  it('renders Draft correctly', () => {
    render(<StatusPill status="draft" />)
    const pill = screen.getByText('Draft')
    expect(pill).toBeInTheDocument()
    expect(pill.className).toContain('bg-[#e0f7fa]')
  })

  it('renders Rejected correctly', () => {
    render(<StatusPill status="rejected" />)
    const pill = screen.getByText('Rejected')
    expect(pill).toBeInTheDocument()
    expect(pill.className).toContain('bg-red-100')
    expect(pill.className).toContain('text-red-400')
  })
})