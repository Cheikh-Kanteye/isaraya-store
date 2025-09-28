import React from "react";
import { CheckCircle, XCircle, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export default function PaymentStatusPage() {
  const navigate = useNavigate();
  const { status } = useParams<{ status: string }>();
  const { clearCart } = useCartStore();

  useEffect(() => {
    // Rediriger vers la page d'accueil si le statut n'est pas valide
    if (!status || !["success", "cancel", "pending"].includes(status)) {
      navigate("/");
      return;
    }

    // Vider le panier seulement si le paiement a réussi
    if (status === "success") {
      clearCart();
    }
  }, [status, navigate, clearCart]);

  // Fonction pour obtenir l'icône appropriée
  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-24 w-24 text-green-500 mb-6" />;
      case "cancel":
        return <XCircle className="h-24 w-24 text-red-500 mb-6" />;
      case "pending":
        return <Clock className="h-24 w-24 text-yellow-500 mb-6" />;
      default:
        return null;
    }
  };

  // Fonction pour obtenir le titre approprié
  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return "Paiement Réussi !";
      case "cancel":
        return "Paiement Annulé";
      case "pending":
        return "Paiement En Cours";
      default:
        return "Statut Inconnu";
    }
  };

  // Fonction pour obtenir le message approprié
  const getStatusMessage = () => {
    switch (status) {
      case "success":
        return "Merci pour votre achat. Votre paiement a été traité avec succès et votre commande est en cours de traitement.";
      case "cancel":
        return "Votre paiement a été annulé. Aucun montant n'a été débité de votre compte.";
      case "pending":
        return "Votre paiement est en cours de traitement. Nous vous confirmerons le statut de votre commande sous peu.";
      default:
        return "Une erreur est survenue lors du traitement de votre paiement.";
    }
  };

  // Fonction pour obtenir la couleur du titre
  const getTitleColor = () => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "cancel":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 text-center">
      {getStatusIcon()}

      <h1 className={`text-4xl font-bold mb-4 ${getTitleColor()}`}>
        {getStatusTitle()}
      </h1>

      <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
        {getStatusMessage()}
      </p>

      <div className="flex gap-4 flex-wrap justify-center">
        <Button onClick={() => navigate("/")} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la page d'accueil
        </Button>

        {status === "cancel" && (
          <Button onClick={() => navigate("/cart")} variant="outline" size="lg">
            Retour au panier
          </Button>
        )}

        {status === "pending" && (
          <Button
            onClick={() => navigate("/orders")}
            variant="outline"
            size="lg"
          >
            Voir mes commandes
          </Button>
        )}
      </div>

      {/* Message d'information supplémentaire pour le status pending */}
      {status === "pending" && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg max-w-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note :</strong> Votre panier a été conservé. Le paiement
            sera finalisé automatiquement une fois le traitement terminé.
          </p>
        </div>
      )}
    </div>
  );
}
