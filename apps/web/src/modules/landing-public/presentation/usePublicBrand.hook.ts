import { useContext } from "react";
import { PublicBrandContext } from "@landing-public/presentation/PublicBrandProvider";

// Consumer del estado del brand público. loading | ready(brand) | fallback.
export const usePublicBrand = () => useContext(PublicBrandContext);
