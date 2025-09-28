import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Settings,
  BarChart3,
  Zap,
  Shield,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

// Composants de notifications marchands
import { MerchantNotificationProvider } from "@/hooks/useMerchantNotifications";
import NotificationsMarchand from "@/components/dashboard/merchant/NotificationsMarchand";
import MerchantNotificationSettings from "@/components/dashboard/merchant/MerchantNotificationSettings";
import MerchantAlerts from "@/components/dashboard/merchant/MerchantAlerts";
import MerchantNotificationSystem from "@/components/dashboard/merchant/MerchantNotificationSystem";

/**
 * Page complète du dashboard des notifications pour les marchands
 * 
 * Cette page intègre tous les composants de notifications marchands :
 * - Système de notifications temps réel
 * - Alertes contextuelles critiques
 * - Centre de notifications avec filtres avancés
 * - Paramètres de notification spécialisés
 * - Statistiques et tableaux de bord
 */
const NotificationsDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <MerchantNotificationProvider enableRealTime refreshInterval={15000}>
      <div className="min-h-screen bg-background">
        {/* Système de notifications temps réel - Wrapper global */}
        <MerchantNotificationSystem enableSound enableDesktop>
          <div className="container mx-auto p-6 space-y-6">
            {/* En-tête de la page */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Bell className="h-8 w-8 text-primary" />
                  Centre de Notifications
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gérez toutes vos notifications business en temps réel
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Temps réel actif
                </Badge>
                <Button variant="outline" onClick={() => setActiveTab("settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Paramètres
                </Button>
              </div>
            </div>

            {/* Alertes contextuelles critiques */}
            <MerchantAlerts />

            {/* Navigation par onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Paramètres
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analyses
                </TabsTrigger>
              </TabsList>

              {/* Onglet Vue d'ensemble */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Alertes rapides */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Alertes Prioritaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="font-semibold text-red-900">Stock critique</span>
                          </div>
                          <p className="text-sm text-red-700">
                            3 produits nécessitent un réapprovisionnement urgent
                          </p>
                        </div>
                        
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="font-semibold text-orange-900">Commandes en attente</span>
                          </div>
                          <p className="text-sm text-orange-700">
                            7 commandes en attente depuis plus de 2h
                          </p>
                        </div>
                        
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-green-900">Performance</span>
                          </div>
                          <p className="text-sm text-green-700">
                            Excellente réactivité aujourd'hui !
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Résumé des notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Activité Notifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Non lues aujourd'hui</span>
                          <Badge variant="destructive">12</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Commandes</span>
                          <Badge>8</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Paiements</span>
                          <Badge>5</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Stock</span>
                          <Badge variant="secondary">3</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Avis clients</span>
                          <Badge variant="secondary">2</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Guide d'utilisation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-500" />
                      Guide des Notifications Business
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">🚨 Notifications Critiques</h3>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Stock en rupture :</strong> Réapprovisionnement immédiat requis</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Paiements échoués :</strong> Contacter le client rapidement</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <span><strong>Commandes urgentes :</strong> Traitement prioritaire requis</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-3">💡 Bonnes Pratiques</h3>
                        <ul className="space-y-2 text-sm">
                          <li>✅ Consultez les notifications critiques dès réception</li>
                          <li>✅ Configurez les alertes SMS pour les paiements</li>
                          <li>✅ Activez les notifications desktop</li>
                          <li>✅ Vérifiez le stock quotidiennement</li>
                          <li>✅ Répondez aux avis clients rapidement</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Onglet Notifications - Composant principal */}
              <TabsContent value="notifications">
                <NotificationsMarchand />
              </TabsContent>

              {/* Onglet Paramètres */}
              <TabsContent value="settings">
                <MerchantNotificationSettings
                  onSettingsUpdate={(settings) => {
                    console.log("Paramètres mis à jour:", settings);
                  }}
                />
              </TabsContent>

              {/* Onglet Analyses */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Performance Cette Semaine</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">98.5%</div>
                      <p className="text-xs text-muted-foreground">
                        Taux de lecture des notifications critiques
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Temps de Réaction Moyen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">4.2 min</div>
                      <p className="text-xs text-muted-foreground">
                        Pour les nouvelles commandes
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Satisfaction Client</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">4.8/5</div>
                      <p className="text-xs text-muted-foreground">
                        Basé sur la réactivité
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Graphique simulé */}
                <Card>
                  <CardHeader>
                    <CardTitle>Évolution des Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Graphique d'analyse des notifications
                        </p>
                        <p className="text-sm text-muted-foreground">
                          (À intégrer avec une bibliothèque de graphiques)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </MerchantNotificationSystem>
      </div>
    </MerchantNotificationProvider>
  );
};

export default NotificationsDashboard;