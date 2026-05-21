import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi} from 'vitest';
import Signup from '../../pages/auth/Signup';

//mock useNavigate
const mockPost = vi.fn();
const mockedNavigate = vi.fn();

vi.mock('react-router-dom',async () => {
const actual = await vi.importActual('react-router-dom');
  return{...actual,
    useNavigate: () => mockedNavigate,
        }; 
    });

//mock girl.png
vi.mock('../../assets/girl.png', () => ({default: 'mocked-girl.png'}));

const formFilled = (overrides: Record<string, string> = {}) => {
    const values: Record<string, string> = {
        firstName: 'Langa',
        lastName: 'Vakalisa',
        email: 'langavaks@gmail.com',
        university: 'UP',
        degreeProgram: 'Computer Science',
        yearOfStudy: '3',
        password: 'Password@100',
    };

    for (const key in overrides) {
        values[key] = overrides[key];
    }
fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: values.firstName ,name: 'firstName' } });
fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: values.lastName ,name: 'lastName' } });
fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: values.email ,name: 'email' } });
fireEvent.change(screen.getByDisplayValue('Select University'), {target:{value: values.university, name: 'university'}});
fireEvent.change(screen.getByPlaceholderText('Degree Program'), { target: { value: values.degreeProgram ,name: 'degreeProgram' } });
fireEvent.change(screen.getByPlaceholderText('Year of Study'), { target: { value: values.yearOfStudy ,name: 'yearOfStudy' } });

fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: values.password ,name: 'password' } });
};


describe('Login Component', () => {

beforeEach(() => {
    mockPost.mockReset();
    mockedNavigate.mockReset();
    //vi.clearAllMocks();
    localStorage.clear();
  (window as unknown as { API: {post: typeof mockPost}}).API = { post: mockPost };
});





test( 'should render form fields and Signup button', () => {
    render(<Signup />);

    expect(screen.getByText('Get Started')).toBeInTheDocument();
   // expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument();
     expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Select University')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Degree Program')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Year of Study')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /signup/i })).toBeInTheDocument();
});


test('should update fields when typing', () => {
    render(<Signup />);
    formFilled();

   expect(screen.getByPlaceholderText('First Name')).toHaveValue('Langa');
    expect(screen.getByPlaceholderText('Last Name')).toHaveValue('Vakalisa');
    expect(screen.getByPlaceholderText('Email')).toHaveValue('langavaks@gmail.com');
    expect(screen.getByDisplayValue('University of Pretoria')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Degree Program')).toHaveValue('Computer Science');
    expect(screen.getByPlaceholderText('Year of Study')).toHaveValue('3');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('Password@100');


});

test('should navigate to dashboard after successful signup', async () => {

mockPost.mockResolvedValueOnce({data: {token: 'fake-jwt-token'}});

render(<Signup />);
formFilled();

fireEvent.click(screen.getByRole('button', {name:/signup/i}));
await waitFor(() => {

expect(mockPost).toBeCalledWith('/auth/Signup' ,
   {
    firstName: 'Langa',
        lastName: 'Vakalisa',
        email: 'langavaks@gmail.com',
        university: 'UP',
        degreeProgram: 'Computer Science',
        yearOfStudy: '3',
        password: 'Password@100',
    });

expect(mockedNavigate).toHaveBeenCalledWith('/buyer/dashboard');
});
});

test('should show error messages on failed signup', async () => {
mockPost.mockRejectedValueOnce(new Error('Server error'));
render(<Signup />);
formFilled();
fireEvent.click(screen.getByRole('button', {name:
    /signup/i
}));

await waitFor(() =>{
expect(screen.getByText('Signup failed. Please check your details and try again.')).toBeInTheDocument();
})
});
});
