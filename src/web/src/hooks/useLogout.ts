import { useCallback } from "react";
import { authService } from "../services/authService";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import { connectionManager } from "../services/realtime/connectionManager";

export const useLogout = () => {
  const navigate = useNavigate();
  const clearUser = useAuthStore((state) => state.clearUser);

  const logout = useCallback(async () => {
    try {
      await authService.logout(() => connectionManager.disconnect());
      clearUser();
      navigate("/auth/login");
    } catch {
      //error
    }
  }, [clearUser, navigate]);
  return logout;
};
