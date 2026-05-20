import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi} from 'vitest';
import Login from '../../pages/auth/Login';
import { authService } from '../../services/authService';


vi.mock('../../services/authService' ,() =>({
    authService: { login: vi.fn(),
      getMe: vi.fn()
    },
}))

vi.mock('../../store/useAuthStore' ,() =>({
    useAuthStore: ()=> ({ setUser: vi.fn()}),
}))

const mockedNavigate = vi.fn()
vi.mock('react-router-dom',async () => {
const actual = await vi.importActual('react-router-dom');
  return{...actual,
    useNavigate: () => mockedNavigate,
        }; 
    });

//mock girl.png
vi.mock('../../assets/girl.png', () => ({default: 'mocked-girl.png'}))

describe('Login Component', () => {

beforeEach(() => {
    mockedNavigate.mockReset()
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.getMe).mockReset()
});


test( 'should render the login form and buttons', () => {
    render(<Login />);

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
});

test(' should handle successful login and navigate to dashboard', async () => {
   vi.mocked(authService.login).mockResolvedValueOnce(undefined)
    vi.mocked(authService.getMe).mockResolvedValueOnce({
      userId :'1',
      firstName: 'Langa',
      lastName: 'Vakalisa',
      email: 'langavaks@gmail.com',
      role: 'buyer',
      university:'UP'
    })
  
render(<Login />)

fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com',name: 'email' } });
fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password100',name: 'password' } });
fireEvent.click(screen.getByRole('button',{name:/login/i}))

await waitFor(() => {
expect(authService.login).toHaveBeenCalledWith({

  Email:'langavaks@gmail.com',
  Password: 'password100',
})

expect(mockedNavigate).toHaveBeenCalledWith('/buyer/dashboard')
})
})

test('should handle failed login and display error message', async () => {
 vi.mocked(authService.login).mockRejectedValueOnce(new Error('Server Error'))

render(<Login />);


fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'langavaks@gmail.com',name: 'email' } });
fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'notpassword',name: 'password' } });
fireEvent.click(screen.getByRole('button',{name:/login/i}))

await waitFor(() => {

expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()


})
})

})
