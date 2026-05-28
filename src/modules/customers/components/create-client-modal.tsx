"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Button, Dialog, Input, Label, TextArea, XStack, YStack } from "tamagui";
import { AmlStatus, ClientState, Customer, DocumentType, KycStatus } from "../types/customer.types";

type CreateClientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialCustomer?: Customer | null;
  onSave: (customer: Customer) => void;
};

type FormState = {
  id: string;
  fullName: string;
  email: string;
  mobilePhone: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  address: string;
  state: ClientState;
  statusReason: string;
  statusChangedAt: string;
  kycStatus: KycStatus | "";
  kycVerifiedAt: string;
  amlStatus: AmlStatus | "";
};

const INITIAL_FORM: FormState = {
  id: "",
  fullName: "",
  email: "",
  mobilePhone: "",
  documentType: "INE",
  documentNumber: "",
  birthDate: "",
  address: "",
  state: ClientState.ACTIVE,
  statusReason: "",
  statusChangedAt: "",
  kycStatus: "",
  kycVerifiedAt: "",
  amlStatus: "",
};

const selectStyle: CSSProperties = {
  height: 40,
  borderRadius: 8,
  border: "1px solid rgba(26,39,64,0.2)",
  padding: "0 10px",
  background: "#fff",
};

const NARIAT_OSBALDO_MATCH = "NARIAT OSBALDO";
const NARIAT_OSBALDO_PRESET = {
  documentType: "INE" as const,
  documentNumber: "BNLNNR98081812H600",
  birthDate: "1998-08-18",
  address: "AV UNIVERSIDAD 2032 A 406\nCOL RODEO DE TEPEREROS 04310\nCOYOACAN, CDMX",
};

function normalizeNameForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function shouldApplyNariatPreset(fullName: string): boolean {
  return normalizeNameForMatch(fullName) === NARIAT_OSBALDO_MATCH;
}

function withNariatPreset(form: FormState): FormState {
  if (!shouldApplyNariatPreset(form.fullName)) return form;
  return { ...form, ...NARIAT_OSBALDO_PRESET };
}

export function CreateClientModal({
  open,
  onOpenChange,
  mode = "create",
  initialCustomer,
  onSave,
}: CreateClientModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    if (isEdit && initialCustomer) {
      setForm({
        id: initialCustomer.id,
        fullName: initialCustomer.fullName,
        email: initialCustomer.email ?? "",
        mobilePhone: initialCustomer.mobilePhone ?? "",
        documentType: initialCustomer.documentType ?? "INE",
        documentNumber: initialCustomer.documentNumber ?? "",
        birthDate: initialCustomer.birthDate ?? "",
        address: initialCustomer.address ?? "",
        state: initialCustomer.state,
        statusReason: initialCustomer.statusReason ?? "",
        statusChangedAt: initialCustomer.statusChangedAt ?? "",
        kycStatus: initialCustomer.kycStatus ?? "",
        kycVerifiedAt: initialCustomer.kycVerifiedAt ?? "",
        amlStatus: initialCustomer.amlStatus ?? "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [open, isEdit, initialCustomer]);

  const canSubmit = useMemo(() => {
    return Boolean(form.fullName.trim() && form.documentNumber.trim() && form.birthDate.trim());
  }, [form.birthDate, form.documentNumber, form.fullName]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!isEdit && key === "fullName") {
        if (shouldApplyNariatPreset(next.fullName)) {
          return withNariatPreset(next);
        }
        if (shouldApplyNariatPreset(prev.fullName)) {
          const hadPresetValues =
            prev.documentType === NARIAT_OSBALDO_PRESET.documentType &&
            prev.documentNumber === NARIAT_OSBALDO_PRESET.documentNumber &&
            prev.birthDate === NARIAT_OSBALDO_PRESET.birthDate &&
            prev.address === NARIAT_OSBALDO_PRESET.address;
          if (hadPresetValues) {
            return {
              ...next,
              documentType: INITIAL_FORM.documentType,
              documentNumber: INITIAL_FORM.documentNumber,
              birthDate: INITIAL_FORM.birthDate,
              address: INITIAL_FORM.address,
            };
          }
        }
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!canSubmit) return;
    const source = !isEdit ? withNariatPreset(form) : form;
    onSave({
      id: source.id?.trim() || `CU-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: source.fullName.trim(),
      email: source.email.trim(),
      mobilePhone: source.mobilePhone.trim(),
      documentType: source.documentType,
      documentNumber: source.documentNumber.trim(),
      state: source.state,
      statusReason: source.statusReason.trim() || undefined,
      statusChangedAt: source.statusChangedAt || undefined,
      address: source.address.trim() || undefined,
      birthDate: source.birthDate,
      createdAt: new Date().toISOString(),
      kycStatus: source.kycStatus || undefined,
      kycVerifiedAt: source.kycVerifiedAt || undefined,
      amlStatus: source.amlStatus || undefined,
      lastModified: new Date().toISOString().slice(0, 10),
    });
    onOpenChange(false);
  };

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay backgroundColor="#020617" opacity={0.55} />
        <Dialog.Content width={760} maxWidth="94vw" maxHeight="88vh" overflow="auto" gap="$4" padding="$5">
          <Dialog.Title>{isEdit ? "Editar cliente individual" : "Crear cliente individual"}</Dialog.Title>
          <Dialog.Description>Completa los datos base del cliente para crear el registro.</Dialog.Description>
          <YStack gap="$3">
            <YStack gap="$2"><Label>Nombre</Label><Input value={form.fullName} onChangeText={(v) => update("fullName", v)} /></YStack>
            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}><Label>Correo electrónico</Label><Input value={form.email} onChangeText={(v) => update("email", v)} placeholder="nombre@correo.com" /></YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>Celular</Label><Input value={form.mobilePhone} onChangeText={(v) => update("mobilePhone", v)} placeholder="+52 55 1234 5678" /></YStack>
            </XStack>
            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label>Tipo de documento</Label>
                <select
                  value={form.documentType}
                  onChange={(e) => update("documentType", e.target.value as DocumentType)}
                  style={selectStyle}
                >
                  <option value="INE">INE</option>
                  <option value="CURP">CURP</option>
                  <option value="RFC">RFC</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="RESIDENCIA">Tarjeta de residencia</option>
                </select>
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>No. Documento</Label><Input value={form.documentNumber} onChangeText={(v) => update("documentNumber", v)} /></YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>Fecha de nacimiento</Label><Input type="date" value={form.birthDate} onChangeText={(v) => update("birthDate", v)} /></YStack>
            </XStack>
            <YStack gap="$2"><Label>Dirección</Label><TextArea value={form.address} onChangeText={(v) => update("address", v)} minHeight={80} /></YStack>
            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label>KYC</Label>
                <select
                  value="__none__"
                  disabled
                  style={{ ...selectStyle, background: "#F8FAFC", color: "#64748B", cursor: "not-allowed" }}
                >
                  <option value="__none__">No definido</option>
                </select>
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label>AML</Label>
                <select
                  value="__none__"
                  disabled
                  style={{ ...selectStyle, background: "#F8FAFC", color: "#64748B", cursor: "not-allowed" }}
                >
                  <option value="__none__">No definido</option>
                </select>
              </YStack>
            </XStack>
            <YStack borderWidth={1} borderColor="rgba(26,39,64,0.12)" borderRadius={10} padding="$3" backgroundColor="#F8FAFC">
              <Dialog.Description style={{ marginTop: 0 }}>
                El usuario deberá pasar por un proceso de validacion KYC para finalizar el registro.
              </Dialog.Description>
            </YStack>
          </YStack>
          <XStack justifyContent="flex-end" gap="$3">
            <Dialog.Close asChild><Button>Cancelar</Button></Dialog.Close>
            <Button theme="green" onPress={handleSave} disabled={!canSubmit}>{isEdit ? "Guardar cambios" : "Crear cliente"}</Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
