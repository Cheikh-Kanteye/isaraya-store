import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Save,
  RotateCcw,
  ShoppingCart,
  CreditCard,
  Package,
  Star,
  Truck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useMerchantNotifications } from "@/hooks/useMerchantNotifications";
import type { MerchantNotificationSettings, UpdateNotificationSettingsDto } from "@/types";

interface MerchantNotificationSettingsProps {
  onSettingsUpdate?: (settings: MerchantNotificationSettings) => void;
}

// Configuration par défaut pour les marchands
const defaultMerchantSettings: Partial<MerchantNotificationSettings> = {
  emailNotifications: {
    orders: true,
    payments: true,
    promotions: false,
    system: true,
    reviews: true,
    stock: true,
  },
  pushNotifications: {
    orders: true,
    payments: true,
    promotions: false,
    system: true,
    reviews: true,
    stock: true,
  },
  smsNotifications: {
    orders: false,
    payments: true,
  },
  businessNotifications: {
    newOrders: true,
    orderStatusChanges: true,
    paymentReceived: true,
    paymentFailed: true,
    lowStock: true,
    outOfStock: true,
    newReviews: true,
    customerMessages: false,
    deliveryUpdates: true,
    accountUpdates: true,
  },
  urgencyLevels: {
    criticalAlerts: true,
    businessAlerts: true,
    informationalAlerts: true,
  },
};

export const MerchantNotificationSettings: React.FC<MerchantNotificationSettingsProps> = ({
  onSettingsUpdate,
}) => {
  const { settings, updateSettings, isLoading } = useMerchantNotifications();
  
  const [localSettings, setLocalSettings] = useState<Partial<MerchantNotificationSettings>>(defaultMerchantSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("business");

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        businessNotifications: settings.businessNotifications,
        urgencyLevels: settings.urgencyLevels,
      });
    }
  }, [settings]);

  const handleToggle = (
    category: keyof MerchantNotificationSettings,
    type: string,
    value: boolean
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      setHasChanges(false);
      onSettingsUpdate?.(localSettings as MerchantNotificationSettings);
      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        businessNotifications: settings.businessNotifications,
        urgencyLevels: settings.urgencyLevels,
      });
    } else {
      setLocalSettings(defaultMerchantSettings);
    }
    setHasChanges(false);
  };

  // Configuration des types de notifications business
  const businessNotificationTypes = [
    {
      key: "newOrders",
      label: "Nouvelles commandes",
      description: "Être alerté dès qu'une nouvelle commande arrive",
      icon: ShoppingCart,
      critical: true,
    },
    {
      key: "orderStatusChanges",
      label: "Changements de statut",
      description: "Suivi des mises à jour de statut des commandes",
      icon: Package,
      critical: false,
    },
    {
      key: "paymentReceived",
      label: "Paiements reçus",
      description: "Confirmation des paiements clients",
      icon: CreditCard,
      critical: true,
    },
    {
      key: "paymentFailed",
      label: "Échecs de paiement",
      description: "Alertes pour les paiements échoués",
      icon: AlertTriangle,
      critical: true,
    },
    {
      key: "lowStock",
      label: "Stock faible",
      description: "Alertes lorsque le stock d'un produit devient faible",
      icon: Package,
      critical: true,
    },
    {
      key: "outOfStock",
      label: "Rupture de stock",
      description: "Alertes critiques pour les ruptures de stock",
      icon: AlertTriangle,
      critical: true,
    },
    {
      key: "newReviews",
      label: "Nouveaux avis",
      description: "Notification des nouveaux avis clients",
      icon: Star,
      critical: false,
    },
    {
      key: "customerMessages",
      label: "Messages clients",
      description: "Messages directs des clients",
      icon: MessageSquare,
      critical: false,
    },
    {
      key: "deliveryUpdates",
      label: "Mises à jour livraison",
      description: "Statuts et problèmes de livraison",
      icon: Truck,
      critical: false,
    },
    {
      key: "accountUpdates",
      label: "Mises à jour du compte",
      description: "Modifications importantes du profil marchand",
      icon: Settings,
      critical: true,
    },
  ];

  // Configuration des niveaux d'urgence
  const urgencyLevels = [
    {
      key: "criticalAlerts",
      label: "Alertes critiques",
      description: "Stock critique, paiements échoués, problèmes urgents",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      key: "businessAlerts",
      label: "Alertes business",
      description: "Nouvelles commandes, avis clients, mises à jour importantes",
      icon: Zap,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      key: "informationalAlerts",
      label: "Alertes informatives",
      description: "Mises à jour système, conseils, statistiques",
      icon: Bell,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  const standardNotificationTypes = [
    { key: "orders", label: "Commandes", description: "Toutes les notifications de commandes" },
    { key: "payments", label: "Paiements", description: "Confirmations et problèmes de paiement" },
    { key: "stock", label: "Stock", description: "Alertes de stock et inventaire" },
    { key: "reviews", label: "Avis", description: "Nouveaux avis et évaluations" },
    { key: "system", label: "Système", description: "Mises à jour et maintenance" },
    { key: "promotions", label: "Promotions", description: "Opportunités marketing et promotions" },
  ];

  const renderBusinessNotifications = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        {businessNotificationTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card key={type.key} className={`border transition-colors ${
              localSettings.businessNotifications?.[type.key as keyof typeof localSettings.businessNotifications] 
                ? 'border-green-200 bg-green-50/30' 
                : 'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${type.critical ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <IconComponent className={`w-4 h-4 ${type.critical ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label className="font-medium">{type.label}</Label>
                        {type.critical && (
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            CRITIQUE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.businessNotifications?.[type.key as keyof typeof localSettings.businessNotifications] || false}
                    onCheckedChange={(checked) =>
                      handleToggle("businessNotifications", type.key, checked)
                    }
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderUrgencySettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-yellow-600" />
          <span className="font-medium text-yellow-800">Configuration des priorités</span>
        </div>
        <p className="text-sm text-yellow-700">
          Définissez les types d'alertes que vous souhaitez recevoir selon leur niveau d'urgence.
          Les alertes critiques sont fortement recommandées pour votre activité.
        </p>
      </div>

      <div className="grid gap-4">
        {urgencyLevels.map((level) => {
          const IconComponent = level.icon;
          return (
            <Card key={level.key} className={`border transition-colors ${
              localSettings.urgencyLevels?.[level.key as keyof typeof localSettings.urgencyLevels] 
                ? 'border-green-200 bg-green-50/30' 
                : 'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={level.bgColor + ' p-2 rounded-lg'}>
                      <IconComponent className={`w-5 h-5 ${level.color}`} />
                    </div>
                    <div>
                      <Label className="font-medium">{level.label}</Label>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={localSettings.urgencyLevels?.[level.key as keyof typeof localSettings.urgencyLevels] || false}
                    onCheckedChange={(checked) =>
                      handleToggle("urgencyLevels", level.key, checked)
                    }
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStandardNotifications = () => (
    <div className="space-y-6">
      {/* En-têtes des colonnes */}
      <div className="grid grid-cols-4 gap-4 pb-2 border-b">
        <div className="font-medium">Type de notification</div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Push</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">SMS</span>
          </div>
        </div>
      </div>

      {/* Lignes de paramètres */}
      {standardNotificationTypes.map((type) => (
        <div key={type.key} className="grid grid-cols-4 gap-4 items-center">
          <div>
            <Label className="text-base font-medium">{type.label}</Label>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </div>
          
          {/* Email */}
          <div className="flex justify-center">
            <Switch
              checked={localSettings.emailNotifications?.[type.key as keyof typeof localSettings.emailNotifications] || false}
              onCheckedChange={(checked) =>
                handleToggle("emailNotifications", type.key, checked)
              }
              disabled={isLoading}
            />
          </div>

          {/* Push */}
          <div className="flex justify-center">
            <Switch
              checked={localSettings.pushNotifications?.[type.key as keyof typeof localSettings.pushNotifications] || false}
              onCheckedChange={(checked) =>
                handleToggle("pushNotifications", type.key, checked)
              }
              disabled={isLoading}
            />
          </div>

          {/* SMS */}
          <div className="flex justify-center">
            {type.key === "orders" || type.key === "payments" ? (
              <Switch
                checked={localSettings.smsNotifications?.[type.key as keyof typeof localSettings.smsNotifications] || false}
                onCheckedChange={(checked) =>
                  handleToggle("smsNotifications", type.key, checked)
                }
                disabled={isLoading}
              />
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (isLoading && !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Paramètres de notifications marchands
              {hasChanges && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Modifications en attente
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configurez vos préférences de notification pour optimiser votre gestion business
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="urgency">Priorités</TabsTrigger>
            <TabsTrigger value="channels">Canaux</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="mt-6">
            {renderBusinessNotifications()}
          </TabsContent>

          <TabsContent value="urgency" className="mt-6">
            {renderUrgencySettings()}
          </TabsContent>

          <TabsContent value="channels" className="mt-6">
            {renderStandardNotifications()}
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>

        {/* Info supplémentaire */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 Conseils pour les marchands :</p>
          <ul className="space-y-1">
            <li>• Les notifications de nouvelles commandes et paiements échoués sont critiques pour votre business</li>
            <li>• Les alertes de stock vous permettent d'éviter les ruptures et de maintenir vos ventes</li>
            <li>• Les SMS pour les paiements offrent une sécurité supplémentaire pour vos transactions</li>
            <li>• Les notifications d'avis vous aident à maintenir une bonne réputation client</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MerchantNotificationSettings;