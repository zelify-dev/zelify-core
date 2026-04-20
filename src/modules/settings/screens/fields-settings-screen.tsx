"use client";

import { useMemo, useState } from "react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./fields-settings-screen.css";

type FieldRow = {
  id: string;
  label: string;
  technicalId: string;
  type: "STRING" | "NUMBER" | "SELECT";
  required: boolean;
  active: boolean;
};

const TABS = ["Clients", "Groups", "Loans", "Deposits"] as const;
const BASE_FIELDS: FieldRow[] = [
  {
    id: "cf_1",
    label: "Lugar de Nacimiento",
    technicalId: "_birthPlace",
    type: "STRING",
    required: true,
    active: true,
  },
];

export function FieldsSettingsScreen() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Clients");
  const [rows, setRows] = useState<FieldRow[]>(BASE_FIELDS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newId, setNewId] = useState("");
  const [newType, setNewType] = useState<FieldRow["type"]>("STRING");
  const [selectOptions, setSelectOptions] = useState("Opc1, Opc2");

  const typeTone = (type: FieldRow["type"]) =>
    type === "STRING" ? "neutral" : type === "NUMBER" ? "warning" : "success";

  const mappedRows = useMemo(() => rows, [rows]);

  const addField = () => {
    if (!newLabel.trim() || !newId.trim()) return;
    setRows((prev) => [
      ...prev,
      {
        id: `cf_${prev.length + 1}`,
        label: newLabel,
        technicalId: newId,
        type: newType,
        required: false,
        active: true,
      },
    ]);
    setModalOpen(false);
    setNewLabel("");
    setNewId("");
    setNewType("STRING");
  };

  return (
    <div className="zelify-settings-workspace">
      <header className="zelify-settings-workspace__head">
        <h1>Fields</h1>
        <AppButton type="button" tone="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nuevo Campo
        </AppButton>
      </header>

      <div className="zelify-settings-tabs" role="tablist" aria-label="Módulos">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th />
            <th>Etiqueta (Label)</th>
            <th>ID Técnico</th>
            <th>Tipo de Dato</th>
            <th>Requerido</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mappedRows.map((row) => (
            <tr key={row.id}>
              <td>
                <GripVertical size={16} />
              </td>
              <td>{row.label}</td>
              <td className="zelify-mono">{row.technicalId}</td>
              <td>
                <AppBadge tone={typeTone(row.type)} size="sm">
                  {row.type === "STRING" ? "Text" : row.type === "NUMBER" ? "Number" : "Select"}
                </AppBadge>
              </td>
              <td>
                <input type="checkbox" checked={row.required} disabled />
              </td>
              <td>
                <label className="zelify-switch">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, active: e.target.checked } : item
                        )
                      )
                    }
                  />
                  <span />
                </label>
              </td>
              <td className="is-actions">
                <button type="button" className="zelify-icon-btn">
                  <Pencil size={14} />
                </button>
                <button type="button" className="zelify-icon-btn danger">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      {modalOpen ? (
        <div className="zelify-settings-modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <div className="zelify-settings-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <h2>Nuevo Campo</h2>
            <div className="zelify-settings-modal__body">
              <AppInput placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <AppInput placeholder="ID Técnico" value={newId} onChange={(e) => setNewId(e.target.value)} />
              <select
                className="zelify-fields-native-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldRow["type"])}
              >
                <option value="STRING">Text</option>
                <option value="NUMBER">Number</option>
                <option value="SELECT">Select</option>
              </select>
              {newType === "SELECT" ? (
                <AppInput
                  placeholder="Opciones separadas por coma"
                  value={selectOptions}
                  onChange={(e) => setSelectOptions(e.target.value)}
                />
              ) : null}
              <AppCheckbox id="new-required" label="Campo requerido" checked={false} readOnly />
            </div>
            <footer className="zelify-settings-modal__footer">
              <AppButton type="button" tone="neutral" onClick={() => setModalOpen(false)}>
                Cancelar
              </AppButton>
              <AppButton type="button" tone="primary" onClick={addField}>
                Guardar
              </AppButton>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

