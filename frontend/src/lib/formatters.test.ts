import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getStageDotColor, timeAgo, resultsCount } from '@/lib/formatters'
import { vi } from 'vitest'

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

describe('returns last activity at', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })
    it('returns the last time an action activity occured less than 60 seconds ago', () => {

        const mockNow = new Date('2026-09-03T12:00:00Z')
        vi.setSystemTime(mockNow)
        console.log("mock now", mockNow)

        const tenSecondsAgo = new Date('2026-09-03T11:59:50Z').toISOString() // "2026-09-03T11:59:50.000Z"

        expect(timeAgo(tenSecondsAgo)).toBe('just now')
        console.log("ten seconds ago", tenSecondsAgo)
    })
    it('returns last time an action activity 10 mintues ago', () => {
        
        const mockNow = new Date ('2026-09-03T12:00:00Z')
        vi.setSystemTime(mockNow)

        const tenMinsAgo = new Date('2026-09-03T11:49:50Z').toISOString()
        
        expect(timeAgo(tenMinsAgo)).toBe("10 minutes ago")
    })
    it('returns last time an action activiity hours ago', () => {

        const mockNow = new Date('2026-09-03T12:00:00Z')
        vi.setSystemTime(mockNow)

        const oneHourAgo = new Date('2026-09-03T10:59:50Z').toISOString()
        expect(timeAgo(oneHourAgo)).toBe("1 hour ago")
    })
    it('returns last time an action activity days ago', () => {

        const mockNow = new Date('2026-09-03T12:00:00Z')
        vi.setSystemTime(mockNow)

        const oneDayAgo = new Date('2026-09-02T10:59:50Z').toISOString()
        expect(timeAgo(oneDayAgo)).toBe("1 day ago")
    })
    it('returns last time an action activity weeks ago', () => {
        
        const mockNow = new Date('2026-09-03T12:00:00Z')
        vi.setSystemTime(mockNow)

        const fourWeeksAgo = new Date('2026-08-02T10:59:50Z').toISOString()
        expect(timeAgo(fourWeeksAgo)).toBe("4 weeks ago")
    })
})

describe('returns the results.length of businesses', () => {
    it('returns the length of results', () => {
        const count = 8
        expect(resultsCount(count)).toBe("8 results")
    })
    it('returns the length for 1 result', () => {
        const count = 1
        expect(resultsCount(count)).toBe("1 result")
    })
    it('returns the length for 0 results', () => {
        const count = 0
        expect(resultsCount(count)).toBe("0 results")
    })
})