'use client'

import { useEffect } from 'react'

/**
 * Placeholder SVG inline (data URI) — monogramme KALA'S géométrique.
 * Aucune dépendance externe : fonctionnel hors ligne, en production, partout.
 */
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#f5f5f5"/>' +
      '<rect x="164" y="100" width="72" height="72" rx="16" fill="#1a1a1a"/>' +
      '<path d="M190 118 V154" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M226 118 L202 136 L226 154" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
    '</svg>'
  )

/**
 * useImageErrorFallback — gestion d'erreur globale des images.
 *
 * Capte les erreurs de chargement <img> (404, fichier supprimé, URL invalide)
 * via la phase de capture de l'événement "error" et remplace l'image cassée
 * par un placeholder de marque. Chaque image n'est substituée qu'une fois
 * (data-img-fallback) pour éviter toute boucle.
 *
 * À appeler UNE fois par arbre (layout storefront + page admin).
 */
export function useImageErrorFallback() {
  useEffect(() => {
    const onError = (e: Event) => {
      const img = e.target as HTMLImageElement | null
      if (!img || img.tagName !== 'IMG') return
      if (img.dataset.imgFallback === '1') return
      img.dataset.imgFallback = '1'
      img.src = PLACEHOLDER
    }
    window.addEventListener('error', onError, true)
    return () => window.removeEventListener('error', onError, true)
  }, [])
}
