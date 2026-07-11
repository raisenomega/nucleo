import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (Landing panel). Merged in translations.ts.
export const enLanding = {
  search: "Search", preview: "Preview", name: "Name", active: "Active", order: "Order",
  uploadError: "Could not upload the image", saved: "Saved", selectIcon: "Pick icon",
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday", saturday: "Saturday", sunday: "Sunday",
  landing: "Landing", landingConfig: "Configuration", landingCategories: "Categories",
  landingSiteSettings: "Site settings", systemSettings: "Settings",
  hero: "Hero", heroTitle: "Title", heroSubtitle: "Subtitle", heroCtaLabel: "Button text",
  heroCtaType: "Button action", heroCtaHref: "Custom link", heroImage: "Hero image",
  ctaQuote: "Request a quote", ctaOrder: "Buy", ctaContact: "Contact", ctaCustom: "Custom",
  metaSeo: "Meta / SEO", metaTitle: "Meta title", metaDescription: "Meta description", metaKeywords: "Keywords", metaOgImage: "OG image",
  contactSection: "Contact", publicPhone: "Phone", publicWhatsapp: "WhatsApp", publicEmail: "Email", publicAddress: "Address", businessHoursLabel: "Hours",
  socialSection: "Social media", schemaSection: "Schema / Local business", businessType: "Business type",
  geoLat: "Latitude", geoLng: "Longitude", priceRange: "Price range",
  newCategory: "New category", categoryType: "Type", iconLabel: "Icon", imageLabel: "Image", displayOrder: "Order",
  catProduct: "Product", catService: "Service", catBoth: "Both", confirmDelete: "Delete? This cannot be undone.",
} satisfies Partial<Record<TranslationKey, string>>;
