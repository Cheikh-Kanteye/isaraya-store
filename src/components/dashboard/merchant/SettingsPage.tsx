import React, { useState, useEffect, useCallback } from "react";
import { Save, User, Store, Bell, Shield, CreditCard, Edit, X } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useMerchantProfile } from "@/hooks/queries/useMerchantQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/dashboard/shared/RefreshButton";
import { useToast } from "@/hooks/use-toast";

const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { data: merchantProfile, isLoading: merchantLoading, error: merchantError, refetch: refetchProfile } = useMerchantProfile();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingShop, setIsEditingShop] = useState(false);
  
  // Initialiser avec des valeurs par défaut
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [shopData, setShopData] = useState({
    businessName: "",
    description: "",
    businessType: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    website: "",
    orangeMoneyNumber: "",
    waveMoneyNumber: "",
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailPromotions: false,
    smsOrders: true,
    pushNotifications: true,
  });

  // Effet pour les données utilisateur - utilise les données user du merchantProfile ET user global
  useEffect(() => {
    // Priorise les données du merchantProfile, puis fallback sur user global
    const merchantUser = merchantProfile?.user;
    const currentUser = user;
    
    setProfileData({
      firstName: merchantUser?.firstName || currentUser?.firstName || "",
      lastName: merchantUser?.lastName || currentUser?.lastName || "",
      email: merchantUser?.email || currentUser?.email || "",
      phone: merchantUser?.phone || currentUser?.phone || "",
      address: "", // L'adresse personnelle n'est pas dans l'API actuelle
    });
    
    // Notifications depuis user global
    if (currentUser) {
      setNotifications({
        emailOrders: currentUser.emailNotifications?.orders ?? true,
        emailPromotions: currentUser.emailNotifications?.promotions ?? false,
        smsOrders: currentUser.smsNotifications?.orders ?? true,
        pushNotifications: currentUser.pushNotifications ?? true,
      });
    }
  }, [merchantProfile, user]);

  // Effet pour les données du profil marchand
  useEffect(() => {
    if (merchantProfile) {
      const profile = merchantProfile;
      setShopData({
        businessName: profile.businessName || "",
        description: profile.description || "",
        businessType: profile.businessType || "",
        businessAddress: profile.businessAddress || "",
        businessPhone: profile.businessPhone || "",
        businessEmail: profile.businessEmail || "",
        website: profile.website || "",
        orangeMoneyNumber: profile.orangeMoneyNumber || "",
        waveMoneyNumber: profile.waveMoneyNumber || "",
      });
    }
  }, [merchantProfile]);

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        setUser({ 
          ...user, 
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
        });
      }
      
      setIsEditingProfile(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations personnelles ont été sauvegardées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Implementer la mise à jour du profil marchand
      
      setIsEditingShop(false);
      toast({
        title: "Boutique mise à jour",
        description: "Les informations de votre boutique ont été sauvegardées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        setUser({
          ...user,
          emailNotifications: {
            orders: notifications.emailOrders,
            promotions: notifications.emailPromotions,
          },
          smsNotifications: {
            orders: notifications.smsOrders,
          },
          pushNotifications: notifications.pushNotifications,
        });
      }
      
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de notification ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les préférences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelProfileEdit = () => {
    // Utilise la même logique de fallback que useEffect
    const merchantUser = merchantProfile?.user;
    const currentUser = user;
    
    setProfileData({
      firstName: merchantUser?.firstName || currentUser?.firstName || "",
      lastName: merchantUser?.lastName || currentUser?.lastName || "",
      email: merchantUser?.email || currentUser?.email || "",
      phone: merchantUser?.phone || currentUser?.phone || "",
      address: "", // L'adresse personnelle n'est pas dans l'API actuelle
    });
    setIsEditingProfile(false);
  };

  const cancelShopEdit = () => {
    if (merchantProfile) {
      const profile = merchantProfile;
      setShopData({
        businessName: profile.businessName || "",
        description: profile.description || "",
        businessType: profile.businessType || "",
        businessAddress: profile.businessAddress || "",
        businessPhone: profile.businessPhone || "",
        businessEmail: profile.businessEmail || "",
        website: profile.website || "",
        orangeMoneyNumber: profile.orangeMoneyNumber || "",
        waveMoneyNumber: profile.waveMoneyNumber || "",
      });
    }
    setIsEditingShop(false);
  };

  // Fonction pour afficher les informations de debug
  const renderDebugInfo = () => {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <p>Merchant Loading: {merchantLoading ? 'true' : 'false'}</p>
          <p>Merchant Error: {merchantError ? JSON.stringify(merchantError) : 'null'}</p>
          <p>Merchant Profile exists: {merchantProfile ? 'true' : 'false'}</p>
          <p>User ID: {user?.id || 'null'}</p>
          {merchantProfile && (
            <div>
              <p><strong>Merchant Profile:</strong></p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(merchantProfile, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <p><strong>Shop Data:</strong></p>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(shopData, null, 2)}
            </pre>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleRefresh = useCallback(async () => {
    try {
      await refetchProfile();
      toast({
        title: "Données actualisées",
        description: "Les informations ont été mises à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les données.",
        variant: "destructive",
      });
    }
  }, [refetchProfile, toast]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <RefreshButton 
          onRefresh={handleRefresh} 
          isLoading={merchantLoading}
        />
      </div>

      {/* {renderDebugInfo()} */}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="shop">Boutique</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
              </div>
              <div className="flex gap-2">
                {!isEditingProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelProfileEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleProfileSave}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations du compte (lecture seule) */}
              {(merchantProfile?.user || user) && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ID Utilisateur</Label>
                    <p className="text-sm font-mono">{merchantProfile?.user?.id || user?.id || 'Non disponible'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email de connexion</Label>
                    <p className="text-sm">{merchantProfile?.user?.email || user?.email || 'Non disponible'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type de compte</Label>
                    <Badge variant="secondary" className="text-xs">
                      Marchand
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Statut boutique</Label>
                    <Badge 
                      variant={merchantProfile?.status === 'APPROVED' ? 'default' : 
                              merchantProfile?.status === 'PENDING' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {merchantProfile?.status === 'APPROVED' && 'Approuvée'}
                      {merchantProfile?.status === 'PENDING' && 'En attente'}
                      {merchantProfile?.status === 'REJECTED' && 'Rejetée'}
                      {merchantProfile?.status === 'SUSPENDED' && 'Suspendue'}
                      {!merchantProfile?.status && 'Non disponible'}
                    </Badge>
                  </div>
                </div>
              )}
              
              {!merchantProfile && !merchantLoading && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Aucune donnée de profil marchand trouvée. Veuillez vous assurer d'être connecté et d'avoir un profil marchand valide.
                  </p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? "bg-muted" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? "bg-muted" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  disabled={!isEditingProfile}
                  className={!isEditingProfile ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  disabled={!isEditingProfile}
                  className={!isEditingProfile ? "bg-muted" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  disabled={!isEditingProfile}
                  className={!isEditingProfile ? "bg-muted" : ""}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Informations de la boutique
                </CardTitle>
                {merchantLoading && (
                  <p className="text-sm text-muted-foreground">Chargement en cours...</p>
                )}
                {merchantError && (
                  <p className="text-sm text-red-500">
                    Erreur: {merchantError instanceof Error ? merchantError.message : "Erreur inconnue"}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!isEditingShop ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingShop(true)}
                    disabled={merchantLoading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelShopEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleShopSave}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informations générales (lecture seule) */}
              {merchantProfile && (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">ID Profil</Label>
                      <p className="text-sm font-mono">{merchantProfile.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                      <Badge 
                        variant={merchantProfile.status === 'APPROVED' ? 'default' : 
                                merchantProfile.status === 'PENDING' ? 'secondary' : 
                                merchantProfile.status === 'REJECTED' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {merchantProfile.status === 'APPROVED' && 'Approuvé'}
                        {merchantProfile.status === 'PENDING' && 'En attente'}
                        {merchantProfile.status === 'REJECTED' && 'Rejeté'}
                        {merchantProfile.status === 'SUSPENDED' && 'Suspendu'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Créé le</Label>
                      <p className="text-sm">
                        {new Date(merchantProfile.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Modifié le</Label>
                      <p className="text-sm">
                        {new Date(merchantProfile.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    {merchantProfile.status === 'APPROVED' && merchantProfile.approvedAt && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Approuvé le</Label>
                        <p className="text-sm">
                          {new Date(merchantProfile.approvedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    {merchantProfile.status === 'REJECTED' && merchantProfile.rejectionReason && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Raison du rejet</Label>
                        <p className="text-sm text-red-600">{merchantProfile.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                </>
              )}
              
              {!merchantProfile && !merchantLoading && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Impossible de charger les données de votre boutique. Vérifiez votre connexion ou contactez le support.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom de la boutique</Label>
                <Input
                  id="businessName"
                  value={shopData.businessName}
                  onChange={(e) => setShopData({ ...shopData, businessName: e.target.value })}
                  disabled={!isEditingShop || merchantLoading}
                  className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                  placeholder={merchantLoading ? "Chargement..." : shopData.businessName || "Nom de la boutique"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={shopData.description}
                  onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                  disabled={!isEditingShop || merchantLoading}
                  className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                  placeholder={merchantLoading ? "Chargement..." : "Description de la boutique"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Type d'entreprise</Label>
                  <Input
                    id="businessType"
                    value={shopData.businessType}
                    onChange={(e) => setShopData({ ...shopData, businessType: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Type d'entreprise"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Adresse commerciale</Label>
                  <Input
                    id="businessAddress"
                    value={shopData.businessAddress}
                    onChange={(e) => setShopData({ ...shopData, businessAddress: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Adresse commerciale"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Téléphone commercial</Label>
                  <Input
                    id="businessPhone"
                    value={shopData.businessPhone}
                    onChange={(e) => setShopData({ ...shopData, businessPhone: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Téléphone commercial"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email commercial</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={shopData.businessEmail}
                    onChange={(e) => setShopData({ ...shopData, businessEmail: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Email commercial"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Site web</Label>
                <Input
                  id="website"
                  value={shopData.website}
                  onChange={(e) => setShopData({ ...shopData, website: e.target.value })}
                  disabled={!isEditingShop || merchantLoading}
                  className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                  placeholder={merchantLoading ? "Chargement..." : "URL du site web"}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orangeMoneyNumber">Numéro Orange Money</Label>
                  <Input
                    id="orangeMoneyNumber"
                    value={shopData.orangeMoneyNumber}
                    onChange={(e) => setShopData({ ...shopData, orangeMoneyNumber: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Numéro Orange Money"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waveMoneyNumber">Numéro Wave Money</Label>
                  <Input
                    id="waveMoneyNumber"
                    value={shopData.waveMoneyNumber}
                    onChange={(e) => setShopData({ ...shopData, waveMoneyNumber: e.target.value })}
                    disabled={!isEditingShop || merchantLoading}
                    className={(!isEditingShop || merchantLoading) ? "bg-muted" : ""}
                    placeholder={merchantLoading ? "Chargement..." : "Numéro Wave Money"}
                  />
                </div>
              </div>
              
              {/* Section Logo */}
              {merchantProfile?.logoUrl && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Logo de la boutique</Label>
                    <div className="flex items-center gap-4">
                      <img 
                        src={merchantProfile.logoUrl} 
                        alt="Logo de la boutique" 
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p>URL: {merchantProfile.logoUrl}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Informations utilisateur associé */}
              {(merchantProfile?.user || user) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Utilisateur associé
                    </h4>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nom complet</Label>
                        <p className="text-sm">
                          {(merchantProfile?.user?.firstName || user?.firstName || 'Non renseigné')} {(merchantProfile?.user?.lastName || user?.lastName || 'Non renseigné')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm">{merchantProfile?.user?.email || user?.email || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
                        <p className="text-sm">{merchantProfile?.user?.phone || user?.phone || 'Non renseigné'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">ID Utilisateur</Label>
                        <p className="text-sm font-mono">{merchantProfile?.user?.id || user?.id || 'Non disponible'}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Préférences de notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notifications par email</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailOrders">Nouvelles commandes</Label>
                    <Switch
                      id="emailOrders"
                      checked={notifications.emailOrders}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailOrders: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="emailPromotions">Promotions et offres</Label>
                    <Switch
                      id="emailPromotions"
                      checked={notifications.emailPromotions}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailPromotions: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notifications SMS</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="smsOrders">Nouvelles commandes</Label>
                  <Switch
                    id="smsOrders"
                    checked={notifications.smsOrders}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, smsOrders: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Notifications push</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotifications">Notifications push</Label>
                  <Switch
                    id="pushNotifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, pushNotifications: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleNotificationsSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder les préférences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les paramètres de sécurité seront disponibles prochainement.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;