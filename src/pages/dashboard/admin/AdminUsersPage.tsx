import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Trash2,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  User,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { useAdminUsers, useUsersStats, useToggleUserStatus, useDeleteUser, type AdminUsersFilters } from '@/hooks/useAdminUsers';
import MerchantProfileValidation from '@/components/admin/MerchantProfileValidation';
import type { MerchantProfile } from '@/types';

const AdminUsersPage: React.FC = () => {
  const [filters, setFilters] = useState<AdminUsersFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<MerchantProfile | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToToggle, setUserToToggle] = useState<{ id: string; isActive: boolean } | null>(null);

  // Hooks
  const { data: users = [], isLoading, error, refetch } = useAdminUsers({
    ...filters,
    search: searchTerm,
  });
  const { data: stats } = useUsersStats();
  const toggleUserMutation = useToggleUserStatus();
  const deleteUserMutation = useDeleteUser();

  // Filtrage et recherche
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = `${user.firstName} ${user.lastName}`.toLowerCase().includes(search);
        const matchesEmail = user.email.toLowerCase().includes(search);
        const matchesBusiness = user.merchantProfile?.businessName?.toLowerCase().includes(search);
        
        if (!matchesName && !matchesEmail && !matchesBusiness) {
          return false;
        }
      }
      
      return true;
    });
  }, [users, searchTerm]);

  // Helpers
  const getUserRole = (user: typeof users[0]) => {
    if (user.roles.some(r => r.name === 'ADMIN')) return 'ADMIN';
    if (user.roles.some(r => r.name === 'MERCHANT')) return 'MERCHANT';
    return 'CLIENT';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MERCHANT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getMerchantStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getMerchantStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-3 w-3" />;
      case 'REJECTED':
        return <XCircle className="h-3 w-3" />;
      case 'SUSPENDED':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Actions
  const handleViewMerchantProfile = (profile: MerchantProfile, user?: typeof users[0]) => {
    // DEBUG: Console log pour voir les données disponibles
    console.log('=== ADMIN HANDLEVIEWMERCHANTPROFILE DEBUG ===');
    console.log('Original merchant profile:', profile);
    console.log('Associated user:', user);
    
    // Créer un profil marchand enrichi avec les données utilisateur
    const enrichedProfile: MerchantProfile = {
      ...profile,
      // Si les données utilisateur ne sont pas dans le profile, les ajouter depuis user
      user: profile.user || (user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || null,
      } : undefined),
      // S'assurer que userId est défini
      userId: profile.userId || user?.id,
    };
    
    console.log('Enriched profile sent to modal:', enrichedProfile);
    console.log('===============================================');
    
    setSelectedProfile(enrichedProfile);
    setShowProfileDialog(true);
  };

  const handleToggleUserStatus = async () => {
    if (!userToToggle) return;

    try {
      await toggleUserMutation.mutateAsync({
        userId: userToToggle.id,
        isActive: userToToggle.isActive,
      });
      setUserToToggle(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(userToDelete);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleFilterChange = (key: keyof AdminUsersFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        </div>
        <Card className="text-center py-8">
          <CardContent>
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Erreur de chargement</p>
            <p className="text-muted-foreground mb-4">
              Impossible de charger la liste des utilisateurs
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-700">
      {/* Header */}
      <div className="animate-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestion des utilisateurs
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les utilisateurs, leurs rôles et validez les profils marchands
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">
                {stats.active} actifs • {stats.inactive} inactifs
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clients}</div>
              <div className="text-xs text-muted-foreground">Utilisateurs clients</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Marchands</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.merchants}</div>
              <div className="text-xs text-muted-foreground">
                {stats.merchantProfiles.approved} approuvés • {stats.merchantProfiles.pending} en attente
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profils en attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.merchantProfiles.pending}
              </div>
              <div className="text-xs text-muted-foreground">À valider</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card className="animate-in slide-in-from-bottom-4 duration-700 delay-300">
        <CardHeader>
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="CLIENT">Clients</SelectItem>
                <SelectItem value="MERCHANT">Marchands</SelectItem>
                <SelectItem value="ADMIN">Administrateurs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.merchantStatus || 'all'} 
              onValueChange={(value) => handleFilterChange('merchantStatus', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut marchand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="APPROVED">Approuvés</SelectItem>
                <SelectItem value="REJECTED">Rejetés</SelectItem>
                <SelectItem value="SUSPENDED">Suspendus</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card className="animate-in slide-in-from-bottom-4 duration-700 delay-400">
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des utilisateurs...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Aucun utilisateur trouvé</p>
              <p className="text-muted-foreground">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Profil marchand</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const role = getUserRole(user);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-muted-foreground">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={`${getRoleColor(role)} flex items-center gap-1 w-fit`}>
                            {role === 'ADMIN' && <Shield className="h-3 w-3" />}
                            {role === 'MERCHANT' && <Store className="h-3 w-3" />}
                            {role === 'CLIENT' && <User className="h-3 w-3" />}
                            {role}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge className={`${getStatusColor(user.isActive)} flex items-center gap-1 w-fit`}>
                            {user.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {user.merchantProfile ? (
                            <div className="space-y-1">
                              <Badge className={`${getMerchantStatusColor(user.merchantProfile.status)} flex items-center gap-1 w-fit`}>
                                {getMerchantStatusIcon(user.merchantProfile.status)}
                                {user.merchantProfile.status === 'PENDING' && 'En attente'}
                                {user.merchantProfile.status === 'APPROVED' && 'Approuvé'}
                                {user.merchantProfile.status === 'REJECTED' && 'Rejeté'}
                                {user.merchantProfile.status === 'SUSPENDED' && 'Suspendu'}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {user.merchantProfile.businessName}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(user.createdAt), 'HH:mm', { locale: fr })}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              
                              {user.merchantProfile && (
                                <DropdownMenuItem
                                  onClick={() => handleViewMerchantProfile(user.merchantProfile!, user)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir profil marchand
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setUserToToggle({ 
                                  id: user.id, 
                                  isActive: !user.isActive 
                                })}
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspendre
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Réactiver
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => setUserToDelete(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de validation du profil marchand */}
      {selectedProfile && (
        <MerchantProfileValidation
          profile={selectedProfile}
          isOpen={showProfileDialog}
          onClose={() => {
            setShowProfileDialog(false);
            setSelectedProfile(null);
          }}
        />
      )}

      {/* Dialog de confirmation pour changer le statut */}
      <AlertDialog open={!!userToToggle} onOpenChange={() => setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isActive ? 'Réactiver' : 'Suspendre'} l'utilisateur
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir {userToToggle?.isActive ? 'réactiver' : 'suspendre'} cet utilisateur ?
              {!userToToggle?.isActive && ' L\'utilisateur ne pourra plus se connecter à son compte.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleUserMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleUserStatus}
              disabled={toggleUserMutation.isPending}
            >
              {toggleUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {userToToggle?.isActive ? 'Réactiver' : 'Suspendre'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation pour supprimer */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera
              toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersPage;