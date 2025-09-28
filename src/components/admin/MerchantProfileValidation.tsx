import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Globe,
  FileText,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MerchantProfile } from "@/types";
import { useValidateMerchantProfile } from "@/hooks/useAdminUsers";

interface MerchantProfileValidationProps {
  profile: MerchantProfile;
  isOpen: boolean;
  onClose: () => void;
}

const MerchantProfileValidation: React.FC<MerchantProfileValidationProps> = ({
  profile,
  isOpen,
  onClose,
}) => {
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const validateMutation = useValidateMerchantProfile();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "SUSPENDED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "SUSPENDED":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approuvé";
      case "REJECTED":
        return "Rejeté";
      case "SUSPENDED":
        return "Suspendu";
      default:
        return "En attente";
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      RESTAURANT: "Restaurant",
      GROCERY: "Épicerie",
      PHARMACY: "Pharmacie",
      ELECTRONICS: "Électronique",
      CLOTHING: "Vêtements",
      OTHER: "Autre",
    };
    return types[type] || type;
  };

  const handleAction = (action: "approve" | "reject") => {
    setActionType(action);
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!actionType) return;

    try {
      await validateMutation.mutateAsync({
        vendorId: profile.id,
        status: actionType === "approve" ? "APPROVED" : "REJECTED",
        reason: actionType === "reject" ? rejectionReason : undefined,
      });

      setShowConfirmDialog(false);
      setActionType(null);
      setRejectionReason("");
      onClose();
    } catch (error) {
      console.error("Error validating merchant profile:", error);
    }
  };

  const canValidate = profile.status === "PENDING";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Profil Marchand - {profile.businessName}
            </DialogTitle>
            <DialogDescription>
              Examinez les détails du profil marchand et validez ou rejetez la
              demande.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Statut actuel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Statut actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`${getStatusColor(
                      profile.status
                    )} flex items-center gap-1`}
                  >
                    {getStatusIcon(profile.status)}
                    {getStatusLabel(profile.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Créé le{" "}
                    {format(new Date(profile.createdAt), "dd/MM/yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </span>
                </div>

                {profile.status === "REJECTED" && profile.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Motif du rejet :
                        </p>
                        <p className="text-sm text-red-700">
                          {profile.rejectionReason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {profile.approvedAt && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Approuvé le{" "}
                        {format(
                          new Date(profile.approvedAt),
                          "dd/MM/yyyy à HH:mm",
                          { locale: fr }
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!profile.user && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ Informations utilisateur non disponibles. Les données
                      utilisateur n'ont pas été récupérées depuis l'API.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nom complet
                    </label>
                    <p className="text-sm">
                      {profile.user?.firstName || "Non renseigné"}{" "}
                      {profile.user?.lastName || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm">
                      {profile.user?.email || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Téléphone
                    </label>
                    <p className="text-sm">
                      {profile.user?.phone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      ID Utilisateur
                    </label>
                    <p className="font-mono text-xs">
                      {profile.userId || "Non disponible"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations business */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Informations business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Nom de l'entreprise
                    </label>
                    <p className="text-sm font-medium">
                      {profile.businessName || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Type d'activité
                    </label>
                    <p className="text-sm">
                      {profile.businessType
                        ? getBusinessTypeLabel(profile.businessType)
                        : "Non renseigné"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Adresse
                    </label>
                    <p className="text-sm">
                      {profile.businessAddress || "Non renseignée"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Téléphone business
                    </label>
                    <p className="text-sm">
                      {profile.businessPhone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email business
                    </label>
                    <p className="text-sm">
                      {profile.businessEmail || "Non renseigné"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations complémentaires */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    {profile.description ? (
                      <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                        {profile.description}
                      </p>
                    ) : (
                      <p className="text-sm mt-1 p-3 bg-gray-100 rounded-md text-muted-foreground italic">
                        Aucune description fournie
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Site web
                      </label>
                      {profile.website ? (
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Non renseigné
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Orange Money
                      </label>
                      <p className="text-sm font-mono">
                        {profile.orangeMoneyNumber || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Wave Money
                      </label>
                      <p className="text-sm font-mono">
                        {profile.waveMoneyNumber || "Non renseigné"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Logo
                    </label>
                    {profile.logoUrl ? (
                      <div className="mt-1">
                        <img
                          src={profile.logoUrl}
                          alt={`Logo ${profile.businessName}`}
                          className="h-16 w-16 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        <div className="hidden mt-1 p-2 bg-gray-100 rounded-md border border-gray-200 text-center">
                          <p className="text-xs text-muted-foreground">
                            Erreur de chargement du logo
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 p-4 bg-gray-100 rounded-md border border-gray-200 text-center">
                        <p className="text-sm text-muted-foreground italic">
                          Aucun logo fourni
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                <Eye className="h-4 w-4 mr-2" />
                Fermer
              </Button>

              {canValidate && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleAction("reject")}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={validateMutation.isPending}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>

                  <Button
                    onClick={() => handleAction("approve")}
                    disabled={validateMutation.isPending}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approuver" : "Rejeter"} le profil
              marchand
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Êtes-vous sûr de vouloir{" "}
                {actionType === "approve" ? "approuver" : "rejeter"} le profil
                marchand de <strong>{profile.businessName}</strong> ?
              </p>

              {actionType === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">
                    Motif du rejet (obligatoire) :
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Expliquez pourquoi ce profil est rejeté..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {actionType === "approve"
                  ? "Le marchand recevra une notification et pourra commencer à vendre ses produits."
                  : "Le marchand recevra une notification avec le motif du rejet."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={validateMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={
                validateMutation.isPending ||
                (actionType === "reject" && !rejectionReason.trim())
              }
              className={
                actionType === "reject" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              {validateMutation.isPending && (
                <Loader size={16} text="" className="mr-2" />
              )}
              {actionType === "approve" ? "Approuver" : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MerchantProfileValidation;
