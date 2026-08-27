'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface TermsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Conditions Générales de Vente</DialogTitle>
          <DialogDescription>Dernière mise à jour : Janvier 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6 pb-6">
          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            {/* Article 1 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 1 — Objet</h3>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits d&rsquo;hygiène et de nettoyage effectuées par la société CongoClean, SARL au capital de 10 000 000 FCFA, immatriculée au RCCM de Pointe-Noire, Congo-Brazzaville. Elles s&rsquo;appliquent à toute commande passée sur notre site web congoclean.cg ou par téléphone au +242 06 123 4567.
              </p>
            </section>

            <Separator />

            {/* Article 2 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 2 — Produits</h3>
              <p className="mb-2">
                Les produits proposés à la vente sont des articles d&rsquo;hygiène industrielle et domestique : savons liquides, détergents, eaux de Javel et produits assimilés. Tous nos produits sont fabriqués dans notre usine située en Zone Industrielle de Pointe-Noire, conformément aux normes en vigueur en République du Congo.
              </p>
              <p>
                Les photographies et descriptions des produits sont présentées à titre indicatif et ne sauraient engager la responsabilité de CongoClean en cas de légères différences de teinte ou de conditionnement. Les prix sont indiqués en Franc CFA (FCFA) et incluent la TVA au taux en vigueur.
              </p>
            </section>

            <Separator />

            {/* Article 3 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 3 — Commande</h3>
              <p className="mb-2">
                Toute commande passée sur notre site constitue un contrat de vente entre le client et CongoClean. Le client reconnaît avoir pris connaissance des caractéristiques du produit, de son prix et des présentes CGV avant de valider sa commande.
              </p>
              <p>
                CongoClean se réserve le droit d&rsquo;annuler ou de refuser toute commande en cas de litige antérieur, de stock insuffisant ou d&rsquo;erreur de prix. En cas d&rsquo;annulation, le client sera informé par email ou par téléphone et sera remboursé intégralement dans les 72 heures.
              </p>
            </section>

            <Separator />

            {/* Article 4 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 4 — Prix et Paiement</h3>
              <p className="mb-2">
                Les prix sont exprimés en Franc CFA (FCFA), toutes taxes comprises. CongoClean se réserve le droit de modifier ses prix à tout moment. Toutefois, les produits commandés seront facturés au prix en vigueur au moment de la validation de la commande.
              </p>
              <p>
                Le paiement s&rsquo;effectue à la livraison (paiement en espèces ou par Mobile Money via Airtel Money et MTN Mobile Money). Aucune commande ne sera expédiée sans confirmation du mode de paiement.
              </p>
            </section>

            <Separator />

            {/* Article 5 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 5 — Livraison</h3>
              <p className="mb-2">
                La livraison est effectuée à l&rsquo;adresse indiquée par le client lors de la commande. Les délais de livraison sont de 24 à 48 heures ouvrables pour le Centre-ville de Pointe-Noire, et de 2 à 5 jours ouvrables pour les zones périphériques (Loango, Tchimbamba, Hôpital, Diosso et autres zones).
              </p>
              <p className="mb-2">
                Les frais de livraison varient selon la zone de livraison :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Centre-ville (Pointe-Noire)</strong> : Livraison gratuite</li>
                <li><strong>Quartiers périphériques</strong> : 1 500 FCFA</li>
                <li><strong>Loango / Tchimbamba</strong> : 3 000 FCFA</li>
                <li><strong>Hôpital / Diosso</strong> : 5 000 FCFA</li>
                <li><strong>Autres zones</strong> : 8 000 FCFA</li>
              </ul>
              <p className="mt-2">
                La livraison est offerte (gratuite) pour les commandes de 25 000 FCFA et plus dans les zones périphériques. Le Centre-ville bénéficie de la livraison gratuite sans minimum d&rsquo;achat.
              </p>
            </section>

            <Separator />

            {/* Article 6 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 6 — Rétractation et Retour</h3>
              <p className="mb-2">
                Conformément à la réglementation de la CEMAC, le client dispose d&rsquo;un délai de 7 jours ouvrables à compter de la réception du produit pour exercer son droit de rétractation. Le produit doit être retourné dans son emballage d&rsquo;origine, non ouvert et en parfait état.
              </p>
              <p>
                Les frais de retour sont à la charge du client. Le remboursement sera effectué dans un délai de 15 jours ouvrables après réception du produit retourné, par virement bancaire ou Mobile Money.
              </p>
            </section>

            <Separator />

            {/* Article 7 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 7 — Responsabilité</h3>
              <p>
                CongoClean ne saurait être tenue responsable de l&rsquo;utilisation inappropriée de ses produits. Les produits doivent être utilisés conformément aux instructions figurant sur l&rsquo;emballage. CongoClean décline toute responsabilité en cas de dommages résultant d&rsquo;un mauvais usage, d&rsquo;un mélange inapproprié avec d&rsquo;autres substances ou du non-respect des conditions de stockage.
              </p>
            </section>

            <Separator />

            {/* Article 8 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 8 — Données Personnelles</h3>
              <p>
                Les données personnelles collectées lors de la commande (nom, adresse, téléphone, email) sont traitées conformément à notre Politique de Confidentialité. Le client dispose d&rsquo;un droit d&rsquo;accès, de rectification et de suppression de ses données en contactant CongoClean à l&rsquo;adresse contact@congoclean.cg.
              </p>
            </section>

            <Separator />

            {/* Article 9 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 9 — Litiges</h3>
              <p>
                En cas de litige, le client peut contacter le service client de CongoClean par email à contact@congoclean.cg ou par téléphone au +242 06 123 4567. À défaut de résolution amiable, le tribunal compétent est celui de Pointe-Noire, République du Congo.
              </p>
            </section>

            <Separator />

            {/* Article 10 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">Article 10 — Droit Applicable</h3>
              <p>
                Les présentes CGV sont soumises au droit de la République du Congo. Toute clause non prévue dans les présentes conditions sera soumise à la législation congolaise en vigueur, notamment le Code Civil et le Code de la Consommation de la République du Congo.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

interface PrivacyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl">Politique de Confidentialité</DialogTitle>
          <DialogDescription>Dernière mise à jour : Janvier 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] px-6 pb-6">
          <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">1. Introduction</h3>
              <p>
                La société CongoClean, SARL, située en Zone Industrielle de Pointe-Noire, République du Congo, s&rsquo;engage à protéger la vie privée de ses clients et visiteurs. La présente Politique de Confidentialité décrit les types de données personnelles que nous collectons, les raisons pour lesquelles nous les collectons, et comment nous les utilisons et les protégeons.
              </p>
            </section>

            <Separator />

            {/* Section 2 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">2. Données Collectées</h3>
              <p className="mb-2">Nous pouvons collecter les données personnelles suivantes :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Nom et prénom</strong> — pour personnaliser nos communications et traiter vos commandes</li>
                <li><strong>Adresse email</strong> — pour l&rsquo;envoi des confirmations de commande, des avis de livraison et de notre newsletter (avec consentement)</li>
                <li><strong>Numéro de téléphone</strong> — pour la livraison et le service client, y compris les notifications via Airtel Money et MTN Mobile Money</li>
                <li><strong>Adresse de livraison</strong> — pour acheminer vos commandes dans les différentes zones de Pointe-Noire et ses environs</li>
                <li><strong>Données de navigation</strong> — adresse IP, type de navigateur, pages visitées, durée de visite, via des cookies technologiques</li>
                <li><strong>Avis et commentaires</strong> — nom et note laissés sur nos produits</li>
                <li><strong>Messages de chat</strong> — échanges avec notre service client via le chat en ligne</li>
              </ul>
            </section>

            <Separator />

            {/* Section 3 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">3. Utilisation des Données</h3>
              <p className="mb-2">Vos données personnelles sont utilisées pour :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Traiter et livrer vos commandes de produits d&rsquo;hygiène</li>
                <li>Vous envoyer des confirmations de commande et des mises à jour de livraison</li>
                <li>Répondre à vos demandes via notre formulaire de contact et notre chat en ligne</li>
                <li>Améliorer nos produits et services</li>
                <li>Vous envoyer notre newsletter (uniquement avec votre consentement préalable)</li>
                <li>Prévenir la fraude et assurer la sécurité de notre site</li>
                <li>Respecter nos obligations légales en République du Congo et dans la CEMAC</li>
              </ul>
            </section>

            <Separator />

            {/* Section 4 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">4. Partage des Données</h3>
              <p className="mb-2">
                CongoClean ne vend, ne loue et ne partage pas vos données personnelles avec des tiers à des fins commerciales. Vos données peuvent être partagées uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Prestataires de livraison</strong> — nos livreurs à Pointe-Noire ont accès à votre nom, téléphone et adresse de livraison</li>
                <li><strong>Opérateurs Mobile Money</strong> — Airtel Money et MTN Mobile Money pour le traitement des paiements</li>
                <li><strong>Obligations légales</strong> — en cas de demande des autorités compétentes de la République du Congo</li>
              </ul>
            </section>

            <Separator />

            {/* Section 5 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">5. Cookies</h3>
              <p className="mb-2">
                Notre site utilise des cookies pour améliorer votre expérience de navigation. Les cookies que nous utilisons sont :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Cookies essentiels</strong> — nécessaires au fonctionnement du site (panier, session utilisateur)</li>
                <li><strong>Cookies analytiques</strong> — pour comprendre comment les visiteurs utilisent notre site (Google Analytics, avec consentement)</li>
                <li><strong>Cookies de préférences</strong> — pour mémoriser vos choix (langue, zone de livraison préférée)</li>
              </ul>
              <p className="mt-2">
                Vous pouvez gérer vos préférences en matière de cookies via la bannière de consentement affichée lors de votre première visite sur notre site.
              </p>
            </section>

            <Separator />

            {/* Section 6 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">6. Sécurité des Données</h3>
              <p>
                CongoClean met en &oelig;uvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute modification, divulgation ou destruction. Nos mesures incluent le chiffrement des connexions (HTTPS), la protection de notre base de données et la limitation de l&rsquo;accès aux données aux seuls employés habilités.
              </p>
            </section>

            <Separator />

            {/* Section 7 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">7. Vos Droits</h3>
              <p className="mb-2">Conformément à la législation de la République du Congo, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Droit d&rsquo;accès</strong> — obtenir une copie de vos données personnelles détenues par CongoClean</li>
                <li><strong>Droit de rectification</strong> — corriger toute donnée inexacte ou incomplète</li>
                <li><strong>Droit de suppression</strong> — demander la suppression de vos données personnelles</li>
                <li><strong>Droit d&rsquo;opposition</strong> — vous opposer au traitement de vos données à des fins de marketing</li>
                <li><strong>Droit de retrait du consentement</strong> — retirer votre consentement à tout moment pour la newsletter et les cookies non essentiels</li>
              </ul>
              <p className="mt-2">
                Pour exercer ces droits, veuillez nous contacter à l&rsquo;adresse email <strong>contact@congoclean.cg</strong> ou par téléphone au <strong>+242 06 123 4567</strong>.
              </p>
            </section>

            <Separator />

            {/* Section 8 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">8. Conservation des Données</h3>
              <p>
                Vos données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, et au maximum 3 ans après votre dernière interaction avec CongoClean (dernière commande, dernier contact ou dernière visite sur le site). Les données comptables sont conservées pendant 10 ans conformément à la réglementation congolaise.
              </p>
            </section>

            <Separator />

            {/* Section 9 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">9. Modifications</h3>
              <p>
                CongoClean se réserve le droit de modifier la présente Politique de Confidentialité à tout moment. Toute modification sera publiée sur cette page avec une mise à jour de la date de &laquo; Dernière mise à jour &raquo;. Nous vous encourageons à consulter cette page régulièrement.
              </p>
            </section>

            <Separator />

            {/* Section 10 */}
            <section>
              <h3 className="font-semibold text-gray-900 text-base mb-2">10. Contact</h3>
              <p>
                Pour toute question relative à la présente Politique de Confidentialité, vous pouvez nous contacter :
              </p>
              <ul className="list-none space-y-1 ml-2 mt-2">
                <li>📧 Email : <strong>contact@congoclean.cg</strong></li>
                <li>📞 Téléphone : <strong>+242 06 123 4567</strong></li>
                <li>📍 Adresse : <strong>Zone Industrielle, Pointe-Noire, Congo-Brazzaville</strong></li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
