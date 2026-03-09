import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/store/authStore";
import { ReactNode } from "react";

interface AuthGuardProps {
    children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated, accessToken, isGuest, isLoading } = useAuthStore();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                <div className="w-8 h-8 border-4 border-black/20 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    // Guest users can access the dashboard (offline space only)
    if (isGuest) {
        return <>{children}</>;
    }

    if (!isAuthenticated || !accessToken) {
        return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
