"use client";

import { useMemo, useState } from "react";
import {
  Adapt,
  Button,
  Dialog,
  Input,
  Label,
  Select,
  Sheet,
  TextArea,
  XStack,
  YStack,
} from "tamagui";
import { ChevronDown } from "lucide-react";

import { useI18n } from "@/providers/i18n-provider";
import { ClientState, Customer } from "../types/customer.types";

type CreateClientModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (customer: Customer) => void;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  creditOfficer: string;
  address: string;
  state: ClientState;
};

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  birthDate: "",
  creditOfficer: "",
  address: "",
  state: ClientState.PENDING,
};

export function CreateClientModal({ open, onOpenChange, onCreate }: CreateClientModalProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const canSubmit = useMemo(() => {
    return Boolean(form.fullName.trim() && form.birthDate.trim());
  }, [form.birthDate, form.fullName]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!canSubmit) return;

    const newCustomer: Customer = {
      id: `CU-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: form.fullName.trim(),
      state: form.state,
      creditOfficer: form.creditOfficer.trim() || "—",
      totalBalance: 0,
      lastModified: new Date().toLocaleDateString("es-ES"),
      birthDate: form.birthDate,
    };

    onCreate(newCustomer);
    setForm(INITIAL_FORM);
    onOpenChange(false);
  };

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.55}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="#020617"
        />

        <Dialog.Content
          key="content"
          bordered
          elevate
          animation={[
            "quick",
            {
              opacity: { overshootClamping: true },
            },
          ]}
          enterStyle={{ x: 0, y: 18, opacity: 0 }}
          exitStyle={{ x: 0, y: 10, opacity: 0 }}
          width={760}
          maxWidth="94vw"
          maxHeight="88vh"
          overflow="auto"
          gap="$4"
          padding="$5"
        >
          <Dialog.Title>{t("customers.create.title")}</Dialog.Title>
          <Dialog.Description>{t("customers.create.subtitle")}</Dialog.Description>

          <YStack gap="$4">
            <YStack gap="$2">
              <Label htmlFor="new-client-fullName">{t("customers.create.fullName")}</Label>
              <Input
                id="new-client-fullName"
                value={form.fullName}
                onChangeText={(v) => update("fullName", v)}
                placeholder={t("customers.create.fullNamePlaceholder")}
              />
            </YStack>

            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label htmlFor="new-client-email">{t("customers.create.email")}</Label>
                <Input
                  id="new-client-email"
                  value={form.email}
                  onChangeText={(v) => update("email", v)}
                  placeholder="name@domain.com"
                />
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label htmlFor="new-client-phone">{t("customers.create.phone")}</Label>
                <Input
                  id="new-client-phone"
                  value={form.phone}
                  onChangeText={(v) => update("phone", v)}
                  placeholder="+593 99 123 4567"
                />
              </YStack>
            </XStack>

            <XStack gap="$3" flexWrap="wrap">
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label htmlFor="new-client-birthDate">{t("customers.create.birthDate")}</Label>
                <Input
                  id="new-client-birthDate"
                  type="date"
                  value={form.birthDate}
                  onChangeText={(v) => update("birthDate", v)}
                />
              </YStack>
              <YStack gap="$2" minWidth={220} flex={1}>
                <Label htmlFor="new-client-officer">{t("customers.create.creditOfficer")}</Label>
                <Input
                  id="new-client-officer"
                  value={form.creditOfficer}
                  onChangeText={(v) => update("creditOfficer", v)}
                  placeholder={t("customers.create.creditOfficerPlaceholder")}
                />
              </YStack>
            </XStack>

            <YStack gap="$2">
              <Label htmlFor="new-client-address">{t("customers.create.address")}</Label>
              <TextArea
                id="new-client-address"
                value={form.address}
                onChangeText={(v) => update("address", v)}
                placeholder={t("customers.create.addressPlaceholder")}
                minHeight={90}
              />
            </YStack>

            <YStack gap="$2">
              <Label>{t("customers.create.initialState")}</Label>
              <Select
                value={form.state}
                onValueChange={(value) => update("state", value as ClientState)}
              >
                <Select.Trigger iconAfter={ChevronDown}>
                  <Select.Value />
                </Select.Trigger>
                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content>
                  <Select.Viewport>
                    <Select.Item index={0} value={ClientState.PENDING}>
                      <Select.ItemText>{t("customers.list.clientStates.pending")}</Select.ItemText>
                    </Select.Item>
                    <Select.Item index={1} value={ClientState.ACTIVE}>
                      <Select.ItemText>{t("customers.list.clientStates.active")}</Select.ItemText>
                    </Select.Item>
                    <Select.Item index={2} value={ClientState.INACTIVE}>
                      <Select.ItemText>{t("customers.list.clientStates.inactive")}</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>
          </YStack>

          <XStack justifyContent="flex-end" gap="$3" marginTop="$2">
            <Dialog.Close asChild>
              <Button>{t("customers.create.cancel")}</Button>
            </Dialog.Close>
            <Button theme="green" onPress={handleSave} disabled={!canSubmit}>
              {t("customers.create.save")}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
