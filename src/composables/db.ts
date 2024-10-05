import Dexie, { type EntityTable } from "dexie";
import { Receipt, ReceiptItem } from "./receipt";

export const db = new Dexie('receipt-keeper') as Dexie & {
  receipts: EntityTable<
    Receipt,
    'id' // primary key "id" (for the typings only)
  >;
  receiptItems: EntityTable<
    ReceiptItem,
    'id' // primary key "id" (for the typings only)
  >;
};

db.version(1).stores({
  receipts: '++id, date',
  receiptItems: '++id, receiptId'
});