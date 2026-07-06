import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest';
import UploadListing from '../../pages/seller/UploadListing';
import { listingsService } from '../../services/listingsService'
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from "@testing-library/react";
import type { Course } from '../../types/listing';


vi.mock('../../services/listingsService', () => ({
  listingsService: {
    uploadImages: vi.fn(),
    createListing: vi.fn(),
    getListingsCategories: vi.fn().mockResolvedValue(mockCategories),
    searchCourses: vi.fn().mockResolvedValue(mockCourses),
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


const { mockCategories, mockCourses } = vi.hoisted(() => ({
  mockCategories: [
    { id: 1, name: 'book' },
    { id: 5, name: 'clothing' },
    { id: 2, name: 'electronics' },
    { id: 4, name: 'furniture' },
    { id: 6, name: 'other' },
    { id: 3, name: 'stationery' },
  ],
  mockCourses: [
    { courseId: 101, courseCode: 'COS301', courseName: 'Software Engineering', faculty: 'COS' },
    { courseId: 102, courseCode: 'COS314', courseName: 'Artificial Intelligence', faculty: 'COS' },
  ],
}))


const makeFile = (name: string, sizeInMb: number, type = 'image/png') => {
  const file = new File(['a'], name, { type })
  Object.defineProperty(file, 'size', { value: sizeInMb * 1024 * 1024 })
  return file
}


describe('UploadListing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listingsService.getListingsCategories).mockResolvedValue(mockCategories)
    vi.mocked(listingsService.searchCourses).mockResolvedValue(mockCourses)
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
    expect(await screen.findByPlaceholderText('Module (e.g. COS110)')).toBeInTheDocument()
  })

  it('shows all 6 category buttons once categories load', async () => {
    renderUpload()
    await screen.findByText('book')
    
    expect(await screen.findByRole('button', { name: /^book$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^clothing$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^electronics$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^furniture$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^other$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^stationery$/i })).toBeInTheDocument()
  })

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

  
  it('shows an error if categories fail to load', async () => {
    vi.mocked(listingsService.getListingsCategories).mockRejectedValueOnce(new Error('network error'))
    renderUpload()
    expect(await screen.findByText('Failed to load categories')).toBeInTheDocument()
  })

 
  it('switches to electronics and shows Brand / Model field', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.click(await screen.findByRole('button', { name: /^electronics$/i }))
    expect(screen.getByPlaceholderText('Brand / Model')).toBeInTheDocument()
  })

  it('switches to furniture and shows Dimensions field', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.click(await screen.findByRole('button', { name: /^furniture$/i }))
    expect(screen.getByPlaceholderText('Dimensions')).toBeInTheDocument()
  })

  it('switches to other and hides extra fields', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.click(await screen.findByRole('button', { name: /^other$/i }))
    expect(screen.queryByPlaceholderText('Module (e.g. COS110)')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Brand / Model')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Dimensions')).not.toBeInTheDocument()
  })


  it('shows "Pick a module from the list" when no course matches', async () => {
    const user = userEvent.setup()
    renderUpload()
    const courseInput = await screen.findByPlaceholderText('Module (e.g. COS110)')
    await user.type(courseInput, 'CO')
    await waitFor(() => {
      expect(listingsService.searchCourses).toHaveBeenCalledWith('CO')
    })
    expect(await screen.findByText('Pick a module from the list')).toBeInTheDocument()
  })

  it('shows "Module selected" when the typed code matches a course exactly', async () => {
    const user = userEvent.setup()
    renderUpload()
    const courseInput = await screen.findByPlaceholderText('Module (e.g. COS110)')
    await user.type(courseInput, 'COS301')
    await waitFor(() => {
      expect(listingsService.searchCourses).toHaveBeenCalledWith('COS301')
    })
    expect(await screen.findByText('Module selected')).toBeInTheDocument()
  })

  it('shows "Searching..." while a course search is in flight', async () => {
    let resolveSearch: (value: Course[] | PromiseLike<Course[]>) => void = () => {};
    vi.mocked(listingsService.searchCourses).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSearch = resolve })
    )
    const user = userEvent.setup()
    renderUpload()
    const courseInput = await screen.findByPlaceholderText('Module (e.g. COS110)')
    await user.type(courseInput, 'CO')
    expect(await screen.findByText('Searching...')).toBeInTheDocument()
    resolveSearch([])
  })

  it('does not call searchCourses for queries shorter than 2 characters', async () => {
    const user = userEvent.setup()
    renderUpload()
    const courseInput = await screen.findByPlaceholderText('Module (e.g. COS110)')
    await user.type(courseInput, 'C')
    await new Promise((r) => setTimeout(r, 350))
    expect(listingsService.searchCourses).not.toHaveBeenCalled()
  })

  it('rejects oversized files and shows an error', async () => {
    const user = userEvent.setup()
    renderUpload()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('big.png', 15))
    expect(await screen.findByText(/exceed the 10MB limit/i)).toBeInTheDocument()
  })

  it('accepts valid files, shows previews, and allows removing a file', async () => {
    const user = userEvent.setup()
    renderUpload()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, [makeFile('a.png', 1), makeFile('b.png', 1)])

    expect(await screen.findByText(/2\/4 photos/)).toBeInTheDocument()

    const removeButtons = screen.getAllByRole('button').filter((btn) =>
      btn.className.includes('bg-red-500')
    )
    await user.click(removeButtons[0])
    expect(await screen.findByText(/1\/4 photos/)).toBeInTheDocument()
  })

  it('caps uploaded files at 4', async () => {
    const user = userEvent.setup()
    renderUpload()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const files = [1, 2, 3, 4, 5].map((n) => makeFile(`f${n}.png`, 1))
    await user.upload(fileInput, files)
    expect(await screen.findByText(/4\/4 photos/)).toBeInTheDocument()
  })

  it('shows an amber warning label when total upload size exceeds 35MB', async () => {
    const user = userEvent.setup()
    renderUpload()
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const files = [1, 2, 3, 4].map((n) => makeFile(`big${n}.png`, 9)) // 36MB total
    await user.upload(fileInput, files)
    const sizeLabel = await screen.findByText(/36\.0 MB used/)
    expect(sizeLabel).toHaveClass('text-amber-500')
  })

  it('shows "Untitled Listing" in the summary by default', () => {
    renderUpload()
    expect(screen.getByText('Untitled Listing')).toBeInTheDocument()
  })

  it('updates price, condition, and title, reflected in the summary', async () => {
    const user = userEvent.setup()
    renderUpload()
    const priceInput = screen.getByRole('spinbutton')
    await user.type(priceInput, '250')
    await user.click(screen.getByRole('button', { name: /^fair$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Calculus Textbook')

    expect(await screen.findByText('Calculus Textbook')).toBeInTheDocument()
    expect(screen.getByText(/R250/)).toBeInTheDocument()
    // "Fair" also appears on the condition button itself, so scope this
    // assertion to the summary paragraph specifically.
    expect(
      screen.getByText(
        (content, element) =>
          element?.tagName.toLowerCase() === 'p' && /Fair/.test(content)
      )
    ).toBeInTheDocument()
  })

  it('shows a validation error when submitting with missing fields', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.click(screen.getByRole('button', { name: /submit listing/i }))
    expect(await screen.findByText(/please fill in all fields/i)).toBeInTheDocument()
    expect(listingsService.createListing).not.toHaveBeenCalled()
  })

  it('shows a validation error when a book listing has an unmatched module query', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.type(screen.getByPlaceholderText('Title'), 'Textbook')
    await user.type(screen.getByPlaceholderText('Description'), 'A good book')
    await user.type(screen.getByRole('spinbutton'), '100')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('a.png', 1))

    const courseInput = await screen.findByPlaceholderText('Module (e.g. COS110)')
    await user.type(courseInput, 'ZZ999')

    await user.click(screen.getByRole('button', { name: /submit listing/i }))

    expect(
      await screen.findByText('Please pick a module from the list')
    ).toBeInTheDocument()
    expect(listingsService.createListing).not.toHaveBeenCalled()
  })

  it('submits successfully and navigates to seller listings', async () => {
    vi.mocked(listingsService.createListing).mockResolvedValueOnce('42')
    vi.mocked(listingsService.uploadImages).mockResolvedValueOnce([])
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Pens')
    await user.type(screen.getByPlaceholderText('Description'), 'Box of pens')
    await user.type(screen.getByRole('spinbutton'), '50')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('a.png', 1))

    await user.click(screen.getByRole('button', { name: /submit listing/i }))

    await waitFor(() => {
      expect(listingsService.createListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pens',
          description: 'Box of pens',
          price: 50,
          categoryName: 'stationery',
          listingStatus: 'live',
        })
      )
    })
    
    expect(listingsService.uploadImages).toHaveBeenCalledWith('42', [expect.any(File)])
    expect(mockNavigate).toHaveBeenCalledWith('/seller/listings')
  })

  it('shows the server error message when submit fails', async () => {
    vi.mocked(listingsService.createListing).mockRejectedValueOnce({ message: 'Server exploded' })
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Pens')
    await user.type(screen.getByPlaceholderText('Description'), 'Box of pens')
    await user.type(screen.getByRole('spinbutton'), '50')
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('a.png', 1))

    await user.click(screen.getByRole('button', { name: /submit listing/i }))
    expect(await screen.findByText('Server exploded')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows a fallback error message when submit fails without a message', async () => {
    vi.mocked(listingsService.createListing).mockRejectedValueOnce({})
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Pens')
    await user.type(screen.getByPlaceholderText('Description'), 'Box of pens')
    await user.type(screen.getByRole('spinbutton'), '50')
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('a.png', 1))

    await user.click(screen.getByRole('button', { name: /submit listing/i }))
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
  })

  it('shows a validation error when saving draft without a title', async () => {
    const user = userEvent.setup()
    renderUpload()
    await user.click(screen.getByRole('button', { name: /save draft/i }))
    expect(await screen.findByText(/add a title before saving as draft/i)).toBeInTheDocument()
    expect(listingsService.createListing).not.toHaveBeenCalled()
  })

  it('saves a draft successfully without images and skips uploadImages', async () => {
    vi.mocked(listingsService.createListing).mockResolvedValueOnce('7')
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Draft item')

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
      expect(listingsService.createListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Draft item',
          price: 0,
          listingStatus: 'draft',
        })
      )
    })
    expect(listingsService.uploadImages).not.toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/seller/listings')
  })

  it('saves a draft with images and calls uploadImages', async () => {
    vi.mocked(listingsService.createListing).mockResolvedValueOnce('8')
    vi.mocked(listingsService.uploadImages).mockResolvedValueOnce([])
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Draft item 2')

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(fileInput, makeFile('a.png', 1))

    await user.click(screen.getByRole('button', { name: /save draft/i }))

    await waitFor(() => {
     
      expect(listingsService.uploadImages).toHaveBeenCalledWith('8', [expect.any(File)])
    })
    expect(mockNavigate).toHaveBeenCalledWith('/seller/listings')
  })

  it('shows an error message when saving draft fails', async () => {
    vi.mocked(listingsService.createListing).mockRejectedValueOnce({ message: 'Draft failed' })
    const user = userEvent.setup()
    renderUpload()

    await user.click(await screen.findByRole('button', { name: /^stationery$/i }))
    await user.type(screen.getByPlaceholderText('Title'), 'Draft item 3')

    await user.click(screen.getByRole('button', { name: /save draft/i }))
    expect(await screen.findByText('Draft failed')).toBeInTheDocument()
  })
})