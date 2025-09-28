import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

interface ResendEmailVerificationProps {
  onClose?: () => void;
  defaultEmail?: string;
  isDialog?: boolean;
}

const ResendEmailVerification = ({ 
  onClose, 
  defaultEmail = "",
  isDialog = false 
}: ResendEmailVerificationProps) => {
  const { resendVerificationEmail, isSubmitting, error } = useAuthStore();
  const { toast } = useToast();
  const [email, setEmail] = useState(defaultEmail);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState("");

  const handleResend = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir votre adresse email.",
        variant: "destructive",
      });
      return;
    }

    const success = await resendVerificationEmail(email);
    
    if (success) {
      setAttemptedEmail(email);
      setShowSuccessModal(true);
      toast({
        title: "Email renvoyé",
        description: "Un nouvel email de vérification vous a été envoyé.",
      });
    } else {
      toast({
        title: "Erreur",
        description: error || "Impossible de renvoyer l'email. Vérifiez votre adresse email ou réessayez plus tard.",
        variant: "destructive",
      });
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setEmail("");
    onClose?.();
  };

  const content = (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-card-foreground">
            Adresse email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-card border-border"
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleResend}
          disabled={isSubmitting || !email.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSubmitting ? "Envoi en cours..." : "Renvoyer l'email"}
        </Button>

        {onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Annuler
          </Button>
        )}
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">
              Email Renvoyé !
            </DialogTitle>
            <DialogDescription className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2 text-lg">
                <Mail className="w-5 h-5 text-primary" />
                <span>Nouvel email de vérification envoyé</span>
              </div>
              <p className="text-sm">
                Nous avons envoyé un nouvel email de vérification à{" "}
                <span className="font-semibold text-primary break-all">
                  {attemptedEmail}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Veuillez vérifier votre boîte de réception (et vos spams) pour
                activer votre compte.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-3 mt-6">
            <Button
              onClick={handleSuccessModalClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Terminé
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isDialog) {
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Renvoyer l'Email de Vérification
          </DialogTitle>
          <DialogDescription className="text-center">
            Saisissez votre adresse email pour recevoir un nouvel email de vérification.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {onClose && (
          <Button
            variant="ghost"
            onClick={onClose}
            className="mb-4 text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-card-foreground">
              Renvoyer l'Email de Vérification
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Saisissez votre adresse email pour recevoir un nouvel email de vérification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResendEmailVerification;