export type JournalEntryRow = {
  id: string;
  entryId: number;
  bookingDate: string;
  transactionId: number;
  glAccountName: string;
  /** Importe en la columna débito (EUR); null si no aplica. */
  debit: number | null;
  /** Importe en la columna crédito (EUR); null si no aplica. */
  credit: number | null;
};
