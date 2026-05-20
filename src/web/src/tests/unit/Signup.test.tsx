import React from 'react';
import {render, screen,fireEvent, waitFor} from '@testing-library/react'
import {describe,test,expect, beforeEach, vi,it} from 'vitest';
import Login from '../../pages/auth/Signup';

//mock useNavigate
const mockPost = vi.fn();
const mockedNavigate = vi.fn();

