import {render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import Profile from '../../pages/auth/Profile'
import {useAuthStore } from '../../store/useAuthStore'
import {authService} from '../../services/authService'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
  }
})

vi.mock('../../store/useAuthStore')
vi.mock('../../services/authService')

const mockUser = {
    id: '1',
    name: 'Langa',
    initials: 'LV',
    role: 'student' as const,
}
const mockClearUser = vi.fn()

function mockStore(user: typeof mockUser | null=mockUser) {
    ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user,
        clearUser: mockClearUser,
    })      
}

const renderProfile = () => {
    return render(
        <MemoryRouter>
            <Profile />
        </MemoryRouter>
    )
}

describe('Profile', () => {
     beforeEach(() => {
        mockNavigate.mockClear()
        mockClearUser.mockClear()
        vi.clearAllMocks()
        mockStore()
    })

     it('should render nothing when user is null', () => {
        mockStore(null)
        const { container } = renderProfile()
        expect(container).toBeEmptyDOMElement()
    })

  
    


    /*describe('Logout', () => {


    })

    describe('Delete Account', () => {
       
    })*/
        
})