"use client";

import { Plus, MoreHorizontal, X, Search, ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { naturalCreditRulesMock, type CreditRuleRow, type RuleOperator, type RuleDataType, type RuleSeverity } from "@/modules/mdc/data/mdc-rules-mock";

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

export function MdcRulesTab() {
  const [rules, setRules] = useState<CreditRuleRow[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mdc:rules:v2");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mdc:rules:v2", JSON.stringify(rules));
    }
  }, [rules]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeProduct, setActiveProduct] = useState("Credito automotriz");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          <button type="button" className="mdc-btn mdc-btn--primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors" onClick={() => setIsModalOpen(true)}>
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
                <option value="Credito automotriz">Credito automotriz</option>
                <option value="Credito personal">Credito personal</option>
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
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded shadow-sm hover:bg-slate-50 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
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
                <h2 className="text-xl font-bold text-slate-900">Nueva regla</h2>
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
                  <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Producto</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Credito automotriz</option>
                      <option>Credito personal</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Campo</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Edad del solicitante</option>
                      <option>Score crediticio</option>
                      <option>Relacion deuda / ingreso (DTI)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Modo de evaluacion</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Umbral unico</option>
                      <option>Por bandas</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Operador</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Mayor o igual (&gt;=)</option>
                      <option>Menor o igual (&lt;=)</option>
                      <option>Igual (=)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Valor</label>
                  <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Numero</option>
                      <option>Porcentaje</option>
                      <option>Texto</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Severidad</label>
                  <div className="relative">
                    <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Revision</option>
                      <option>Rechazo</option>
                      <option>Aprobacion</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripcion</label>
                <textarea 
                  className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
                <div className="relative">
                  <select className="w-full h-10 px-3 border border-slate-300 rounded-md appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>active</option>
                    <option>inactive</option>
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
                onClick={() => setIsModalOpen(false)}
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
