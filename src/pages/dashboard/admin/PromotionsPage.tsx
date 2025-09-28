import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Loader from "@/components/ui/loader";
import { toast } from "sonner";
import { apiService } from "@/services/api";

export default function PromotionsPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPromo, setSavingPromo] = useState(false);
  const [savingCode, setSavingCode] = useState(false);

  const [promoForm, setPromoForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    discountPercent: 10,
    featured: true,
  });

  const [codeForm, setCodeForm] = useState({
    code: "",
    type: "percent" as "percent" | "fixed",
    amount: 10,
    maxUses: 0,
    expiresAt: "",
    active: true,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        (apiService as any).promotions?.getAll?.({}),
        (apiService as any).promoCodes?.getAll?.({}),
      ]);
      setPromos(Array.isArray(p) ? p : []);
      setCodes(Array.isArray(c) ? c : []);
    } catch (e) {
      setPromos([]);
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createPromo = async () => {
    try {
      setSavingPromo(true);
      const created = await (apiService as any).promotions?.create?.(promoForm);
      if (created) {
        toast.success("Promotion créée");
        setPromoForm({ title: "", subtitle: "", imageUrl: "", discountPercent: 10, featured: true });
        await loadAll();
      }
    } catch (e) {
      toast.error("Échec de création de promotion");
    } finally {
      setSavingPromo(false);
    }
  };

  const createCode = async () => {
    try {
      setSavingCode(true);
      const created = await (apiService as any).promoCodes?.create?.(codeForm);
      if (created) {
        toast.success("Code promo créé");
        setCodeForm({ code: "", type: "percent", amount: 10, maxUses: 0, expiresAt: "", active: true });
        await loadAll();
      }
    } catch (e) {
      toast.error("Échec de création de code promo");
    } finally {
      setSavingCode(false);
    }
  };

  const removePromo = async (id: string) => {
    if (!confirm("Supprimer cette promotion ?")) return;
    await (apiService as any).promotions?.remove?.(id);
    await loadAll();
  };

  const removeCode = async (id: string) => {
    if (!confirm("Supprimer ce code promo ?")) return;
    await (apiService as any).promoCodes?.remove?.(id);
    await loadAll();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Promotions & Codes Promo</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Créer une promotion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Titre</Label>
              <Input value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input value={promoForm.subtitle} onChange={(e) => setPromoForm({ ...promoForm, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={promoForm.imageUrl} onChange={(e) => setPromoForm({ ...promoForm, imageUrl: e.target.value })} />
            </div>
            <div>
              <Label>Réduction (%)</Label>
              <Input type="number" value={promoForm.discountPercent} onChange={(e) => setPromoForm({ ...promoForm, discountPercent: Number(e.target.value) })} />
            </div>
            <Button onClick={createPromo} disabled={savingPromo}>{savingPromo ? <Loader size={16} text="" className="mr-2" /> : null}Créer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Créer un code promo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Code</Label>
              <Input value={codeForm.code} onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Type</Label>
              <select className="border rounded px-3 py-2 w-full" value={codeForm.type} onChange={(e) => setCodeForm({ ...codeForm, type: e.target.value as any })}>
                <option value="percent">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </select>
            </div>
            <div>
              <Label>Valeur</Label>
              <Input type="number" value={codeForm.amount} onChange={(e) => setCodeForm({ ...codeForm, amount: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Date d'expiration (optionnel)</Label>
              <Input type="datetime-local" value={codeForm.expiresAt} onChange={(e) => setCodeForm({ ...codeForm, expiresAt: e.target.value })} />
            </div>
            <Button onClick={createCode} disabled={savingCode}>{savingCode ? <Loader size={16} text="" className="mr-2" /> : null}Créer</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotions existantes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader />
          ) : promos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune promotion</p>
          ) : (
            <div className="space-y-2">
              {promos.map((p: any) => (
                <div key={p.id || p._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">-{p.discountPercent || p.discount}%</div>
                  </div>
                  <Button variant="outline" onClick={() => removePromo(p.id || p._id)}>Supprimer</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Codes promo existants</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader />
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun code promo</p>
          ) : (
            <div className="space-y-2">
              {codes.map((c: any) => (
                <div key={c.id || c._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{c.code}</div>
                    <div className="text-xs text-muted-foreground">{c.type === 'percent' ? `${c.amount}%` : `${c.amount} FCFA`}</div>
                  </div>
                  <Button variant="outline" onClick={() => removeCode(c.id || c._id)}>Supprimer</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
