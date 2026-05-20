import {render,screen,fireEvent} from '@testing-library/react';
import {describe,test,expect,beforeEach,vi} from 'vitest';
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








