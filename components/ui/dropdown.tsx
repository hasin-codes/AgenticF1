"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownOption {
    value: string
    label: string
}

interface DropdownProps {
    value: string
    onValueChange: (value: string) => void
    options: DropdownOption[]
    placeholder?: string
    className?: string
    size?: "sm" | "default"
    maxHeight?: string
}

export function Dropdown({
    value,
    onValueChange,
    options,
    placeholder = "Select...",
    className,
    size = "default",
    maxHeight = "300px"
}: DropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.value === value)

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            return () => document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    // Close on Escape key
    React.useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            return () => document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen])

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue)
        setIsOpen(false)
    }

    return (
        <div ref={dropdownRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between gap-2 rounded-md border border-input bg-transparent text-sm shadow-xs transition-colors outline-none whitespace-nowrap",
                    "hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    size === "sm" && "h-8 px-3",
                    size === "default" && "h-9 px-3 py-2",
                    className
                )}
            >
                <span className={cn(
                    "flex items-center gap-2",
                    !selectedOption && "text-muted-foreground"
                )}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={cn(
                    "h-4 w-4 opacity-50 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover shadow-lg",
                        "animate-in fade-in-0 zoom-in-95"
                    )}
                    style={{ top: "100%" }}
                >
                    <div
                        className="overflow-y-auto p-1"
                        style={{ maxHeight }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    "focus:bg-accent focus:text-accent-foreground",
                                    value === option.value && "bg-accent/50"
                                )}
                            >
                                <span className="flex-1 text-left">{option.label}</span>
                                {value === option.value && (
                                    <Check className="h-4 w-4" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
