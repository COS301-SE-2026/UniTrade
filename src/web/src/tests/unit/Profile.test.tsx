import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import Profile from '../../pages/auth/Profile'
import { useAuthStore } from '../../store/useAuthStore'
import { authService } from '../../services/authService'

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
    const actual = await vi.importActual('react-router')
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

function mockStore(user: typeof mockUser | null = mockUser) {
    ; (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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

        ;(authService.getMe as ReturnType<typeof vi.fn>).mockRejectedValue({
            user: { email: 'test@example.com'},
            std: {
                university: 'UP',
                degreeProgram: 'BSc',
                yearOfStudy: 2,
                verificationStatus: 'Verified',
            },
        })
    ;(authService.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    ;(authService.deleteAccount as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
    
    })

    it('should render nothing when user is null', () => {
        mockStore(null)
        const { container } = renderProfile()
        expect(container).toBeEmptyDOMElement()
    })

    it('should render user name and initials', async () => {
        renderProfile()
        expect(await screen.getByText(mockUser.name)).toBeInTheDocument()
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

    /*describe('Logout', () => {

        /*it('calls logout and clears user when logout is clicked', async () => {
            const user = userEvent.setup()
                ; (authService.logout as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined)
            renderProfile()
            await user.click(screen.getByText('Logout'))
            expect(authService.logout).toHaveBeenCalledTimes(1)
            expect(mockClearUser).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith('/auth/login')
        })*/

        /*it('still clears user and navigates even if authService.logout fails', async () => {
            const user = userEvent.setup()
                ; (authService.logout as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'))
            renderProfile()

            await user.click(screen.getByText('Logout'))
            //expect(authService.logout).toHaveBeenCalledTimes(1)
            expect(mockClearUser).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith('/auth/login')
        })

    })*/

    describe('Delete Account', () => {
        it('opens the confirm popup when Delete Account is clicked',
            async () => {
                const user = userEvent.setup()
                renderProfile()

                expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument()

                await user.click(screen.getByText('Delete Account'))
                expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
            }
        )

        it('closes the popup when cancel is clicked', async () => {
            const user = userEvent.setup()
            renderProfile()
            await user.click(screen.getByText('Delete Account'))
            await user.click(screen.getByLabelText('Close'))
            expect(screen.queryByText("Are you sure you want to delete your account? This action cannot be undone.")).not.toBeInTheDocument()
        })


        it('clears user and navigates to login when delete is confirmed', async () => {
            const user = userEvent.setup()
            renderProfile()
            await user.click(screen.getByRole('button', { name: 'Delete Account' }))
            await user.click(screen.getByTestId('confirm-delete-button'))
            expect(mockClearUser).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith('/auth/login')
        })
    })

})

