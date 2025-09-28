import config from "@/config";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { storeObserver } from "./store-helpers";
import {
  User,
  RegisterData,
  LoginDto,
  RegisterDto,
  MerchantProfile,
} from "@/types";

interface RegisterResponse {
  user: User;
  emailSent: boolean;
  message?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isSubmitting: boolean; // Renommé de isLoading
  isAuthLoading: boolean; // Nouveau loader pour l'authentification
  error: string | null;
  registrationResult: RegisterResponse | null; // New field to store registration result
  login: (credentials: LoginDto) => Promise<boolean>;
  register: (userData: RegisterDto) => Promise<{ success: boolean; result?: RegisterResponse }>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<User | null>;
  fetchMerchantProfile: () => Promise<MerchantProfile | null>;
  refreshCurrentUser: () => Promise<User | null>;
  isAdmin: () => boolean;
  isMerchant: () => boolean;
  hasMerchantProfile: () => boolean;
  setUser: (user: User | null) => void;
  setIsSubmitting: (submitting: boolean) => void; // Nouvelle fonction pour isSubmitting
  setIsAuthLoading: (loading: boolean) => void; // Nouvelle fonction pour isAuthLoading
  setError: (error: string | null) => void;
  setSubmitting: (val: boolean, error?: string | null) => void; // Rendre 'error' optionnel
  setRegistrationResult: (result: RegisterResponse | null) => void; // New setter
}

const API_BASE_URL = config.api.url;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get): AuthState => ({
      user: null,
      accessToken: null,
      isSubmitting: false, // Initialisation
      isAuthLoading: false, // Initialisation
      error: null,
      registrationResult: null, // New field initialization

      setUser: (user) => set({ user }),
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }), // Mise à jour de la fonction
      setIsAuthLoading: (isAuthLoading) => set({ isAuthLoading }), // Nouvelle fonction
      setError: (error) => set({ error }),
      setRegistrationResult: (registrationResult) => set({ registrationResult }), // New setter

      // Helper pour centraliser la gestion du loader isSubmitting et des erreurs
      setSubmitting: (val: boolean, error: string | null = null) =>
        set({ isSubmitting: val, error }),

      login: async (credentials: LoginDto) => {
        get().setSubmitting(true);

        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (response.ok) {
            const responseData = await response.json();

            const payload =
              responseData?.payload ?? responseData?.data ?? responseData;
            const accessToken =
              payload?.accessToken ?? responseData?.accessToken;
            const user =
              payload?.user ?? responseData?.user ?? payload?.data?.user;

            if (accessToken && user) {
              set({ user, accessToken });
              get().setSubmitting(false);
              storeObserver.emit("user-logged-in", user);
              return true;
            } else {
              // Message d'erreur plus descriptif selon ce qui manque
              const missingFields = [];
              if (!user) missingFields.push("Email ou mot de passe incorrect");

              get().setSubmitting(false, `${missingFields}`);
              return false;
            }
          } else {
            const errorData = await response.json();
            get().setSubmitting(
              false,
              errorData.message || "Email ou mot de passe incorrect"
            );
            return false;
          }
        } catch (err: unknown) {
          const e = err as { message?: string };
          get().setSubmitting(false, e?.message || "Erreur de connexion");
          return false;
        }
      },

      register: async (userData: RegisterDto) => {
        get().setSubmitting(true);

        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
          });

          if (response.ok) {
            const responseData = await response.json();

            // Extraction des données depuis la nouvelle structure de réponse
            const payload = responseData?.payload ?? responseData?.data ?? responseData;
            const user = payload?.user;
            // Détermine si l'email a été envoyé en se basant sur l'absence du warning EMAIL_NOT_SENT
            const emailSent = payload?.warning !== "EMAIL_NOT_SENT";
            const message = payload?.message ?? responseData?.message;

            if (user) {
              const registrationResult: RegisterResponse = {
                user,
                emailSent,
                message
              };

              // Store the registration result for UI handling
              set({ registrationResult });
              
              // Ne pas connecter l'utilisateur automatiquement après inscription
              // Il doit d'abord vérifier son email (isActive: false)
              get().setSubmitting(false);
              storeObserver.emit("user-registered", registrationResult);
              return { success: true, result: registrationResult };
            } else {
              get().setSubmitting(false, "Réponse API register invalide");
              return { success: false };
            }
          } else {
            const errorData = await response.json();
            get().setSubmitting(
              false,
              errorData.message || "Erreur lors de la création du compte"
            );
            return { success: false };
          }
        } catch (err: unknown) {
          const e = err as { message?: string };
          get().setSubmitting(
            false,
            e?.message || "Erreur lors de la création du compte"
          );
          return { success: false };
        }
      },

      resendVerificationEmail: async (email: string) => {
        get().setSubmitting(true);

        try {
          const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          if (response.ok) {
            const responseData = await response.json();
            get().setSubmitting(false);
            return true;
          } else {
            const errorData = await response.json();
            get().setSubmitting(
              false,
              errorData.message || "Erreur lors du renvoi de l'email"
            );
            return false;
          }
        } catch (err: unknown) {
          const e = err as { message?: string };
          get().setSubmitting(
            false,
            e?.message || "Erreur lors du renvoi de l'email"
          );
          return false;
        }
      },

      logout: () => {
        storeObserver.emit("user-logged-out");
        set({ user: null, accessToken: null, error: null });
      },

      getCurrentUser: async () => {
        const { accessToken, user } = get();
        if (accessToken) {
          set({ isAuthLoading: true });
          try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (response.ok) {
              const d = await response.json();
              const updatedUser =
                d?.payload?.user ??
                d?.data?.user ??
                d?.user ??
                d?.data?.data?.user;
              if (updatedUser) set({ user: updatedUser });
              return updatedUser ?? null;
            } else if (response.status === 401) {
              get().logout();
              return null; // Retourne null en cas d'échec d'authentification
            }
          } catch (err: unknown) {
            const e = err as { message?: string };
            console.error(
              "Erreur lors de la récupération de l'utilisateur:",
              e?.message || "Erreur inconnue"
            );
            set({ error: e?.message || "Erreur de connexion" });
            return null;
          } finally {
            set({ isAuthLoading: false });
          }
        }
        return null; // Retourne null si pas d'accessToken ou si l'utilisateur n'a pas pu être récupéré
      },

      fetchMerchantProfile: async () => {
        const { accessToken, user, setUser } = get() as {
          accessToken: string | null;
          user: User | null;
          setUser: (u: User | null) => void;
        };
        if (!accessToken) return null;
        try {
          const res = await fetch(`${API_BASE_URL}/auth/merchant/profile`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok) return null;
          const d = await res.json();
          const profile = d?.payload ?? d?.data ?? d;
          if (profile && user) {
            setUser({ ...user, merchantProfile: profile });
          }
          return profile as MerchantProfile;
        } catch {
          return null;
        }
      },
      refreshCurrentUser: async () => {
        return await get().getCurrentUser();
      },
      isAdmin: () => {
        const u = get().user;
        return !!u?.roles?.some((r) => r.name === "ADMIN");
      },
      isMerchant: () => {
        const u = get().user;
        return !!u?.roles?.some((r) => r.name === "MERCHANT");
      },
      hasMerchantProfile: () => {
        const u = get().user;
        return !!u?.merchantProfile;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage), // Changé de sessionStorage à localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      version: 1,
    }
  )
);

export default useAuthStore;
