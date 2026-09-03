import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { getStageDotColor } from '@/lib/formatters'

describe('returns stage colors',() => {
    it('returns bg-pink-500 for New', () =>{
        expect(getStageDotColor("New")).toBe('bg-pink-500')
    })
    it('returns bg-orange-500 for Contacted', () => {
        expect(getStageDotColor("Contacted")).toBe('bg-orange-500')
    })
    it('returns bg-yellow-500 for Demo Scheduled', () => {
        expect(getStageDotColor("Demo Scheduled")).toBe('bg-yellow-500')
    })
    it('returns bg-green-500 for Customer', () => {
        expect(getStageDotColor("Customer")).toBe('bg-green-500')
    })
    it('returns bg-red-500 for Lost', () => {
        expect(getStageDotColor("Lost")).toBe('bg-red-500')
    })
    it('returns undefined for unmatched stages', () => {
        expect(getStageDotColor("Uknown Stage")).toBe(undefined)
    })
})