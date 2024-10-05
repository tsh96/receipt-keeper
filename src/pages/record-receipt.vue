<script setup lang="ts">
import { ref, toRaw } from 'vue'
import { NForm, NFormItem, NInputNumber, NInput, NDynamicInput, NButton, NCard, NScrollbar, useMessage, NDatePicker } from 'naive-ui'
import { db } from '../composables/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Receipt, ReceiptItem } from '../composables/receipt'
import { useSettings } from '../composables/settings'
import LayoutWithNav from '../components/LayoutWithNav.vue'
import { textEmbedding } from '../composables/text-embedding'

const settings = useSettings()

const receiptForm = ref<Omit<Receipt, "id">>({
  sellerName: '',
  tax: 0,
  amount: 0,
  date: new Date().getTime(),
  photo: new File([], 'photo'),
})

const receiptItemsForm = ref<Omit<ReceiptItem, "id" | 'receiptId'>[]>([])

function newReceiptItem(): Omit<ReceiptItem, "id" | 'receiptId'> {
  return {
    description: '',
    quantity: 1,
    amount: 0,
    descriptionEmbedding: [],
  }
}

const message = useMessage()

async function saveReceipt() {
  try {
    const receiptId = await db.receipts.add(toRaw(receiptForm.value))
    await db.receiptItems.bulkAdd(
      toRaw(receiptItemsForm.value).map(item => {
        return {
          ...item,
          receiptId,
        }
      })
    )

    receiptForm.value = {
      photo: new File([], 'photo'),
      sellerName: '',
      tax: 0,
      amount: 0,
      date: new Date().getTime(),
    }
    receiptItemsForm.value = []


    message.success('Expense saved successfully')
  } catch (e) {
    message.error(`Failed to save expense: ${e}`)
  }
}

const parsingPhoto = ref(false)

// Define the takePhoto function
async function takeAndParsePhoto() {
  takePhoto(async (photo) => {
    try {
      parsingPhoto.value = true
      const { result } = await parsePhoto(photo)
      receiptForm.value = {
        photo,
        sellerName: result.seller_name,
        amount: result.amount,
        tax: result.tax,
        date: await parseDate(result.date),
      }
      receiptItemsForm.value = await Promise.all((result.items as unknown[]).map(async (item: any) => ({
        description: String(item.description),
        quantity: Number(item.quantity),
        amount: Number(item.amount),
        descriptionEmbedding: await textEmbedding(item.description),
      })))
    } catch (e) {
      console.error(e)
    } finally {
      parsingPhoto.value = false
    }
  })
}

function takePhoto(callback: (photo: File) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'environment';
  input.capture = 'environment';
  input.accept = 'image/*';
  input.style.display = 'none';

  input.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      callback(file)
    }
  });

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
}

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string)?.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

async function parsePhoto(photo: File) {
  const genAI = new GoogleGenerativeAI(settings.value.geminiApiKey);
  // The Gemini 1.5 models are versatile and work with both text-only and multimodal prompts

  const model = genAI.getGenerativeModel({ model: settings.value.geminiModel });

  const schemaPrompt = `
  {
      seller_name: string; // The name of the seller only, should not include the address, phone number, etc.
      amount: number;
      tax: number;
      date: string; // The date of the receipt in the format "YYYY-MM-DD".
      items: {
        description: string; // Not including the barcode, only the name of the item.
        quantity: number;
        amount: number;
      }[];
    };
  `

  const promptPrefix = "Express receipt in json format without markdown schema. Use the following schema: \n"
  const prompt = promptPrefix + schemaPrompt

  const filePart = await fileToGenerativePart(photo)
  const generatedContent = await model.generateContent([prompt, filePart as any]);
  const response = await generatedContent.response;
  const text = response.text().replace(/^[^{]*|[^}]*$/g, '');

  const usageMetadata = response.usageMetadata
  const cost = (usageMetadata?.candidatesTokenCount || 0) * 1.05 * 1e-6
    + (usageMetadata?.promptTokenCount || 0) * 0.35 * 1e-6

  const result = JSON.parse(text)

  return { cost, result }
}

async function parseDate(date: string) {
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(date).getTime()
  }

  const genAI = new GoogleGenerativeAI(settings.value.geminiApiKey);
  const model = genAI.getGenerativeModel({ model: settings.value.geminiModel });

  const prompt = `Express date in the format "YYYY-MM-DD".`
  const generatedContent = await model.generateContent([prompt, date]);
  const response = await generatedContent.response;
  const text = response.text().match(/\d{4}-\d{2}-\d{2}/)?.[0] || date

  return new Date(text).getTime()
}

</script>

<template lang="pug">
LayoutWithNav(title="Record Expense" back-url="/")
  NScrollbar
    .container
      NForm
        NFormItem(label="Seller Name")
          NInput(v-model:value="receiptForm.sellerName" type="textarea" autosize)
        NFormItem(label="Date")
          NDatePicker(v-model:value="receiptForm.date")
        NFormItem(label="Tax")
          NInputNumber(type="number" step="0.01" v-model:value="receiptForm.tax" :precision="2")
            template(#prefix) $
        NFormItem(label="Amount")
          NInputNumber(type="number" step="0.01" v-model:value="receiptForm.amount" :precision="2")
            template(#prefix) $
        NFormItem(label="Items")
          NDynamicInput(v-model:value="receiptItemsForm" @create="newReceiptItem()" :loading="parsingPhoto")
            template(#default="{ value }")
              NCard
                NFormItem(label="Description")
                  NInput(v-model:value="value.description" type="textarea" autosize)
                NFormItem(label="Quantity")
                  NInputNumber(type="number" v-model:value="value.quantity")
                NFormItem(label="Amount")
                  NInputNumber(type="number" step="0.01" v-model:value="value.amount" :precision="2")
                    template(#prefix) $
            template(#action="{ index, create, remove }")
              div(style="display: flex; flex-direction: column; place-items: center; justify-content: center;")
                NButton(type="primary" size="small" @click="create(index + 1)" block) +
                NButton(type="error" size="small" @click="remove(index)" block) -
        div(style="display: grid; gap: 10px; grid-template-columns: 1fr 1fr;")
          NButton(type="primary" size="large" @click="saveReceipt") Save
          NButton(type="primary" size="large" @click="takeAndParsePhoto()" :loading="parsingPhoto") Take Photo
</template>

<style scoped>
.container {
  padding: 20px;
}
</style>