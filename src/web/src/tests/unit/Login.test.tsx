import React from 'react';
import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi,it} from 'vitest';
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
  (window as any).API = { post: mockPost };
});


test( 'should render the login form and buttons', () => {
    render(<Login />);

    expect(screen.getByText('Welcome Back!')).toBeInTheDocument();
    expect(screen.getByText('Enter your credentials to access your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
}); 


});;
