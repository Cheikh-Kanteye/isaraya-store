import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores";
import { apiService } from "@/services/api";
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
import {
  Settings,
  Mail,
  Smartphone,
  MessageSquare,
  Bell,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { NotificationSettings, UpdateNotificationSettingsDto } from "@/types";

interface NotificationSettingsProps {
  userId?: string;
  onSettingsUpdate?: (settings: NotificationSettings) => void;
}

const defaultSettings: Partial<NotificationSettings> = {
  emailNotifications: {
    orders: true,
    payments: true,
    promotions: false,
    system: true,
    reviews: false,
    stock: false,
  },
  pushNotifications: {
    orders: true,
    payments: true,
    promotions: false,
    system: true,
    reviews: false,
    stock: false,
  },
  smsNotifications: {
    orders: false,
    payments: true,
  },
};

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId: propUserId,
  onSettingsUpdate,
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = propUserId || user?.id;

  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = useQuery<NotificationSettings | null>({
    queryKey: ["notificationSettings", userId],
    queryFn: () => apiService.notifications.getSettings(userId!),
    enabled: !!userId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: UpdateNotificationSettingsDto) =>
      apiService.notifications.updateSettings(userId!, data),
    onSuccess: (updatedSettings) => {
      if (updatedSettings) {
        queryClient.setQueryData(["notificationSettings", userId], updatedSettings);
        setLocalSettings({
          emailNotifications: updatedSettings.emailNotifications,
          pushNotifications: updatedSettings.pushNotifications,
          smsNotifications: updatedSettings.smsNotifications,
        });
        setHasChanges(false);
        onSettingsUpdate?.(updatedSettings);
        toast.success("Paramètres de notification mis à jour");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des paramètres");
    },
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
      });
    }
  }, [settings]);

  const handleToggle = (
    category: keyof UpdateNotificationSettingsDto,
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

  const handleSave = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings({
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
      });
    } else {
      setLocalSettings(defaultSettings);
    }
    setHasChanges(false);
  };

  const notificationTypes = [
    { key: "orders", label: "Commandes", description: "Confirmations, statuts, livraisons" },
    { key: "payments", label: "Paiements", description: "Confirmations de paiement, échecs" },
    { key: "promotions", label: "Promotions", description: "Offres spéciales, codes de réduction" },
    { key: "system", label: "Système", description: "Maintenance, mises à jour importantes" },
    { key: "reviews", label: "Avis", description: "Nouveaux avis sur vos produits" },
    { key: "stock", label: "Stock", description: "Alertes de stock faible" },
  ];

  if (isLoading) {
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
              Paramètres de notifications
            </CardTitle>
            <CardDescription>
              Gérez vos préférences de notification pour chaque type d'événement
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Modifications en attente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
        {notificationTypes.map((type) => (
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
                disabled={updateSettingsMutation.isPending}
              />
            </div>

            {/* Push */}
            <div className="flex justify-center">
              <Switch
                checked={localSettings.pushNotifications?.[type.key as keyof typeof localSettings.pushNotifications] || false}
                onCheckedChange={(checked) =>
                  handleToggle("pushNotifications", type.key, checked)
                }
                disabled={updateSettingsMutation.isPending}
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
                  disabled={updateSettingsMutation.isPending}
                />
              ) : (
                <span className="text-muted-foreground text-xs">N/A</span>
              )}
            </div>
          </div>
        ))}

        <Separator />

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || updateSettingsMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? (
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
          <p className="font-medium mb-1">💡 Conseils :</p>
          <ul className="space-y-1">
            <li>• Les notifications de paiement par SMS sont recommandées pour la sécurité</li>
            <li>• Les notifications système vous tiennent informé des maintenances</li>
            <li>• Vous pouvez désactiver les promotions si vous en recevez trop</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;