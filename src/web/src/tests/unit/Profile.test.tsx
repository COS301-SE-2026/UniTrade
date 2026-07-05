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

     it('should render user name and initials', () => {
        renderProfile()
        expect(screen.getByText(mockUser.name)).toBeInTheDocument()
        expect(screen.getByText(mockUser.initials)).toBeInTheDocument()
    })

        it('navigates to profile settings through settings icon', async () => {
        const user = userEvent.setup()
        renderProfile()
        await user.click(screen.getByLabelText('Settings'))
        expect(mockNavigate).toHaveBeenCalledWith('/profile/settings')
    })

     it('navigates to activity through view activity tab', async () => {
        const user = userEvent.setup()
        renderProfile()
        await user.click(screen.getByText('View Activity History'))
        expect(mockNavigate).toHaveBeenCalledWith('/activity')
    })

   it('navigates to privacy and security', async () => {
        const user = userEvent.setup()
        renderProfile()
        await user.click(screen.getByText('Privacy & Security'))
        expect(mockNavigate).toHaveBeenCalledWith('/profile/privacy')
    })

    describe('Logout', () => {

    
        it('calls logout and clears user when logout is clicked', async () => {
            const user = userEvent.setup()
            ;(authService.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined)
            renderProfile()
            await user.click(screen.getByText('Logout'))

    })
})

   /* describe('Delete Account', () => {
       
    })*/
        
})