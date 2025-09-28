import type { Product } from "@/types";

/**
 * Récupère l'ID du marchand/vendeur d'un produit
 * Le backend utilise 'vendorId' mais le frontend peut parfois avoir 'vendorId'
 */
export function getvendorId(product: Product | any): string | undefined {
  // Priorité à vendorId (utilisé par le backend)
  if (product.vendorId) {
    return product.vendorId;
  }

  // Fallback sur vendorId (utilisé par le frontend)
  if (product.vendorId) {
    return product.vendorId;
  }

  return undefined;
}

/**
 * Vérifie si un produit a un marchand/vendeur assigné
 */
export function hasAssignedMerchant(product: Product | any): boolean {
  const vendorId = getvendorId(product);
  return !!vendorId && vendorId.length > 0;
}

/**
 * Normalise un produit pour s'assurer qu'il a les deux champs
 */
export function normalizeProduct(product: Product | any): Product {
  const vendorId = getvendorId(product);

  return {
    ...product,
    vendorId: vendorId,
    vendorId: vendorId,
  };
}

/**
 * Filtre les produits par marchand/vendeur
 */
export function filterProductsByMerchant(
  products: Product[],
  vendorId: string
): Product[] {
  return products.filter((product) => {
    const productvendorId = getvendorId(product);
    return productvendorId === vendorId;
  });
}
