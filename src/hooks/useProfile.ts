import { useMemo } from "react";
import { useBusiness } from "./queries";

/** The signed-in owner's business details. */
export function useProfile() {
  const { data } = useBusiness();
  return useMemo(() => {
    const fullName = data ? `${data.ownerFirstName} ${data.ownerLastName}`.trim() : "";
    const firstName = data?.ownerFirstName ?? "";
    return {
      loaded: data !== undefined,
      firstName,
      fullName,
      businessName: data?.name ?? "",
      phone: data?.phone ?? "",
      email: data?.email ?? "",
      initial: (firstName.charAt(0) || "S").toUpperCase(),
    };
  }, [data]);
}
