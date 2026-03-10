import { createContext, useContext, useEffect, useState } from "react"
import { useSettingsStore } from "@/store/settingsStore"

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    ...props
}: ThemeProviderProps) {
    // Get theme from settings store
    const storeTheme = useSettingsStore((state) => state.appearance.theme)
    const setStoreTheme = useSettingsStore((state) => state.setTheme)
    const accentColor = useSettingsStore((state) => state.appearance.accentColor)
    const density = useSettingsStore((state) => state.appearance.density)
    const highContrast = useSettingsStore((state) => state.appearance.highContrast)
    const reducedMotion = useSettingsStore((state) => state.appearance.reducedMotion)
    
    // Use store theme, fallback to default
    const [theme, setThemeState] = useState<Theme>(storeTheme || defaultTheme)

    // Sync with store when it changes
    useEffect(() => {
        if (storeTheme) {
            setThemeState(storeTheme)
        }
    }, [storeTheme])

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }
    }, [theme])

    // Apply accent color as CSS variable
    useEffect(() => {
        const root = window.document.documentElement
        if (accentColor) {
            root.style.setProperty('--accent-color', accentColor)
            // Also set the primary color to match accent
            root.style.setProperty('--primary', accentColor)
        }
    }, [accentColor])

    // Apply density as CSS variable
    useEffect(() => {
        const root = window.document.documentElement
        const densityValues = {
            compact: '0.5rem',
            comfortable: '1rem',
            spacious: '1.5rem'
        }
        root.style.setProperty('--density', densityValues[density] || '1rem')
        
        // Add density class for component-specific styling
        root.classList.remove('density-compact', 'density-comfortable', 'density-spacious')
        root.classList.add(`density-${density}`)
    }, [density])

    // Apply high contrast
    useEffect(() => {
        const root = window.document.documentElement
        if (highContrast) {
            root.classList.add('high-contrast')
        } else {
            root.classList.remove('high-contrast')
        }
    }, [highContrast])

    // Apply reduced motion
    useEffect(() => {
        const root = window.document.documentElement
        if (reducedMotion) {
            root.classList.add('reduce-motion')
        } else {
            root.classList.remove('reduce-motion')
        }
    }, [reducedMotion])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        setStoreTheme(newTheme)
    }

    const value = {
        theme,
        setTheme,
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}
