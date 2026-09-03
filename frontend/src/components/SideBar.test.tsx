import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SideBar from './SideBar'

describe('SideBar', () => {
    it('renders the CATEGORY inside sidebar', () => {
        render(<SideBar/>)
        expect(screen.getByText('CATEGORY')).toBeInTheDocument()
    })
    it('renders PIPELINE STAGE inside sidebar', () => {
        render(<SideBar/>)
        expect(screen.getByText('PIPELINE STAGE')).toBeInTheDocument()
    })
    it('renders LICENSE STATUS inside sidebar', () => {
        render(<SideBar/>)
        expect(screen.getByText('LICENSE STATUS')).toBeInTheDocument()
    })
    it('renders DRIVE TIME FROM HOME BASE inside sidebar', () => {
        render(<SideBar/>)
        expect(screen.getByText('DRIVE TIME FROM HOME BASE')).toBeInTheDocument()
    })
})
     