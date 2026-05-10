import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { setMyUsername, getMyUser } from '@/lib/api/auth';
import { getUserPlan } from '@/lib/api/subscriptions';
import { userKey, userPlanKey } from '@/lib/queryKeys';

export function useMyUser() {
  return useQuery({
    queryKey: userKey,
    queryFn: getMyUser,
  });
}

export function useUserPlan(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? userPlanKey(userId) : ['user', 'plan', 'idle'],
    queryFn: () => getUserPlan(userId!),
    enabled: !!userId,
  });
}

export function useUpdateUsername() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      await setMyUsername(username);
      return username.toLowerCase();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKey });
    },
  });
}
