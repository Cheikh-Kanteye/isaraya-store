import { Badge } from "@/components/ui/badge";

interface SimpleMerchantDisplayProps {
  vendorId?: string;
  fallbackName?: string;
}

/**
 * Composant simple pour afficher les informations du marchand/vendeur
 * sans faire d'appels API qui peuvent échouer à cause des permissions
 */
export const SimpleMerchantDisplay = ({
  vendorId,
  fallbackName,
}: SimpleMerchantDisplayProps) => {
  if (!vendorId) {
    return <span className="text-sm text-gray-500 italic">Non attribué</span>;
  }

  // Afficher seulement le nom complet du vendeur
  const displayName = fallbackName || `Vendeur ${vendorId.substring(0, 8)}`;

  return (
    <span className="font-medium text-sm text-gray-700">{displayName}</span>
  );
};
