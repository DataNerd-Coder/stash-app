import { useMemo } from "react";
import { session } from "@/lib/session";
import { useBusiness } from "./queries";

/**
 * The owner's details from the database. Until the first response arrives it
 * falls back to what they typed at signup (kept locally), so names don't flash.
 */
export function useProfile() {
  const { data } = useBusiness();
  return useMemo(() => {
    const local = session.getBusiness();
    const fullName = data
      ? `${data.ownerFirstName} ${data.ownerLastName}`.trim()
      : (local?.ownerName ?? "");
    const firstName = data?.ownerFirstName ?? fullName.split(" ")[0] ?? "";
    return {
      loaded: data !== undefined,
      firstName,
      fullName,
      businessName: data?.name ?? local?.businessName ?? "",
      phone: data?.phone ?? local?.phone ?? "",
      email: data?.email ?? "",
      initial: (firstName.charAt(0) || "S").toUpperCase(),
    };
  }, [data]);
}
