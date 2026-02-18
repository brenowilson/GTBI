import { useQuery } from "@tanstack/react-query";
import { adminRepository } from "@/shared/repositories/supabase";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminRepository.getStats(),
    retry: 1,
    retryDelay: 5000,
  });
}
