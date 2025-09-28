import { useCallback, useEffect, useState } from 'react';
import { syncService } from '@/services/meilisearchSync';
import { useMeilisearchStore } from '@/stores/meilisearchStore';
import { toast } from 'sonner';

interface SyncTestResult {
  success: boolean;
  message: string;
  duration: number;
}

interface UseMeilisearchSyncReturn {
  testProductSync: (productId: string) => Promise<SyncTestResult>;
  testCategorySync: (categoryId: string) => Promise<SyncTestResult>;
  testFullSync: () => Promise<SyncTestResult>;
  isAutoSyncEnabled: boolean;
  toggleAutoSync: () => void;
}

export function useMeilisearchSync(): UseMeilisearchSyncReturn {
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const { isIndexReady, initialize } = useMeilisearchStore();

  // Initialiser Meilisearch si ce n'est pas déjà fait
  useEffect(() => {
    if (!isIndexReady) {
      initialize().catch(error => {
        console.error('Failed to initialize Meilisearch:', error);
      });
    }
  }, [isIndexReady, initialize]);

  const testProductSync = useCallback(async (productId: string): Promise<SyncTestResult> => {
    const startTime = Date.now();
    
    try {
      // Simuler une synchronisation de produit
      console.log(`Testing product sync for ID: ${productId}`);
      
      // Pour tester, nous pouvons récupérer un produit et le resynchroniser
      const { apiService } = await import('@/services/api');
      const product = await apiService.products.get(productId);
      
      await syncService.onProductUpdate(product);
      
      const duration = Date.now() - startTime;
      const result = {
        success: true,
        message: `Product ${productId} synchronized successfully`,
        duration
      };
      
      toast.success(`Produit ${productId} synchronisé en ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        message: `Failed to sync product ${productId}: ${error}`,
        duration
      };
      
      toast.error(`Erreur de synchronisation: ${error}`);
      console.error('Product sync test failed:', error);
      return result;
    }
  }, []);

  const testCategorySync = useCallback(async (categoryId: string): Promise<SyncTestResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`Testing category sync for ID: ${categoryId}`);
      
      const { apiService } = await import('@/services/api');
      const category = await apiService.categories.get(categoryId);
      
      await syncService.onCategoryUpdate(category);
      
      const duration = Date.now() - startTime;
      const result = {
        success: true,
        message: `Category ${categoryId} synchronized successfully`,
        duration
      };
      
      toast.success(`Catégorie ${categoryId} synchronisée en ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        message: `Failed to sync category ${categoryId}: ${error}`,
        duration
      };
      
      toast.error(`Erreur de synchronisation: ${error}`);
      console.error('Category sync test failed:', error);
      return result;
    }
  }, []);

  const testFullSync = useCallback(async (): Promise<SyncTestResult> => {
    const startTime = Date.now();
    
    try {
      console.log('Testing full synchronization...');
      
      await syncService.fullResync();
      
      const duration = Date.now() - startTime;
      const result = {
        success: true,
        message: 'Full synchronization completed successfully',
        duration
      };
      
      toast.success(`Synchronisation complète terminée en ${Math.round(duration / 1000)}s`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        message: `Full synchronization failed: ${error}`,
        duration
      };
      
      toast.error(`Erreur de synchronisation complète: ${error}`);
      console.error('Full sync test failed:', error);
      return result;
    }
  }, []);

  const toggleAutoSync = useCallback(() => {
    setIsAutoSyncEnabled(prev => {
      const newValue = !prev;
      
      if (newValue) {
        toast.success('Synchronisation automatique activée');
      } else {
        toast.warning('Synchronisation automatique désactivée');
      }
      
      // Sauvegarder la préférence dans localStorage
      localStorage.setItem('meilisearch-auto-sync', JSON.stringify(newValue));
      
      return newValue;
    });
  }, []);

  // Restaurer la préférence au chargement
  useEffect(() => {
    try {
      const saved = localStorage.getItem('meilisearch-auto-sync');
      if (saved !== null) {
        setIsAutoSyncEnabled(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to restore auto-sync preference:', error);
    }
  }, []);

  return {
    testProductSync,
    testCategorySync,
    testFullSync,
    isAutoSyncEnabled,
    toggleAutoSync,
  };
}

// Hook simplifié pour vérifier si la synchronisation fonctionne
export function useSyncStatus() {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const recordSync = useCallback((type: 'product' | 'category' | 'full') => {
    setLastSyncTime(new Date());
    setSyncCount(prev => prev + 1);
    console.log(`Sync recorded: ${type} at ${new Date().toISOString()}`);
  }, []);

  return {
    lastSyncTime,
    syncCount,
    recordSync,
  };
}