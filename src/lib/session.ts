// Session persisted locally so the onboarding flow feels real.
// Swap for real auth/session handling once there's a backend.

export interface BusinessInfo {
  ownerName: string;
  businessName: string;
  phone: string;
}

const ONBOARDED_KEY = "stash_onboarded";
const BUSINESS_KEY = "stash_business";

// localStorage can throw (private mode, blocked storage) — never let that break the app.
export const session = {
  markOnboarded() {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  },
  isOnboarded(): boolean {
    try {
      return localStorage.getItem(ONBOARDED_KEY) === "1";
    } catch {
      return false;
    }
  },
  saveBusiness(data: BusinessInfo) {
    try {
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(data));
    } catch {
      /* storage unavailable */
    }
  },
  getBusiness(): BusinessInfo | null {
    try {
      return JSON.parse(localStorage.getItem(BUSINESS_KEY) || "null") as BusinessInfo | null;
    } catch {
      return null;
    }
  },
  clear() {
    try {
      localStorage.removeItem(ONBOARDED_KEY);
      localStorage.removeItem(BUSINESS_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};
