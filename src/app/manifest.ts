import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KALA'S — Produits d'Hygiène",
    short_name: "KALA'S",
    description:
      "KALA'S - Fabricant de produits d'hygiène de qualité industrielle à Pointe-Noire, Congo-Brazzaville. Savon liquide, détergent et eau de Javel.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "fr",
    dir: "ltr",
    background_color: "#ffffff",
    theme_color: "#1a1a1a",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Nos Produits",
        short_name: "Produits",
        description: "Découvrez nos produits d'hygiène",
        url: "/produits",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Entreprises (B2B)",
        short_name: "Entreprises",
        description: "Solutions et contrats pour entreprises",
        url: "/entreprises",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Contact",
        short_name: "Contact",
        description: "Contactez KALA'S",
        url: "/contact",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
