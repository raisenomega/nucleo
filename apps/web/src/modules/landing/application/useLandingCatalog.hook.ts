import { useEffect, useState } from "react";
import type { ILandingProductsRepository, ILandingServicesRepository } from "@landing/domain/landing.types";
import type { CatalogItem } from "@landing/domain/landing-package.types";

// Lee products+services ACTIVOS para los pickers de bundle. LAZY: solo carga cuando enabled=true.
// Repos inyectados (DI) desde la ruta -> application no importa infrastructure.
export function useLandingCatalog(productsRepo: ILandingProductsRepository, servicesRepo: ILandingServicesRepository, enabled: boolean) {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<CatalogItem[]>([]);
  useEffect(() => {
    if (!enabled) return;
    void (async () => {
      const [p, s] = await Promise.all([productsRepo.list(), servicesRepo.list()]);
      setProducts(p.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name })));
      setServices(s.filter((x) => x.isActive).map((x) => ({ id: x.id, name: x.name })));
    })();
  }, [enabled, productsRepo, servicesRepo]);
  return { products, services };
}
