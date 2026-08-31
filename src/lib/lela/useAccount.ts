import { useCallback, useEffect, useState } from "react";
import {
  coupleOf,
  currentUser,
  devModeEnabled,
  isConnected,
  isExpired,
  partnerOf,
  slotOf,
  type Couple,
  type Slot,
  type User,
} from "./account";

export type AccountState = {
  ready: boolean;
  user: User | null;
  couple: Couple | null;
  slot: Slot | null;
  partner: User | null;
  connected: boolean;
  expired: boolean;
  isGuest: boolean;
  devMode: boolean;
};

const EMPTY: AccountState = {
  ready: false,
  user: null,
  couple: null,
  slot: null,
  partner: null,
  connected: false,
  expired: false,
  isGuest: false,
  devMode: false,
};

/** Reads the simulated device session after hydration only. */
export function useAccount(): AccountState {
  const [state, setState] = useState<AccountState>(EMPTY);

  const sync = useCallback(() => {
    const user = currentUser();
    const couple = coupleOf(user?.id ?? null);
    setState({
      ready: true,
      user,
      couple,
      slot: slotOf(couple, user?.id ?? null),
      partner: partnerOf(couple, user?.id ?? null),
      connected: isConnected(couple),
      expired: couple ? isExpired(couple) : false,
      isGuest: user?.kind === "guest",
      devMode: devModeEnabled(),
    });
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("lela:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lela:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return state;
}
