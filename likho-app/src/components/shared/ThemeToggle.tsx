import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"

export function ThemeToggle({ className = "", showLabel = true }: { className?: string; showLabel?: boolean }) {
    const { theme, setTheme } = useTheme()

    const toggleTheme = () => {
        if (theme === "light") {
            setTheme("dark")
        } else if (theme === "dark") {
            setTheme("system")
        } else {
            setTheme("light")
        }
    }

    return (
        <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 rounded-md p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-neutral-50 ${className}`}
            title="Toggle theme"
        >
            {theme === "light" ? (
                <Sun size={18} />
            ) : theme === "dark" ? (
                <Moon size={18} />
            ) : (
                <div className="relative flex h-[18px] w-[18px] items-center justify-center">
                    <span className="absolute left-0 top-0 h-1/2 w-[18px] overflow-hidden">
                        <Sun size={18} />
                    </span>
                    <span className="absolute bottom-0 left-0 h-1/2 w-[18px] overflow-hidden text-neutral-900 dark:text-neutral-50">
                        <Moon size={18} className="-translate-y-1/2" />
                    </span>
                </div>
            )}
            {showLabel && (
                <span className="text-sm font-medium">
                    {theme === "light" ? "Light Mode" : theme === "dark" ? "Dark Mode" : "System Mode"}
                </span>
            )}
        </button>
    )
}
