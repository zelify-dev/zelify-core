"use client";

import { Plus, MoreHorizontal, X, Search, ChevronDown, Pencil } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { naturalCreditRulesMock, type CreditRuleRow, type RuleOperator, type RuleDataType, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";
import { fetchRules, createRule, updateRule, deleteRule, fetchFinanceProducts } from "@/modules/mdc/services/mdc-rules.service";
import { getStoredOrganization } from "@/lib/auth-api";

// Helper functions for formatting
function formatOperator(op: RuleOperator) {
  switch (op) {
    case "gte": return "Mayor o igual (>=)";
    case "lte": return "Menor o igual (<=)";
    case "gt": return "Mayor que (>)";
    case "lt": return "Menor que (<)";
    case "equals": return "Igual (=)";
    case "between": return "Por bandas";
    case "contains": return "Contiene";
    default: return op;
  }
}

function formatDataType(type: RuleDataType) {
  switch (type) {
    case "number": return "Numero";
    case "percentage": return "Porcentaje";
    case "string": return "Texto";
    case "boolean": return "Booleano";
    case "date": return "Fecha";
    default: return type;
  }
}

export function MdcRulesTab({ mode }: { mode: "natural" | "moral" }) {
  const [rules, setRules] = useState<CreditRuleRow[]>([]);
  
  useEffect(() => {
    async function load() {
      const orgId = getStoredOrganization()?.id || "demo-bypass-org";
      if (orgId === "demo-bypass-org") {
        setRules(mode === "natural" ? naturalCreditRulesMock : moralCreditRulesMock);
        return;
      }
      const data = await fetchRules(mode, orgId);
      setRules(data);
    }
    load();
  }, [mode]);

  const orgId = getStoredOrganization()?.id || "demo-bypass-org";

  const [newRule, setNewRule] = useState<Partial<CreditRuleRow>>({
    name: "",
    products: [],
    field: "Edad del solicitante",
    evaluationMode: "single",
    operator: "gte",
    value: "",
    dataType: "number",
    severity: "warn",
    description: "",
    status: "active",
  });

  const [availableProducts, setAvailableProducts] = useState<{id: string, financialProduct: string}[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const products = await fetchFinanceProducts(orgId);
        if (Array.isArray(products)) {
          setAvailableProducts(products);
          if (products.length > 0) {
            setActiveProduct(products[0].financialProduct);
            setNewRule(prev => ({ ...prev, products: [products[0].financialProduct] }));
          }
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    }
    loadProducts();
  }, [mode]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeProduct, setActiveProduct] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.field.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProduct = r.products.includes(activeProduct as any);
      return matchesSearch && matchesProduct;
    });
  }, [rules, searchTerm, activeProduct]);

  return (
    <section className="mdc-section">
      <article className="mdc-card">
        <div className="mdc-card__head mdc-card__head--row">
          <div>
            <h3>Reglas y thresholds</h3>
            <p className="text-slate-500">Configuracion operativa del motor MDC</p>
          </div>
          <button type="button" className="mdc-btn mdc-btn--primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors" onClick={() => {
            setEditingRuleId(null);
            setNewRule({
              name: "",
              products: orgId === "demo-bypass-org" ? ["Credito automotriz"] : (availableProducts.length > 0 ? [availableProducts[0].financialProduct] : []),
              field: "Edad del solicitante",
              evaluationMode: "single",
              operator: "gte",
              value: "",
              dataType: "number",
              severity: "warn",
              description: "",
              status: "active",
            });
            setIsModalOpen(true);
          }}>
            Agregar regla
          </button>
        </div>

        <div className="p-4 space-y-4 border-b border-slate-200">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Producto activo</label>
            <div className="relative">
              <select 
                className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={activeProduct}
                onChange={(e) => setActiveProduct(e.target.value)}
              >
                {orgId === "demo-bypass-org" ? (
                  <option value="Credito automotriz">Credito automotriz</option>
                ) : availableProducts.length > 0 ? (
                  availableProducts.map(p => (
                    <option key={p.id} value={p.financialProduct}>{p.financialProduct}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay productos disponibles</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Buscar regla</label>
            <input 
              type="text" 
              placeholder="nombre, campo o descripcion" 
              className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">NOMBRE</th>
                <th className="px-6 py-4 font-semibold">DESCRIPCIÓN</th>
                <th className="px-6 py-4 font-semibold text-center">OPERADOR</th>
                <th className="px-6 py-4 font-semibold text-center">VALOR</th>
                <th className="px-6 py-4 font-semibold text-center">TIPO</th>
                <th className="px-6 py-4 font-semibold text-center">SEVERIDAD</th>
                <th className="px-6 py-4 font-semibold text-center">ESTADO</th>
                <th className="px-6 py-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No hay reglas configuradas. Haz clic en "Agregar regla" para comenzar.
                  </td>
                </tr>
              ) : filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs leading-relaxed">{rule.description}</td>
                  <td className="px-6 py-4 text-center">
                    {rule.operator === "between" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Por bandas</span>
                    ) : (
                      <span className="text-slate-600">{formatOperator(rule.operator)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">
                    {rule.operator === "between" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Por bandas</span>
                    ) : (
                      rule.value
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">{formatDataType(rule.dataType)}</td>
                  <td className="px-6 py-4 text-center">
                    {rule.operator === "between" && rule.decisionBands ? (
                      <div className="flex gap-2 justify-center text-[10px] font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Aprob. ≤ {rule.decisionBands.approveMax}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">Rev. {rule.decisionBands.reviewMin} - {rule.decisionBands.reviewMax}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700">Rech. ≥ {rule.decisionBands.rejectMin}</span>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rule.severity === "fail" ? "bg-rose-50 text-rose-700" :
                        rule.severity === "warn" ? "bg-amber-50 text-amber-700" :
                        "bg-emerald-50 text-emerald-700"
                      }`}>
                        {rule.severity === "fail" ? "Rechazo" : rule.severity === "warn" ? "Revision" : "Aprobacion"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                      Activa
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button 
                        className="p-1.5 text-blue-400 hover:text-blue-600 border border-blue-200 rounded shadow-sm hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          setEditingRuleId(rule.id);
                          setNewRule({
                            name: rule.name,
                            products: rule.products,
                            field: rule.field,
                            evaluationMode: rule.evaluationMode,
                            operator: rule.operator,
                            value: rule.value,
                            dataType: rule.dataType,
                            severity: rule.severity,
                            description: rule.description,
                            status: rule.status,
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1.5 text-rose-400 hover:text-rose-600 border border-rose-200 rounded shadow-sm hover:bg-rose-50 transition-colors"
                        onClick={async () => {
                          if (rule.id) {
                            const orgId = getStoredOrganization()?.id || "demo-bypass-org";
                            await deleteRule(rule.id, orgId);
                            setRules(rules.filter(r => r.id !== rule.id));
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRules.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron reglas para esta busqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Nueva Regla */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 tracking-wider mb-1 uppercase">Regla de credito</p>
                <h2 className="text-xl font-bold text-slate-900">{editingRuleId ? "Editar regla" : "Nueva regla"}</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
                  <input type="text" value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Producto</label>
                  <div className="relative">
                    <select 
                      value={newRule.products?.[0] || ""} 
                      onChange={e => setNewRule({...newRule, products: [e.target.value as any]})} 
                      className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {orgId === "demo-bypass-org" ? (
                        <option value="Credito automotriz">Credito automotriz</option>
                      ) : availableProducts.length > 0 ? (
                        availableProducts.map(p => (
                          <option key={p.id} value={p.financialProduct}>{p.financialProduct}</option>
                        ))
                      ) : (
                        <option value="" disabled>No hay productos disponibles</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Campo</label>
                  <div className="relative">
                    <select value={newRule.field} onChange={e => setNewRule({...newRule, field: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Edad del solicitante">Edad del solicitante</option>
                      <option value="Edad al término del contrato">Edad al término del contrato</option>
                      <option value="Plazo solicitado">Plazo solicitado</option>
                      <option value="Monto solicitado">Monto solicitado</option>
                      <option value="Ingreso líquido promedio">Ingreso líquido promedio</option>
                      <option value="Líquido restante (Resguardo)">Líquido restante (Resguardo)</option>
                      <option value="Tipo de empleo">Tipo de empleo</option>
                      <option value="Score crediticio">Score crediticio</option>
                      <option value="Relacion deuda / ingreso (DTI)">Relacion deuda / ingreso (DTI)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Modo de evaluacion</label>
                  <div className="relative">
                    <select value={newRule.evaluationMode} onChange={e => setNewRule({...newRule, evaluationMode: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="single">Umbral unico</option>
                      <option value="bands">Por bandas</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Operador</label>
                  <div className="relative">
                    <select value={newRule.operator} onChange={e => setNewRule({...newRule, operator: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="gte">Mayor o igual (&gt;=)</option>
                      <option value="lte">Menor o igual (&lt;=)</option>
                      <option value="equals">Igual (=)</option>
                      <option value="between">Por bandas</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Valor</label>
                  <input type="text" value={newRule.value} onChange={e => setNewRule({...newRule, value: e.target.value})} className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
                  <div className="relative">
                    <select value={newRule.dataType} onChange={e => setNewRule({...newRule, dataType: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="number">Numero</option>
                      <option value="percentage">Porcentaje</option>
                      <option value="string">Texto</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Severidad</label>
                  <div className="relative">
                    <select value={newRule.severity} onChange={e => setNewRule({...newRule, severity: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="warn">Revision</option>
                      <option value="fail">Rechazo</option>
                      <option value="pass">Aprobacion</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripcion</label>
                <textarea 
                  value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
                <div className="relative">
                  <select value={newRule.status} onChange={e => setNewRule({...newRule, status: e.target.value as any})} className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                onClick={async () => {
                  const payload = {
                    ...newRule, 
                    products: newRule.products?.length ? newRule.products : orgId === "demo-bypass-org" ? ["Credito automotriz"] : availableProducts.length > 0 ? [availableProducts[0].financialProduct] : [], 
                    individualPerson: mode === "natural",
                    legalEntity: mode === "moral"
                  } as any;
                  
                  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
                  if (editingRuleId) {
                    const updated = await updateRule(editingRuleId, payload, orgId);
                    if (updated) {
                      setRules(rules.map(r => r.id === editingRuleId ? updated : r));
                    }
                  } else {
                    const created = await createRule(payload, orgId);
                    if (created) {
                       setRules([created, ...rules]);
                    }
                  }
                  setIsModalOpen(false);
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
