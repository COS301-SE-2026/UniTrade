import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi} from 'vitest';
import Login from '../../pages/auth/Login';

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

describe('Login Component', () => {

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  (window as unknown as { API: {post: typeof mockPost}}).API = { post: mockPost };
});


test( 'should render the login form and buttons', () => {
    render(<Login />);

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test(' should handle successful login and navigate to dashboard', async () => {

mockPost.mockResolvedValue({ data: { token: 'fake-jwt-token' },});

render(<Login />);

const loginButton = screen.getByRole('button', { name: /login/i });

fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com',name: 'email' } });
fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password100',name: 'password' } });
fireEvent.click(loginButton);

expect(mockPost).toHaveBeenCalledWith('/auth/Login', { email: 'langavaks@gmail.com', password: 'password100' });

await waitFor(() => {
expect(mockedNavigate).toHaveBeenCalledWith('/buyer/dashboard');
});
});

test('should handle failed login and display error message', async () => {

mockPost.mockRejectedValueOnce(new Error('Invalid credentials'));

render(<Login />);

const loginButton = screen.getByRole('button', { name: /login/i });

fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com',name: 'email' } });
fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'notpassword',name: 'password' } });
fireEvent.click(loginButton);

await waitFor(() => {

expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();


});
});

});
