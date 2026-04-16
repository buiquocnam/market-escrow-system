import { useAuthContext, UserSession } from "@/core/providers/AuthContext";

export type { UserSession };

export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    loading: context.loading,
    login: context.login,
    logout: context.logout
  };
}
