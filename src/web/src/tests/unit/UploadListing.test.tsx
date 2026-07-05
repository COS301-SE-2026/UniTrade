import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest';
import UploadListing from '../../pages/seller/UploadListing';
import { listingsService } from '../../services/listingsService'
import '@testing-library/jest-dom';

const { mockCategories } = vi.hoisted(() => ({
  mockCategories: [
    { id: 1, name: 'book' },
    { id: 5, name: 'clothing' },
    { id: 2, name: 'electronics' },
    { id: 4, name: 'furniture' },
    { id: 6, name: 'other' },
    { id: 3, name: 'stationery' },
  ],
}))

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    uploadImages: vi.fn(),
    createListing: vi.fn(),
    getListingsCategories: vi.fn().mockResolvedValue(mockCategories),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const renderUpload = () =>
  render(
    <MemoryRouter>
      <UploadListing />
    </MemoryRouter>
  )

describe('UploadListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listingsService.getListingsCategories).mockResolvedValue(mockCategories)
  })

  it('page shows up without crashing or lagging', () => {
    renderUpload()
  })

  it('shows the Create New Listing heading', () => {
    renderUpload()
    expect(screen.getByText('Create New Listing')).toBeInTheDocument()
  })

  it('shows all 4 step labels', () => {
    renderUpload()
    expect(screen.getByText('Step 1: Basic Information')).toBeInTheDocument()
    expect(screen.getByText('Step 2: Pictures')).toBeInTheDocument()
    expect(screen.getByText('Step 3: Price')).toBeInTheDocument()
    expect(screen.getByText('Step 4: Confirmation')).toBeInTheDocument()
  })

  it('shows the Title input', () => {
    renderUpload()
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument()
  })

  it('shows the Description textarea', () => {
    renderUpload()
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument()
  })

  it('shows the Module / Course Tags dropdown by default (book category)', async () => {
    renderUpload()
    // categories load async and default to the first item ("book"),
    // which is the category that renders the module/course dropdown
    expect(await screen.findByPlaceholderText('Module (e.g. COS110)')).toBeInTheDocument()
  })

  /*it('shows all 6 category buttons once categories load', async () => {
    renderUpload()
    expect(await screen.findByRole('button', { name: /^book$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^clothing$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^electronics$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^furniture$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^other$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^stationery$/i })).toBeInTheDocument()
  })*/

  it('shows all 4 condition buttons', () => {
    renderUpload()
    expect(screen.getByRole('button', { name: /like new/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^good$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^fair$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^worn$/i })).toBeInTheDocument()
  })

  it('shows the Submit Listing and Save Draft buttons', () => {
    renderUpload()
    expect(screen.getByRole('button', { name: /submit listing/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument()
  })

})
