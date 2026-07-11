import type { Result } from "@landing/domain/landing.types";

export type PackageMode = "simple" | "bundle";
export type IncludedProduct = { productId: string; quantity: number };
export type IncludedService = { serviceId: string; quantity: number };
export type CatalogItem = { id: string; name: string };

export interface LandingPackage {
  id: string; slug: string; name: string; shortDescription: string; longDescription: string;
  price: number; compareAtPrice: number | null; currency: string;
  includedProducts: IncludedProduct[]; includedServices: IncludedService[]; featuresList: string[];
  primaryImageUrl: string | null; isActive: boolean; isFeatured: boolean; displayOrder: number;
  badgeLabel: string; metaTitle: string; metaDescription: string; isPublished: boolean;
}
export type PackageInput = Omit<LandingPackage, "id">;
export interface ILandingPackagesRepository {
  list(): Promise<LandingPackage[]>;
  get(id: string): Promise<LandingPackage | null>;
  create(tenantId: string, input: PackageInput): Promise<Result>;
  update(id: string, input: PackageInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
