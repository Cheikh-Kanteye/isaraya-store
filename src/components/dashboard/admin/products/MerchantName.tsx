import { useMerchant } from "@/hooks/queries/useUserQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const MerchantName = ({ vendorId }: { vendorId?: string }) => {
  const { data: merchant, isLoading, error } = useMerchant(vendorId || "");

  if (isLoading) return <Skeleton className="h-4 w-24 bg-gray-100" />;

  if (!vendorId || vendorId === "") {
    return (
      <Badge variant="secondary" className="text-xs">
        Non attribué
      </Badge>
    );
  }

  if (error) {
    console.warn(
      `Erreur lors de la récupération du marchand ${vendorId}:`,
      error
    );
    return (
      <Badge variant="secondary" className="text-xs">
        ID: {vendorId.substring(0, 8)}
      </Badge>
    );
  }

  if (!merchant) {
    return (
      <Badge variant="outline" className="text-xs">
        Chargement...
      </Badge>
    );
  }

  const displayName = merchant.user
    ? `${merchant.user.firstName} ${merchant.user.lastName}`
    : merchant.businessName || "Nom inconnu";

  return (
    <div className="flex flex-col">
      <span className="font-medium text-sm">{displayName}</span>
      {merchant.businessName && merchant.user && (
        <span className="text-xs text-muted-foreground">
          {merchant.businessName}
        </span>
      )}
    </div>
  );
};
