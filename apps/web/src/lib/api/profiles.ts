import { apiFetch } from "@/lib/api/client";
import type { Profile } from "@/types/profile";

export type UpdateProfileRequest = {
  name: string;
  description: string | null;
  initialBalance: number;
};

export const PROFILE_UPDATED_EVENT = "finly:profile-updated";

export async function getProfiles(token: string): Promise<Profile[]> {
  return apiFetch<Profile[]>("/api/Profiles", {
    method: "GET",
    token,
  });
}

export async function updateProfile(
  profileId: string,
  request: UpdateProfileRequest,
  token: string,
): Promise<Profile> {
  return apiFetch<Profile>(`/api/Profiles/${profileId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(request),
  });
}
