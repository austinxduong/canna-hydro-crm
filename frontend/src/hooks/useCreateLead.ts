import React, { useState } from 'react'
import { SERVER_URL } from '@/lib/constants'
import { LeadFormFields } from '@/lib/types'

export const useCreateLead = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>()


    async function createLead (formData: LeadFormFields ) {
    setFormError(null)
    setIsSubmitting(true)

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: formData.name,
                address: formData.address,
                category: formData.category
            })
        })
        if (!response.ok) {
            throw new Error(`Failed to post new lead (Status ${response.status})`)
        }
    } catch(err) {
        setFormError(err instanceof Error ? err.message : String(err))
        throw err;
    } finally {
        setIsSubmitting(false)
    }
}

  return {
    isSubmitting,
    formError,
    createLead
  }
}
