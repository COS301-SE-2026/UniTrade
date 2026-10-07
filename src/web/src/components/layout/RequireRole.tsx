import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "../../store/useAuthStore";
import type { UserRole } from "../../store/useAuthStore";

export default function RequireRole({ allow }: Readonly<{allow: UserRole}>){
    const user=useAuthStore((s)=>s.user);
    const location=useLocation();

    if(!user){
        return (
            <Navigate
                to="/auth/Homepage"
                replace
                state={{from: location.pathname + location.search}}
            />
        );
    }

    if(user.role!==allow){
        return (
            <Navigate
                to={user.role==="admin" ? "/admin/dashboard": "/buyer/listings"}
                replace
            />
        );
    }

    return <Outlet/>;
}