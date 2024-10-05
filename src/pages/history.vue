<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { NButton, NCard, NImage, NModal, NPopconfirm, NScrollbar, NTimeline, NTimelineItem } from 'naive-ui'
import { db } from '../composables/db'
import type { Receipt, ReceiptItem } from '../composables/receipt'
import LayoutWithNav from '../components/LayoutWithNav.vue'
import { format } from 'date-fns'
import { groupBy } from 'lodash'

type EnrichedReceipt = Receipt & { items: ReceiptItem[] }

const receipts = ref<EnrichedReceipt[]>([])

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
const receiptPhotoUrl = computed(() => {
  const photo = selectedReceipt.value?.photo
  return photo && URL.createObjectURL(photo)
})

function showReceiptModal(receipt: EnrichedReceipt) {
  selectedReceipt.value = receipt
  receiptModalShow.value = true
}

function deleteReceipt() {
  if (selectedReceipt.value) {
    db.receiptItems.where('receiptId').equals(selectedReceipt.value.id).delete()
    db.receipts.delete(selectedReceipt.value.id)
    receiptModalShow.value = false
    loadReceipts()
  }
}

</script>

<template lang="pug">
LayoutWithNav(title="History" back-url="/")
  NScrollbar
    .container
      NTimeline
        NTimelineItem(
          v-for="transaction in receipts"
          type="error"
          :key="transaction.id"
          :title="transaction.sellerName"
          :content="`$${transaction.amount.toFixed(2)}`"
          :time="format(transaction.date, 'yyyy-MM-dd')"
          @click="showReceiptModal(transaction)"
        )

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
  )
    div {{ item.description }}
    div(style="display: flex; justify-content: space-between;")
      div Qty: {{ item.quantity }}
      b ${{ item.amount.toFixed(2) }}
  template(#footer)
    NPopconfirm(@positive-click="deleteReceipt()")
      div Are you sure to delete this receipt?
      template(#trigger)
        NButton(type="error") Delete
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
</style>