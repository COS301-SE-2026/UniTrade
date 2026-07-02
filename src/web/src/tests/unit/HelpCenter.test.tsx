import {render} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {describe, it, vi, beforeEach} from 'vitest'
import HelpCenter from '../../pages/auth/HelpCenter'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    }
})

vi.mock('../../assests/logo.png', () => ({
    default: 'logo.png',
}))

const renderHelpCenter = () => 
render(
    <MemoryRouter>
        <HelpCenter />
    </MemoryRouter>
)

describe('HelpCenter', () => {
    beforeEach(() => {
        mockNavigate.mockClear()
    })

    it('page renders without crashing or lagging ', () => {
        renderHelpCenter()
    })

})