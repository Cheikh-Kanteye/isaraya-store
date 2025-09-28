"use client";

import { useUser } from "@/hooks/queries";

export const UserDisplay = ({ userId }: { userId: string }) => {
  const { data: user, isLoading } = useUser(userId);

  if (isLoading) return <span className="text-foreground">Chargement...</span>;

  let fullName = "Utilisateur inconnu";
  if (user && typeof user === "object") {
    if ("firstName" in user && "lastName" in user) {
      fullName = `${(user as { firstName?: string }).firstName || ""} ${
        (user as { lastName?: string }).lastName || ""
      }`.trim();
    } else if ("businessName" in user) {
      fullName = (user as { businessName?: string }).businessName || fullName;
    }
  }

  return <span>{fullName || "Utilisateur inconnu"}</span>;
};
