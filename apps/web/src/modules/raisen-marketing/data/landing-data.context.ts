import { createContext, useContext } from "react";
import type { LandingData } from "@raisen-marketing/data/landing-data.types";

// Contexto con el snapshot del SSR. Se eligió contexto en vez de props porque cada hook lo consume donde ya
// vive: no hay que atravesar 8 componentes con props que solo sirven para el primer render.
export const LandingDataContext = createContext<LandingData | null>(null);

// null cuando no hubo SSR (navegación en cliente, o Supabase caído): el hook hace su fetch normal.
export const useLandingSsr = (): LandingData | null => useContext(LandingDataContext);
