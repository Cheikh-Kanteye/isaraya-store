import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Brand } from '@/types';
import { Upload, X } from 'lucide-react';
import Loader from '@/components/ui/loader';
import { toast } from 'sonner';

const brandSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  slug: z.string().min(1, 'Le slug est requis').max(100, 'Le slug ne peut pas dépasser 100 caractères'),
  logoUrl: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BrandFormData) => Promise<void>;
  brand?: Brand | null;
  isLoading?: boolean;
}

export const BrandForm: React.FC<BrandFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  brand,
  isLoading = false,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!brand;
  const title = isEditing ? 'Modifier la marque' : 'Nouvelle marque';
  const description = isEditing 
    ? 'Modifiez les informations de la marque' 
    : 'Créez une nouvelle marque pour vos produits';

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
      slug: '',
      logoUrl: '',
    },
  });

  // Réinitialiser le formulaire quand la marque change
  useEffect(() => {
    if (isOpen) {
      if (brand) {
        form.reset({
          name: brand.name,
          slug: brand.slug,
          logoUrl: brand.logoUrl || '',
        });
        setLogoPreview(brand.logoUrl || null);
      } else {
        form.reset({
          name: '',
          slug: '',
          logoUrl: '',
        });
        setLogoPreview(null);
      }
      setLogoFile(null);
    }
  }, [brand, isOpen, form]);

  // Générer automatiquement le slug depuis le nom
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    const slug = generateSlug(value);
    form.setValue('slug', slug);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le logo ne peut pas dépasser 5MB');
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }

      setLogoFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    form.setValue('logoUrl', '');
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (data: BrandFormData) => {
    setIsSubmitting(true);
    try {
      // Ajouter le fichier logo aux données si présent
      const submitData = {
        ...data,
        logoFile: logoFile || null, // Passer le fichier pour upload
      };

      await onSubmit(submitData);
      onClose();
      form.reset();
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <FormLabel>Logo de la marque</FormLabel>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Aperçu du logo"
                      className="w-20 h-20 rounded-md object-cover border bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-md border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    Choisir un logo
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG jusqu'à 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Nom */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la marque *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Nike, Apple, Samsung..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleNameChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="nike, apple, samsung..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL conviviale générée automatiquement depuis le nom
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader size={16} text="" className="mr-2" />}
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};