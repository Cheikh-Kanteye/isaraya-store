// This file is a redirection to ensure all imports use the same API service
// The main API service is located in @/services/api.ts

export * from '@/services/api';

// This ensures that all imports like `from "@/lib/api"` 
// actually use the same API service as `from "@/services/api"`