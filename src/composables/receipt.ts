export type ReceiptItem = {
  id: number;
  receiptId: number;
  description: string;
  quantity: number;
  amount: number;
  descriptionEmbedding: number[];
}

export type Receipt = {
  id: number;
  sellerName: string;
  tax: number;
  amount: number;
  date: number;
  photo: File;
}
