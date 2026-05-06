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
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!canSubmit) return;
    onSave({
      id: form.id?.trim() || `CU-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      mobilePhone: form.mobilePhone.trim(),
      documentType: form.documentType,
      documentNumber: form.documentNumber.trim(),
      state: form.state,
      statusReason: form.statusReason.trim() || undefined,
      statusChangedAt: form.statusChangedAt || undefined,
      address: form.address.trim() || undefined,
      birthDate: form.birthDate,
      kycStatus: form.kycStatus || undefined,
      kycVerifiedAt: form.kycVerifiedAt || undefined,
      amlStatus: form.amlStatus || undefined,
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
          <Dialog.Description>KYC y AML son opcionales para sincronización automática posterior.</Dialog.Description>
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
              <YStack gap="$2" minWidth={220} flex={1}><Label>Documento</Label><Input value={form.documentNumber} onChangeText={(v) => update("documentNumber", v)} /></YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>Fecha de nacimiento</Label><Input type="date" value={form.birthDate} onChangeText={(v) => update("birthDate", v)} /></YStack>
            </XStack>
            <YStack gap="$2"><Label>Dirección</Label><TextArea value={form.address} onChangeText={(v) => update("address", v)} minHeight={80} /></YStack>
            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label>Estado</Label>
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value as ClientState)}
                  style={selectStyle}
                >
                  <option value={ClientState.ACTIVE}>Activo</option>
                  <option value={ClientState.INACTIVE}>Inactivo</option>
                  <option value={ClientState.BLACKLISTED}>Lista negra</option>
                </select>
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>Fecha cambio estado</Label><Input type="date" value={form.statusChangedAt} onChangeText={(v) => update("statusChangedAt", v)} /></YStack>
            </XStack>
            <YStack gap="$2"><Label>Motivo del estado</Label><TextArea value={form.statusReason} onChangeText={(v) => update("statusReason", v)} minHeight={70} /></YStack>
            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label>KYC (opcional)</Label>
                <select
                  value={form.kycStatus || "__none__"}
                  onChange={(e) => update("kycStatus", e.target.value === "__none__" ? "" : (e.target.value as KycStatus))}
                  style={selectStyle}
                >
                  <option value="__none__">Sin definir</option>
                  <option value="NOT_STARTED">No iniciado</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="VERIFIED">Verificado</option>
                  <option value="REJECTED">Rechazado</option>
                </select>
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}><Label>Fecha verificación KYC</Label><Input type="date" value={form.kycVerifiedAt} onChangeText={(v) => update("kycVerifiedAt", v)} /></YStack>
            </XStack>
            <YStack gap="$2">
              <Label>AML (opcional)</Label>
              <select
                value={form.amlStatus || "__none__"}
                onChange={(e) => update("amlStatus", e.target.value === "__none__" ? "" : (e.target.value as AmlStatus))}
                style={selectStyle}
              >
                <option value="__none__">Sin definir</option>
                <option value="NOT_STARTED">No iniciado</option>
                <option value="CLEAR">Limpio</option>
                <option value="REVIEW">En revisión</option>
                <option value="BLOCKED">Bloqueado</option>
              </select>
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
