import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import BusinessList from './BusinessList'

const mockBusiness = [
      {
    id: 1,
    name: 'Emerald Leaf Dispensary',
    address: '4521 Broadway St, Denver, CO 80216',
    phone: '303-555-0142',
    category: 'Dispensary',
    license_number: 'CO-DISP-88231',
    license_status: 'Active',
    stage: 'Customer',
    assigned_rep: null,
    last_activity_at: '2026-08-15T14:30:00.000Z',
    location: '0101000020E6100000C2172653053F5AC040A4DFBE0EE44340',
  },
]

describe("loads a spinner", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    afterEach(() => {
        vi.unstubAllGlobals()
    })
    it ("fetches the loading spinner", () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => mockBusiness,
        })
        vi.stubGlobal("fetch", fetchMock)

        render(<BusinessList/>)
        const spinner = screen.getByRole("status", { name: /Loading Businesses/i })
        expect(screen.getByRole('status')).toBeInTheDocument()
        expect(spinner).toBeInTheDocument()
    })
}) 