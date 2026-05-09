import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore'
import { GoogleAuthProvider, reauthenticateWithPopup, deleteUser } from 'firebase/auth'
import { auth, db } from './firebase'

const SUBCOLLECTIONS = ['transactions', 'expenses', 'savings', 'projects', 'categories']

async function deleteSubcollection(userId: string, name: string): Promise<number> {
  const ref = collection(db, `users/${userId}/${name}`)
  const snap = await getDocs(ref)
  if (snap.empty) return 0

  // Firestore batch limit is 500 ops
  let total = 0
  let batch = writeBatch(db)
  let count = 0
  for (const d of snap.docs) {
    batch.delete(d.ref)
    count++
    total++
    if (count === 450) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }
  if (count > 0) await batch.commit()
  return total
}

export async function wipeUserData(userId: string): Promise<{ total: number }> {
  let total = 0
  for (const name of SUBCOLLECTIONS) {
    total += await deleteSubcollection(userId, name)
  }
  return { total }
}

export async function deleteAccount(userId: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('Sessão expirada')

  // Re-auth com Google (necessário pra deletar conta)
  try {
    const provider = new GoogleAuthProvider()
    await reauthenticateWithPopup(user, provider)
  } catch (err) {
    throw new Error('Confirme sua identidade para excluir a conta. ' + (err as Error).message)
  }

  await wipeUserData(userId)
  await deleteDoc(doc(db, `users/${userId}`))
  await deleteUser(user)
}
