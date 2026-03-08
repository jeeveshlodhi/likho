import { Link } from "react-router";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const Header = () => {
    return (
        <header className="flex justify-between items-center py-4">
            <Link to="/" className="text-2xl font-bold text-foreground hover:opacity-90 transition-opacity">
                Likho
            </Link>
            <div className="flex items-center gap-3">
                <ThemeToggle showLabel={true} />
                <Link
                    to="/auth/sign-in"
                    className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                    Sign In
                </Link>
                <Link
                    to="/auth/sign-up"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    Sign Up
                </Link>
            </div>
        </header>
    );
};

export default Header;