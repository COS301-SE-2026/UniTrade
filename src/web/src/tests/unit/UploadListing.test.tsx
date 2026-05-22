import {render,screen} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'
import {describe,expect,it, vi, beforeEach} from 'vitest';
import UploadListing from '../../pages/seller/UploadListing';
import { listingsService } from '../../services/listingsService'
import '@testing-library/jest-dom';

vi.mock('../../services/listingsService', () => ({
  listingsService: {
    uploadImages: vi.fn(),
    createListing: vi.fn(),
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

  it('shows the Module / Course Tags dropdown by default (Textbook category)', () => {
    renderUpload()
    expect(screen.getByDisplayValue('Module / Course Tags')).toBeInTheDocument()
  })

  it('shows all 4 category buttons', () => {
    renderUpload()
    expect(screen.getByRole('button', { name: /textbook/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /electronics/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /furniture/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /other/i })).toBeInTheDocument()
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

})

/*const fillForm=() =>
{
fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Calculus Early Transcendentals' } });
fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'Good condition, Minor scratches' } });
};

test('should render form with all the steps', () =>
{ render(<UploadListing />);

expect(screen.getByText('Step 1: Basic Information')).toBeInTheDocument();
expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
expect(screen.getByDisplayValue('Module / Course Tags')).toBeInTheDocument();
});

test('should show correct conditions and dropdown inputs' ,() =>{

render(<UploadListing />);
const electronicsTab = screen.getByRole('button', {name:
    /electronics/i });
    fireEvent.click(electronicsTab);
    expect(screen.getByPlaceholderText('Brand / Model')).toBeInTheDocument();

    const furnitureTab = screen.getByRole('button', {name:
    /furniture/i });
    fireEvent.click(furnitureTab);
    expect(screen.getByPlaceholderText('Dimensions')).toBeInTheDocument();

});

test('should update condition pills on selection tap', ()  =>
{
    render(<UploadListing />);
    const likeNewPill = screen.getByRole('button', {name: /like new/i});
    fireEvent.click(likeNewPill);
    expect(likeNewPill).toHaveClass('bg-[#0F2D5E]');
    
});

test('should update input when typing', () => {
    render(<UploadListing />);
    fillForm();

    expect(screen.getByPlaceholderText('Title')).toHaveValue('Calculus Early Transcendentals');
    expect(screen.getByPlaceholderText('Description')).toHaveValue('Good condition, Minor scratches');


});
*/






