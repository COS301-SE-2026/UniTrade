import {render,screen,fireEvent} from '@testing-library/react';
import {test,expect} from 'vitest';
import UploadListing from '../../pages/seller/UploadListing';
import '@testing-library/jest-dom';

const fillForm=() =>
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







