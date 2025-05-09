import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The name of our device ID cookie
export const DEVICE_ID_COOKIE = "almostrich_device_id";

// Cookie expiration - 1 year in days
export const COOKIE_EXPIRY_DAYS = 365;

/**
 * Generate a new device ID (UUID v4)
 */
export function generateDeviceId(): string {
  return crypto.randomUUID();
}

/**
 * Client-side cookie utilities
 */
export const clientCookies = {
  /**
   * Set a device ID cookie on the client side
   */
  setDeviceId: (deviceId: string): void => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);

    document.cookie = `${DEVICE_ID_COOKIE}=${deviceId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${
      window.location.protocol === "https:" ? "; Secure" : ""
    }`;
  },

  /**
   * Get the device ID from cookies on the client side
   */
  getDeviceId: (): string | undefined => {
    const cookies = document.cookie.split("; ");
    const deviceIdCookie = cookies.find((cookie) =>
      cookie.startsWith(`${DEVICE_ID_COOKIE}=`)
    );

    if (deviceIdCookie) {
      return deviceIdCookie.split("=")[1];
    }

    return undefined;
  },
};
