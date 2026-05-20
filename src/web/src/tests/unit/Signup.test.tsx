import React from 'react';
import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi,it} from 'vitest';
import Login from '../../pages/auth/Signup';

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
        degree: 'Computer Science',
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
fireEvent.change(screen.getByPlaceholderText('YearOfStudy'), { target: { value: values.yearOfStudy ,name: 'yearOfStudy' } });

fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: values.password ,name: 'password' } });
};


describe('Login Component', () => {

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  (window as any).API = { post: mockPost };
});





test( 'should render form fields and Signup button', () => {
    render(<Login />);

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


});

