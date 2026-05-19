"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle } from "lucide-react";

type FipeItem = { id: string; name: string };

export type VehicleData = {
  plate: string;
  brand: string;
  brandCode: string;
  model: string;
  modelCode: string;
  year: string;
};

const cls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

async function fipeFetch(params: string): Promise<FipeItem[]> {
  const res = await fetch(`/api/fipe?${params}`);
  if (!res.ok) throw new Error(`Erro ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

type Props = {
  initialPlate?: string;
  initialBrandCode?: string;
  initialBrand?: string;
  initialModelCode?: string;
  initialModel?: string;
  initialYear?: string;
  onSave: (data: VehicleData) => void;
  onCancel: () => void;
  saving?: boolean;
};

type InitPhase = "brand" | "model" | "year" | "done";

export function VehicleForm({
  initialPlate = "",
  initialBrandCode = "",
  initialBrand = "",
  initialModelCode = "",
  initialModel = "",
  initialYear = "",
  onSave,
  onCancel,
  saving = false,
}: Props) {
  const [plate, setPlate] = useState(initialPlate);

  const [brands, setBrands] = useState<FipeItem[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");

  const [brandCode, setBrandCode] = useState("");
  const [brandName, setBrandName] = useState("");
  const [models, setModels] = useState<FipeItem[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");

  const [modelCode, setModelCode] = useState("");
  const [modelName, setModelName] = useState("");
  const [years, setYears] = useState<FipeItem[]>([]);
  const [yearsLoading, setYearsLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState("");

  const [initPhase, setInitPhase] = useState<InitPhase>(
    initialBrandCode ? "brand" : "done"
  );
  const initValues = useRef({ brandCode: initialBrandCode, brand: initialBrand, modelCode: initialModelCode, model: initialModel, year: initialYear });

  // 1. Carrega marcas
  useEffect(() => {
    fipeFetch("type=brands")
      .then((items) => { setBrands(items); setBrandsLoading(false); })
      .catch((e) => { setBrandsError(e.message); setBrandsLoading(false); });
  }, []);

  // 2. Init modo edição: seta marca
  useEffect(() => {
    if (initPhase !== "brand" || brands.length === 0) return;
    const { brandCode: bc, brand: bn } = initValues.current;
    if (bc) { setBrandCode(bc); setBrandName(bn); setInitPhase("model"); }
    else setInitPhase("done");
  }, [initPhase, brands.length]);

  // 3. Carrega modelos quando marca muda
  useEffect(() => {
    if (!brandCode) { setModels([]); setModelCode(""); setModelName(""); setYears([]); setSelectedYear(""); return; }
    setModelsLoading(true);
    setModelsError("");
    fipeFetch(`type=models&brand=${brandCode}`)
      .then((items) => { setModels(items); setModelsLoading(false); })
      .catch((e) => { setModelsError(e.message); setModelsLoading(false); });
  }, [brandCode]);

  // 4. Init modo edição: seta modelo
  useEffect(() => {
    if (initPhase !== "model" || models.length === 0) return;
    const { modelCode: mc, model: mn } = initValues.current;
    if (mc) { setModelCode(mc); setModelName(mn); setInitPhase("year"); }
    else setInitPhase("done");
  }, [initPhase, models.length]);

  // 5. Carrega anos quando modelo muda
  useEffect(() => {
    if (!brandCode || !modelCode) { setYears([]); setSelectedYear(""); return; }
    setYearsLoading(true);
    fipeFetch(`type=years&brand=${brandCode}&model=${modelCode}`)
      .then((items) => { setYears(items); setYearsLoading(false); })
      .catch(() => setYearsLoading(false));
  }, [brandCode, modelCode]);

  // 6. Init modo edição: seta ano
  useEffect(() => {
    if (initPhase !== "year" || years.length === 0) return;
    const { year: y } = initValues.current;
    if (y) setSelectedYear(y);
    setInitPhase("done");
  }, [initPhase, years.length]);

  function handleBrandChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const b = brands.find((b) => b.id === e.target.value);
    setBrandCode(e.target.value);
    setBrandName(b?.name ?? "");
    setModelCode(""); setModelName(""); setSelectedYear("");
  }

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = models.find((m) => m.id === e.target.value);
    setModelCode(e.target.value);
    setModelName(m?.name ?? "");
    setSelectedYear("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ plate: plate.trim().toUpperCase(), brand: brandName, brandCode, model: modelName, modelCode, year: selectedYear });
  }

  const isInit = initPhase !== "done";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Placa */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
          Placa *
        </label>
        <input
          type="text"
          placeholder="ABC1D23"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          maxLength={8}
          className={cls}
          required
        />
      </div>

      {/* Marca */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          Marca
          {(brandsLoading || isInit) && <Loader2 className="w-3 h-3 animate-spin" />}
        </label>
        {brandsError ? (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" /> {brandsError}
          </div>
        ) : (
          <select value={brandCode} onChange={handleBrandChange} disabled={brandsLoading || isInit} className={cls}>
            <option value="">Selecionar marca...</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {/* Modelo */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          Modelo
          {modelsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        </label>
        {modelsError ? (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" /> {modelsError}
          </div>
        ) : (
          <select value={modelCode} onChange={handleModelChange} disabled={!brandCode || modelsLoading || isInit} className={cls}>
            <option value="">{!brandCode ? "Selecione a marca primeiro" : "Selecionar modelo..."}</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* Ano */}
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
          Ano
          {yearsLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        </label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={!modelCode || yearsLoading || isInit} className={cls}>
          <option value="">{!modelCode ? "Selecione o modelo primeiro" : "Selecionar ano..."}</option>
          {years.map((y) => <option key={y.id} value={y.name}>{y.name}</option>)}
        </select>
      </div>

      {/* Ações */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={saving || !plate.trim()} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
          {saving ? "Salvando..." : "Salvar veículo"}
        </button>
      </div>
    </form>
  );
}
