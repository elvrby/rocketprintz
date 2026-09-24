
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

export type UserRole =
  | "admin"
  | "operator"
  | "supervisor";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  login: (
    identifier: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext = createContext<
  AuthContextType | undefined
>(undefined);

/**
 * Mengubah input login menjadi format yang konsisten.
 *
 * Contoh:
 * " Alfa "       -> "alfa"
 * "ALFA"         -> "alfa"
 * "Alfa@gmail.com" -> "alfa@gmail.com"
 */
function normalizeLoginInput(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Mengambil profile user dari:
 *
 * users/{uid}
 */
async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid,
    name: data.name ?? "",
    email: data.email ?? "",
    role: data.role as UserRole,
  };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);

  /**
   * Mengecek user Firebase saat aplikasi dibuka.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (!firebaseUser) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          setUser(firebaseUser);

          const userProfile =
            await getUserProfile(firebaseUser.uid);

          setProfile(userProfile);
        } catch (error) {
          console.error(
            "Error loading user profile:",
            error
          );

          setProfile(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  /**
   * LOGIN
   *
   * Bisa menggunakan:
   *
   * email:
   * admin@gmail.com
   *
   * atau name:
   * Admin
   */
  const login = async (
    identifier: string,
    password: string
  ) => {
    const value =
      normalizeLoginInput(identifier);

    let email = value;

    /**
     * Cek apakah input adalah email.
     */
    const isEmail =
      value.includes("@");

    /**
     * Kalau bukan email,
     * anggap sebagai name.
     */
    if (!isEmail) {
      const loginNameRef = doc(
        db,
        "loginNames",
        value
      );

      const loginNameSnapshot =
        await getDoc(loginNameRef);

      if (!loginNameSnapshot.exists()) {
        throw new Error(
          "Nama pengguna tidak ditemukan."
        );
      }

      const loginNameData =
        loginNameSnapshot.data();

      email = loginNameData.email;

      if (!email) {
        throw new Error(
          "Email untuk nama pengguna tidak ditemukan."
        );
      }
    }

    /**
     * Firebase Authentication
     * tetap menggunakan email + password.
     */
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  };

  /**
   * LOGOUT
   */
  const logout = async () => {
    await signOut(auth);

    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth harus digunakan di dalam AuthProvider"
    );
  }

  return context;
}
