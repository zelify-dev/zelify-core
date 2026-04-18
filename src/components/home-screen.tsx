"use client";

import { Button, H1, Paragraph, XStack, YStack } from "tamagui";

type FeatureBlockProps = {
  title: string;
  description: string;
  marker: string;
};

export default function HomeScreen() {
  return (
    <YStack
      flex={1}
      gap="$8"
      px="$6"
      py="$8"
      justifyContent="space-between"
      backgroundColor="$background"
    >
      <YStack gap="$6" maxWidth={980} width="100%" mx="auto">
        <YStack gap="$3">
          <Paragraph size="$4" color="$blue10" fontWeight="700">
            Zelify Core
          </Paragraph>
          <H1 size="$12" lineHeight="$11" letterSpacing={-2}>
            Infraestructura base para un core banking SaaS moderno.
          </H1>
          <Paragraph size="$6" color="$gray11" maxWidth={760}>
            Esta primera base deja Next.js inicializado y Tamagui listo para
            construir dashboards, flujos operativos, onboarding bancario y
            componentes internos reutilizables.
          </Paragraph>
        </YStack>

        <XStack flexWrap="wrap" gap="$4">
          <Button size="$5">
            Continuar construccion
          </Button>
          <Button size="$5" chromeless>
            Definir modulos del core
          </Button>
        </XStack>
      </YStack>

      <YStack
        maxWidth={980}
        width="100%"
        mx="auto"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$8"
        overflow="hidden"
        backgroundColor="$color1"
      >
        <XStack flexWrap="wrap">
          <FeatureBlock
            title="Ledger y cuentas"
            description="Base para productos bancarios, saldos y movimientos."
            marker="LG"
          />
          <FeatureBlock
            title="Seguridad operativa"
            description="Espacio para roles, autorizaciones y trazabilidad."
            marker="SO"
          />
          <FeatureBlock
            title="Pagos y tesoreria"
            description="Punto de partida para transferencias, recaudos y conciliacion."
            marker="PT"
          />
        </XStack>
      </YStack>
    </YStack>
  );
}

function FeatureBlock({ title, description, marker }: FeatureBlockProps) {
  return (
    <YStack flex={1} minWidth={260} gap="$4" p="$6">
      <XStack
        width={48}
        height={48}
        borderRadius="$12"
        alignItems="center"
        justifyContent="center"
        backgroundColor="$blue3"
      >
        <Paragraph size="$5" fontWeight="700" color="$blue10">
          {marker}
        </Paragraph>
      </XStack>
      <YStack gap="$2">
        <Paragraph size="$5" fontWeight="700" color="$gray12">
          {title}
        </Paragraph>
        <Paragraph size="$4" color="$gray11">
          {description}
        </Paragraph>
      </YStack>
    </YStack>
  );
}
