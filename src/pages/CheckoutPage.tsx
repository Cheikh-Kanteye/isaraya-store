import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Smartphone,
  Wallet,
  Truck,
  MapPin,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import FallbackImage from "@/components/shared/FallbackImage";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useOrderStore } from "@/stores/orderStore"; // Import de useOrderStore
import type { Order } from "@/types";
import { normalizePhone } from "@/lib/phone";

type PaymentMethod =
  | "Orange Money"
  | "Wave"
  | "Free Money"
  | "cash_on_delivery";

interface LocationData {
  street?: string;
  city?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: LocationData; // Remplacement des champs d'adresse par un objet LocationData
}

export default function CheckoutPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { items, getTotalPrice } = useCartStore();
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false); // Nouvel état pour le soumission de la commande
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discount, setDiscount] = useState<{amount: number; label: string} | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    location: {
      // Initialisation de l'objet location
      street: "",
      city: "",
      postcode: "",
      country: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  const { createOrder } = useOrderStore(); // Récupérer l'action createOrder du store

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        // Ne pas réinitialiser la location si elle a déjà été définie
        location: prev.location.street
          ? prev.location
          : {
              street: "",
              city: "",
              postcode: "",
              country: "",
              latitude: undefined,
              longitude: undefined,
            },
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Si l'utilisateur commence à taper dans les champs autres que ceux de la localisation,
    // ou si on force la saisie manuelle, désactiver la localisation automatique.
    if (useCurrentLocation && !(e.target.name in formData.location)) {
      setUseCurrentLocation(false);
    }
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLocationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUseCurrentLocation(false);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [e.target.name]: e.target.value,
      },
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error(
        "La géolocalisation n'est pas supportée par votre navigateur."
      );
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          if (response.ok) {
            const data = await response.json();
            const addr = data.address;

            setFormData((prev) => ({
              ...prev,
              location: {
                street:
                  [
                    addr.city_district,
                    addr.house_number,
                    addr.road,
                    addr.residential,
                  ]
                    .filter(Boolean)
                    .join(" ") || "",
                city: addr.city || addr.town || addr.village || "Dakar",
                postcode: addr.postcode || "",
                country: addr.country || "Sénégal",
                latitude: latitude,
                longitude: longitude,
              },
            }));

            setUseCurrentLocation(true);
            toast.success("Adresse obtenue via GPS.");
          } else {
            // Fallback: utiliser les coordonnées GPS et un message générique
            setFormData((prev) => ({
              ...prev,
              location: {
                street: "Adresse non trouvée",
                city: "Ville inconnue",
                postcode: "",
                country: "",
                latitude: latitude,
                longitude: longitude,
              },
            }));
            setUseCurrentLocation(true);
            toast.warning(
              "Impossible de déterminer l'adresse précise, coordonnées GPS enregistrées."
            );
          }
        } catch (error) {
          console.error("Erreur lors de la récupération de l'adresse:", error);
          setFormData((prev) => ({
            ...prev,
            location: {
              street: "Erreur de récupération de l'adresse",
              city: "",
              postcode: "",
              country: "",
              latitude: latitude,
              longitude: longitude,
            },
          }));
          setUseCurrentLocation(true);
          toast.error("Erreur lors de la récupération de l'adresse.");
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        let errorMessage = "Impossible d'obtenir votre position";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permission de géolocalisation refusée";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Position non disponible";
            break;
          case error.TIMEOUT:
            errorMessage = "Délai d'attente dépassé";
            break;
        }

        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const resetToManualEntry = () => {
    setUseCurrentLocation(false);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        latitude: undefined,
        longitude: undefined,
      },
    }));
  };

  const effectiveTotal = Math.max(0, getTotalPrice() - (discount?.amount || 0));

  const applyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    try {
      setIsApplyingPromo(true);
      const result = await (apiService as any).promotions?.validateCode?.(code, {
        total: getTotalPrice(),
        items: items.map(i => ({ id: i.product.id, price: i.product.price, quantity: i.quantity })),
        userId: user?.id,
      });
      if (result && (result.amount || result.percent)) {
        const amount = result.amount ?? Math.round((result.percent / 100) * getTotalPrice());
        setDiscount({ amount, label: result.code || code });
        toast.success("Code promo appliqué");
      } else {
        setDiscount(null);
        toast.error("Code promo invalide");
      }
    } catch (e) {
      setDiscount(null);
      toast.error("Impossible de valider le code promo");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("Vous devez être connecté pour passer une commande.");
      return;
    }

    setIsSubmittingOrder(true); // Activer l'état de chargement
    const orderItems = items.map((item) => ({
      produitId: item.product.id, // Correction de productId en produitId
      quantity: item.quantity,
      price: item.product.price,
    }));

    // Mapper paymentMethod pour target_payment
    let targetPaymentName = "Paiement à la livraison";
    if (paymentMethod === "Orange Money") targetPaymentName = "Orange Money";
    if (paymentMethod === "Wave") targetPaymentName = "Wave";
    if (paymentMethod === "Free Money") targetPaymentName = "Free Money";

    const orderPayload = {
      clientId: user.id,
      total: getTotalPrice(),
      user: {
        phone_number: normalizePhone(formData.phone) || formData.phone,
        first_name: formData.firstName,
        last_name: formData.lastName,
      },
      currency: "XOF",
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: normalizePhone(formData.phone) || formData.phone,
      location: formData.location,
      paymentMethod: paymentMethod,
      items: orderItems,
      promoCode: promoCode?.trim() ? promoCode.trim() : undefined,
    };

    try {
      console.log(orderPayload);
      const creation = await createOrder(
        orderPayload as unknown as Omit<Order, "id" | "createdAt" | "updatedAt">
      );

      toast.success("Commande passée avec succès!");
      if (creation?.redirectUrl) {
        window.location.href = creation.redirectUrl;
      } else if (creation?.paymentUrl) {
        window.location.href = creation.paymentUrl;
      } else if (creation?.data?.data?.paymentUrl) {
        window.location.href = creation.data.data.paymentUrl;
      } else {
        navigate("/payment/status/success");
      }
    } catch (error: unknown) {
      console.error("Erreur lors de la passation de la commande:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Une erreur inattendue est survenue. Veuillez réessayer.";
      toast.error(errorMessage);
    } finally {
      setIsSubmittingOrder(false); // Désactiver l'état de chargement
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Votre panier est vide</h1>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la boutique
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <h1 className="text-2xl font-bold mb-8">Finaliser la commande</h1>

      {user && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">
              Connecté en tant que{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            Vos informations ont été pré-remplies automatiquement
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Adresse de livraison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Téléphone *</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Adresse *</Label>
                  <div className="flex items-center justify-between">
                    {useCurrentLocation ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetToManualEntry}
                      >
                        Saisie manuelle
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                      >
                        {isGettingLocation ? (
                          <Loader size={16} text="" className="mr-2" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-2" />
                        )}
                        {isGettingLocation
                          ? "Localisation en cours..."
                          : "Utiliser ma position actuelle"}
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  name="street"
                  value={
                    useCurrentLocation
                      ? [
                          formData.location.street,
                          formData.location.city,
                          formData.location.postcode,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : formData.location.street || ""
                  }
                  onChange={handleLocationInputChange}
                  required
                  placeholder={
                    useCurrentLocation
                      ? "Adresse complète obtenue automatiquement"
                      : "Entrez votre rue, numéro, ville, code postal"
                  }
                  readOnly={useCurrentLocation}
                  className={
                    useCurrentLocation ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }
                />
                {useCurrentLocation && formData.location.street && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    📍 Adresse obtenue : {formData.location.street},{" "}
                    {formData.location.city}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville *</Label>
                  <Input
                    name="city"
                    value={formData.location.city || ""}
                    onChange={handleLocationInputChange}
                    required
                    placeholder={
                      useCurrentLocation
                        ? "Ville obtenue automatiquement"
                        : "Entrez votre ville"
                    }
                    readOnly={useCurrentLocation}
                    className={
                      useCurrentLocation ? "bg-blue-50 dark:bg-blue-950/20" : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input
                    name="postcode"
                    value={formData.location.postcode || ""}
                    onChange={handleLocationInputChange}
                    placeholder={
                      useCurrentLocation
                        ? "Code postal obtenu automatiquement"
                        : "Entrez votre code postal"
                    }
                    readOnly={useCurrentLocation}
                    className={
                      useCurrentLocation ? "bg-blue-50 dark:bg-blue-950/20" : ""
                    }
                  />
                </div>
              </div>

              {/* Champs cachés pour envoyer les coordonnées exactes */}
              <Input
                type="hidden"
                name="latitude"
                value={formData.location.latitude || ""}
              />
              <Input
                type="hidden"
                name="longitude"
                value={formData.location.longitude || ""}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Méthode de paiement</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v: PaymentMethod) => setPaymentMethod(v)}
              >
                <div className="space-y-4">
                  {[
                    {
                      id: "Orange Money",
                      label: "Orange Money",
                      icon: <Smartphone className="h-5 w-5" />,
                      color: "bg-orange-500",
                    },
                    {
                      id: "Wave",
                      label: "Wave",
                      icon: <Wallet className="h-5 w-5" />,
                      color: "bg-primary",
                    },
                    {
                      id: "Free Money",
                      label: "Free Money",
                      icon: <CreditCard className="h-5 w-5" />,
                      color: "bg-emerald-500",
                    },
                    {
                      id: "cash_on_delivery",
                      label: "Paiement à la livraison",
                      icon: <Truck className="h-5 w-5" />,
                      color: "bg-gray-500",
                    },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center space-x-3 p-4 border rounded-md hover:bg-accent/50"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex items-center space-x-2 cursor-pointer w-full"
                      >
                        <div
                          className={`${method.color} p-2 rounded-md text-white`}
                        >
                          {method.icon}
                        </div>
                        <span>{method.label}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                        {item.product.images?.[0]?.url && (
                          <FallbackImage
                            src={item.product.images[0].url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qté: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Code promo</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Saisir un code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={applyPromo}
                      disabled={isApplyingPromo || !promoCode.trim()}
                    >
                      {isApplyingPromo ? <Loader size={16} text="" className="mr-2" /> : null}
                      Appliquer
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Réduction ({discount.label})</span>
                      <span>-{formatPrice(discount.amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    <span className="text-green-600">Gratuite</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(effectiveTotal)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={isSubmittingOrder}
                >
                  {" "}
                  {/* Désactiver le bouton pendant la soumission */}
                  {isSubmittingOrder ? (
                    <Loader size={16} text="" className="mr-2" />
                  ) : (
                    "Payer maintenant"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  En passant commande, vous acceptez nos conditions générales de
                  vente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
