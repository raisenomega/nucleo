import { createContext, useContext } from "react";

// Modo owner del demo (tras verificar PIN). El gate REAL es backend (session_id);
// esto es sólo estado de UI para habilitar botones destructivos.
export interface DemoOwnerValue {
  ownerMode: boolean;
  enableOwnerMode: () => void;
  disableOwnerMode: () => void;
}
export const DemoOwnerContext = createContext<DemoOwnerValue>({
  ownerMode: false, enableOwnerMode: () => {}, disableOwnerMode: () => {},
});
export function useDemoOwner(): DemoOwnerValue {
  return useContext(DemoOwnerContext);
}
