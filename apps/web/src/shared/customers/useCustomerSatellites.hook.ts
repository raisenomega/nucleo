import { useCallback, useEffect, useState } from "react";
import { satellitesRepository as repo, type CustomerAddress, type CustomerContact, type Payload } from "@shared/customers/customer-satellites.repository";

// Carga las direcciones y contactos de un cliente y expone las mutaciones (devuelven mensaje de error o null).
export function useCustomerSatellites(customerId: string) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const refresh = useCallback(() => {
    void repo.listAddresses(customerId).then(setAddresses);
    void repo.listContacts(customerId).then(setContacts);
  }, [customerId]);
  useEffect(refresh, [refresh]);
  const after = async (e: string | null) => { if (!e) refresh(); return e; };
  return {
    addresses, contacts, refresh,
    saveAddress: async (p: Payload) => after(await repo.upsertAddress(p)),
    removeAddress: async (id: string) => after(await repo.deleteAddress(id)),
    saveContact: async (p: Payload) => after(await repo.upsertContact(p)),
    removeContact: async (id: string) => after(await repo.deleteContact(id)),
  };
}
