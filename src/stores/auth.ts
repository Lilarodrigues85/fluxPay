import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth'
import { auth, db } from '../services/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import type { User } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)
  let initialized = false

  const isAuthenticated = computed(() => user.value !== null)

  const initializeAuth = (): Promise<void> => {
    if (initialized) return Promise.resolve()
    initialized = true
    isLoading.value = true

    return new Promise((resolve) => {
      let resolved = false
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid)
          const userSnap = await getDoc(userRef)

          if (!userSnap.exists()) {
            const newUser: User = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              createdAt: Date.now(),
              settings: {
                currency: 'BRL',
                theme: 'light',
              },
            }
            await setDoc(userRef, newUser)
            user.value = newUser
          } else {
            user.value = userSnap.data() as User
          }
        } else {
          user.value = null
        }
        isLoading.value = false
        isReady.value = true
        if (!resolved) {
          resolved = true
          resolve()
        }
      })
    })
  }

  const loginWithGoogle = async () => {
    isLoading.value = true
    error.value = null
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      error.value = (err as Error).message
      console.error('Login failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await signOut(auth)
      user.value = null
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isReady,
    error,
    initializeAuth,
    loginWithGoogle,
    logout,
  }
})
