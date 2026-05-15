import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { Expense } from '../types'

const expensesCollection = (userId: string) => collection(db, `users/${userId}/expenses`)
const savingsDoc = (userId: string, id: string) => doc(db, `users/${userId}/savings/${id}`)

function shouldDebitAccount(paymentMethod: string, linkedAccountId: string | null | undefined): boolean {
  return !!linkedAccountId && paymentMethod !== 'Crédito'
}

export async function createExpense(
  userId: string,
  data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const batch = writeBatch(db)
  const now = Date.now()
  const expRef = doc(expensesCollection(userId))
  batch.set(expRef, { ...data, userId, createdAt: now, updatedAt: now })

  if (shouldDebitAccount(data.paymentMethod, data.linkedAccountId)) {
    batch.update(savingsDoc(userId, data.linkedAccountId!), {
      amount: increment(-data.amount),
      lastValueUpdate: now,
      updatedAt: now,
    })
  }

  await batch.commit()
  return expRef.id
}

export async function updateExpense(
  userId: string,
  id: string,
  oldExpense: Expense,
  newData: Partial<Expense>
): Promise<void> {
  const batch = writeBatch(db)
  const now = Date.now()
  const expRef = doc(db, `users/${userId}/expenses/${id}`)
  batch.update(expRef, { ...newData, updatedAt: now })

  const oldDebited = shouldDebitAccount(oldExpense.paymentMethod, oldExpense.linkedAccountId)
  const newPaymentMethod = newData.paymentMethod ?? oldExpense.paymentMethod
  const newLinkedAccountId = newData.linkedAccountId !== undefined
    ? newData.linkedAccountId
    : oldExpense.linkedAccountId
  const newAmount = newData.amount ?? oldExpense.amount
  const newDebited = shouldDebitAccount(newPaymentMethod, newLinkedAccountId)

  // Devolve o débito antigo se aplicável
  if (oldDebited) {
    batch.update(savingsDoc(userId, oldExpense.linkedAccountId!), {
      amount: increment(oldExpense.amount),
      lastValueUpdate: now,
      updatedAt: now,
    })
  }

  // Aplica o novo débito se aplicável
  if (newDebited) {
    batch.update(savingsDoc(userId, newLinkedAccountId!), {
      amount: increment(-newAmount),
      lastValueUpdate: now,
      updatedAt: now,
    })
  }

  await batch.commit()
}

export async function deleteExpense(
  userId: string,
  id: string,
  oldExpense?: Expense
): Promise<void> {
  if (!oldExpense || !shouldDebitAccount(oldExpense.paymentMethod, oldExpense.linkedAccountId)) {
    const ref = doc(db, `users/${userId}/expenses/${id}`)
    await deleteDoc(ref)
    return
  }

  const batch = writeBatch(db)
  const now = Date.now()
  batch.delete(doc(db, `users/${userId}/expenses/${id}`))
  batch.update(savingsDoc(userId, oldExpense.linkedAccountId!), {
    amount: increment(oldExpense.amount),
    lastValueUpdate: now,
    updatedAt: now,
  })
  await batch.commit()
}

export async function reconcileExpenses(
  userId: string,
  expensesToLink: Expense[],
  accountId: string
): Promise<{ count: number; total: number }> {
  const now = Date.now()
  let count = 0
  let totalDebit = 0
  let batch = writeBatch(db)
  let ops = 0

  for (const exp of expensesToLink) {
    const expRef = doc(db, `users/${userId}/expenses/${exp.id}`)
    batch.update(expRef, { linkedAccountId: accountId, updatedAt: now })
    totalDebit += exp.amount
    count++
    ops++
    if (ops >= 400) {
      batch.update(savingsDoc(userId, accountId), {
        amount: increment(-totalDebit),
        lastValueUpdate: now,
        updatedAt: now,
      })
      await batch.commit()
      batch = writeBatch(db)
      ops = 0
      totalDebit = 0
    }
  }

  if (ops > 0 || totalDebit > 0) {
    if (totalDebit > 0) {
      batch.update(savingsDoc(userId, accountId), {
        amount: increment(-totalDebit),
        lastValueUpdate: now,
        updatedAt: now,
      })
    }
    await batch.commit()
  }

  return { count, total: expensesToLink.reduce((s, e) => s + e.amount, 0) }
}

export { updateDoc, deleteDoc }

export function subscribeExpenses(
  userId: string,
  callback: (items: Expense[]) => void
): Unsubscribe {
  const q = query(expensesCollection(userId), orderBy('date', 'desc'))
  return onSnapshot(q, (snap) => {
    const items: Expense[] = []
    snap.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as Expense)
    })
    callback(items)
  })
}
