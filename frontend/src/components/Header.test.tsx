import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header', () =>{
    it('renders the CannaHydro title', () =>{
        render(<Header/>)
        expect(screen.getByText('CannaHydro')).toBeInTheDocument()
    })
})