"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

// Types
export interface TelemetrySelection {
    year: string
    gp: string | null
    session: string
    selectedDrivers: string[]
    totalLaps: number
}

interface TelemetryContextType {
    selection: TelemetrySelection
    updateSelection: (updates: Partial<TelemetrySelection>) => void
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined)

export function TelemetryProvider({ children }: { children: ReactNode }) {
    const [selection, setSelection] = useState<TelemetrySelection>({
        year: '2024',
        gp: null,
        session: 'R',
        selectedDrivers: [],
        totalLaps: 0,
    })

    const updateSelection = (updates: Partial<TelemetrySelection>) => {
        setSelection(prev => ({ ...prev, ...updates }))
    }

    return (
        <TelemetryContext.Provider value={{ selection, updateSelection }}>
            {children}
        </TelemetryContext.Provider>
    )
}

export function useTelemetry() {
    const context = useContext(TelemetryContext)
    if (!context) {
        throw new Error('useTelemetry must be used within TelemetryProvider')
    }
    return context
}
