import type { ReactNode } from "react";
import { MotionProvider } from "@landing-public/motion/motion-loader";
import { PublicNav } from "@landing-public/presentation/nav/PublicNav";
import type { PublicBrand } from "@landing-public/domain/public-brand.types";

// Marco común de las detail pages: MotionProvider + lp-root + PublicNav sticky. Reutilizable service/package.
export function DetailShell({ brand, children }: { brand: PublicBrand; children: ReactNode }) {
  return (
    <MotionProvider>
      <div className="lp-root min-h-screen">
        <PublicNav displayName={brand.displayName} logoUrl={brand.logoUrl} />
        {children}
      </div>
    </MotionProvider>
  );
}
