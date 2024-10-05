<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NCard, NImage, NInput, NModal, NScrollbar } from 'naive-ui'
import { db } from '../composables/db'
import type { Receipt, ReceiptItem } from '../composables/receipt'
import LayoutWithNav from '../components/LayoutWithNav.vue'
import { format } from 'date-fns'
import { groupBy } from 'lodash'
import { dotProducts, textEmbedding } from '../composables/text-embedding'

type EnrichedReceipt = Receipt & { items: ReceiptItem[] }

const receipts = ref<EnrichedReceipt[]>([])
const receiptItems = computed(() => {
  return receipts.value.flatMap(receipt => {
    return receipt.items.map(item => {
      return {
        ...item,
        receipt
      }
    })
  })
})

const search = ref('')

const filteredReceiptItems = ref(receiptItems.value)



async function searchReceiptItems() {
  const searchTextEmbedding = await textEmbedding(search.value)

  filteredReceiptItems.value = receiptItems.value.map(item => {
    const distance = dotProducts(searchTextEmbedding, item.descriptionEmbedding)
    return {
      item,
      distance
    }
  }).sort((a, b) => b.distance - a.distance)
    .map(({ item }) => item)
}

async function loadReceipts() {
  const receiptItems = groupBy(await db.receiptItems.toArray(), (receiptItem) => receiptItem.receiptId)

  receipts.value = (await db.receipts.orderBy('date').reverse().toArray()).map(receipt => {
    return {
      ...receipt,
      items: receiptItems[receipt.id] || []
    }
  })
}

onMounted(loadReceipts)

const receiptModalShow = ref(false)
const selectedReceipt = ref<EnrichedReceipt>()
const selectedReceiptItem = ref<ReceiptItem>()
const receiptPhotoUrl = computed(() => {
  const photo = selectedReceipt.value?.photo
  return photo && URL.createObjectURL(photo)
})

function showReceiptModal(receipt: EnrichedReceipt, receiptItem?: ReceiptItem) {
  selectedReceipt.value = receipt
  selectedReceiptItem.value = receiptItem
  receiptModalShow.value = true
}

</script>

<template lang="pug">
LayoutWithNav(title="History" back-url="/")
  .flex.flex-column(style="height: 100%;")
    .flex(style="margin: 4px")
      NInput(v-model:value="search" placeholder="Search" @keydown.enter="searchReceiptItems()" style="margin-right: 4px;")
      NButton(type="primary" @click="searchReceiptItems()") Search
    .flex-grow(style="overflow: hidden")
      NScrollbar
        NCard(
          v-for="item in filteredReceiptItems"
          style="margin-bottom:4px"
          @click="showReceiptModal(item.receipt, item)"
        )
          div {{ item.description }}
          div(style="display: flex; justify-content: space-between;")
            div Qty: {{ item.quantity }}
            b ${{ item.amount?.toFixed(2) }}


NModal(
  v-if="selectedReceipt"
  v-model:show="receiptModalShow"
  preset="card"
  style="margin: 20px;"
)
  template(#header)
    div(style="display: flex; align-items: center;")
      div(style="margin-right: 4px;") Transaction Details
  .text-lg {{ selectedReceipt.sellerName }}
  NImage(:src="receiptPhotoUrl" style="width: 100px; height: 100px;")
  .text-right Date: {{ format(selectedReceipt.date, 'yyyy-MM-dd') }}
  .flex.justify-between
    div Tax: ${{ (selectedReceipt.tax || 0).toFixed(2) }}
    b Amount: ${{ selectedReceipt.amount.toFixed(2) }}
  NCard(
    v-for="item in selectedReceipt.items"
    style="margin-bottom:4px"
    :style="{ background: item.id === selectedReceiptItem?.id ? 'lightgreen' : 'white' }"
  )
    div {{ item.description }}
    div(style="display: flex; justify-content: space-between;")
      div Qty: {{ item.quantity }}
      b ${{ item.amount.toFixed(2) }}
</template>

<style scoped>
.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.container {
  padding: 20px;
}

.text-lg {
  font-size: 20px;
  font-weight: bold;
}

.text-right {
  text-align: right;
}

.flex-grow {
  flex-grow: 1;
}

.flex-column {
  flex-direction: column;
}
</style>