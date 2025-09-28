import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, MapPin, CreditCard, Shield, Camera } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import { RefreshButton } from "@/components/dashboard/shared/RefreshButton";
import { normalizePhone } from "@/lib/phone";

const profileSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
  bio: z
    .string()
    .max(500, "La bio ne peut pas dépasser 500 caractères")
    .optional(),
});

const addressSchema = z.object({
  street: z.string().min(5, "Adresse complète requise"),
  city: z.string().min(2, "Ville requise"),
  postalCode: z.string().min(5, "Code postal invalide"),
  country: z.string().min(2, "Pays requis"),
  isDefault: z.boolean().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().min(6, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { user, setUser, getCurrentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const res = await apiService.images.upload(file, "profiles");
      await apiService.users.updateProfile({ avatarUrl: res.url });
      setUser({ ...user!, avatarUrl: res.url });
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error("Échec du téléchargement de la photo");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const [addresses, setAddresses] = useState([
    {
      id: "1",
      street: "123 Rue de la République",
      city: "Dakar",
      postalCode: "12000",
      country: "Sénégal",
      isDefault: true,
    },
  ]);

  // Mutation pour mettre à jour le profil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return apiService.users.updateProfile(data);
    },
    onSuccess: (updatedUser: import("@/types").User) => {
      setUser({ ...(user as import("@/types").User)!, ...updatedUser });
      setIsEditing(false);
      toast.success("Profil mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
    onError: (error: Error) => {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error?.message || "Erreur lors de la mise à jour du profil");
    },
  });

  // Mutation pour changer le mot de passe
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      // Simuler l'API de changement de mot de passe
      // Dans un vrai projet, ceci appellerait apiService.auth.changePassword(data)
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Mot de passe mis à jour avec succès !");
    },
    onError: (error: Error) => {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast.error(error?.message || "Erreur lors du changement de mot de passe");
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "", // Safe access
      lastName: user?.lastName || "",   // Safe access
      email: user?.email || "",
      phone: user?.phone || "",
      bio: "",
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: "",
      city: "",
      postalCode: "",
      country: "Sénégal",
      isDefault: false,
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  if (!user) {
    return <div>Vous devez être connecté pour accéder à cette page.</div>;
  }

  const onSubmitProfile = (data: ProfileForm) => {
    const normalized = normalizePhone(data.phone) || data.phone;
    updateProfileMutation.mutate({ ...data, phone: normalized });
  };

  const onSubmitAddress = async (data: AddressForm) => {
    try {
      // Simulation d'ajout d'adresse
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newAddress = {
        id: Date.now().toString(),
        street: data.street,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        isDefault: data.isDefault || false,
      };
      setAddresses((prev) => [...prev, newAddress]);
      addressForm.reset();
      toast.success("Adresse ajoutée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de l'adresse");
    }
  };

  const onSubmitPassword = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
    toast.success("Adresse supprimée");
  };

  const handleSetDefaultAddress = (addressId: string) => {
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === addressId,
      }))
    );
    toast.success("Adresse par défaut mise à jour");
  };

  // Fonction pour rafraîchir les données du profil
  const handleRefresh = async () => {
    try {
      const refreshedUser = await getCurrentUser();
      if (refreshedUser) {
        // Mettre à jour les valeurs du formulaire avec les nouvelles données
        profileForm.reset({
          firstName: refreshedUser.firstName,
          lastName: refreshedUser.lastName,
          email: refreshedUser.email,
          phone: refreshedUser.phone,
          bio: "", // La bio n'est pas dans le type User actuel
        });
        toast.success("Profil actualisé");
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error("Erreur lors de l'actualisation du profil");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="addresses">Adresses</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Gérez vos informations de profil et vos préférences
                </CardDescription>
              </div>
              <RefreshButton
                onRefresh={handleRefresh}
                size="sm"
                variant="outline"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="text-lg">
                    {user.firstName[0]} // Corrected from user.firstname[0]
                    {user.lastName[0]}  // Corrected from user.lastname[0]
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (document.getElementById("avatar-upload") as HTMLInputElement)?.click()}
                    disabled={isUploadingAvatar}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploadingAvatar ? "Téléchargement..." : "Changer la photo"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG ou GIF. Taille maximale 5MB.
                  </p>
                </div>
              </div>

              {/* Formulaire */}
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Parlez-nous de vous..."
                            className="min-h-[100px]"
                            {...field}
                            disabled={!isEditing}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    {!isEditing ? (
                      <Button type="button" onClick={() => setIsEditing(true)}>
                        <User className="h-4 w-4 mr-2" />
                        Modifier le profil
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          disabled={profileForm.formState.isSubmitting}
                        >
                          {profileForm.formState.isSubmitting
                            ? "Enregistrement..."
                            : "Enregistrer"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Annuler
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <div className="space-y-6">
            {/* Adresses existantes */}
            <Card>
              <CardHeader>
                <CardTitle>Mes adresses</CardTitle>
                <CardDescription>
                  Gérez vos adresses de livraison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <Card key={address.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{address.street}</p>
                                {address.isDefault && (
                                  <Badge variant="secondary">Par défaut</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.postalCode}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.country}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!address.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSetDefaultAddress(address.id)
                                }
                              >
                                Définir par défaut
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ajouter une nouvelle adresse */}
            <Card>
              <CardHeader>
                <CardTitle>Ajouter une nouvelle adresse</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...addressForm}>
                  <form
                    onSubmit={addressForm.handleSubmit(onSubmitAddress)}
                    className="space-y-4"
                  >
                    <FormField
                      control={addressForm.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse complète</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123 Rue de la République"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ville</FormLabel>
                            <FormControl>
                              <Input placeholder="Dakar" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Code postal</FormLabel>
                            <FormControl>
                              <Input placeholder="12000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={addressForm.formState.isSubmitting}
                    >
                      {addressForm.formState.isSubmitting
                        ? "Ajout..."
                        : "Ajouter l'adresse"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez votre mot de passe et les paramètres de sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {passwordForm.formState.isSubmitting
                      ? "Mise à jour..."
                      : "Changer le mot de passe"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Préférences</CardTitle>
              <CardDescription>
                Personnalisez votre expérience sur Isaraya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Notifications par email</p>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des notifications sur vos commandes par email
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Activé
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Promotions et offres</p>
                        <p className="text-sm text-muted-foreground">
                          Recevoir des informations sur les promotions
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Activé
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Langue et région</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Langue</p>
                        <p className="text-sm text-muted-foreground">
                          Français
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Devise</p>
                        <p className="text-sm text-muted-foreground">
                          Franc CFA (XOF)
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
