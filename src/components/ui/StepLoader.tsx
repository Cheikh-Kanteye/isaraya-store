import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Progress } from "./progress";
import { CheckCircle, Loader2 } from "lucide-react";

type StepStatus = "pending" | "active" | "done";

type Step = { label: string; status: StepStatus };

type Props = { open: boolean; steps: Step[]; onOpenChange?: (v: boolean) => void };

export default function StepLoader({ open, steps, onOpenChange }: Props) {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const activeIndex = steps.findIndex((s) => s.status === "active");
  const value = Math.round(((done + (activeIndex >= 0 ? 0.5 : 0)) / total) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Création du produit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Progress value={value} />
          <ul className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex items-center gap-3">
                {s.status === "done" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : s.status === "active" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-muted-foreground" />
                )}
                <span className={s.status === "done" ? "text-foreground" : s.status === "active" ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
