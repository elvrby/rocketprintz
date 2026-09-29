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
  onSnapshot,
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

/* =========================
   NORMALIZE LOGIN INPUT
========================= */

function normalizeLoginInput(value: string) {
  return value.trim().toLowerCase();
}

/* =========================
   GET USER PROFILE
========================= */

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

/* =========================
   AUTH PROVIDER
========================= */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     AUTH STATE LISTENER
  ========================= */

  useEffect(() => {
    let unsubscribeProfile:
      | (() => void)
      | null = null;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (firebaseUser) => {
          console.log(
            "AUTH STATE:",
            firebaseUser
              ? firebaseUser.email
              : "LOGGED OUT"
          );

          /* =========================
             CLEANUP PROFILE LISTENER
          ========================= */

          if (unsubscribeProfile) {
            unsubscribeProfile();
            unsubscribeProfile = null;
          }

          /* =========================
             USER LOGGED OUT
          ========================= */

          if (!firebaseUser) {
            console.log(
              "AuthContext: user logout"
            );

            setUser(null);
            setProfile(null);
            setLoading(false);

            return;
          }

          /* =========================
             USER LOGGED IN
          ========================= */

          setUser(firebaseUser);
          setLoading(true);

          const userRef = doc(
            db,
            "users",
            firebaseUser.uid
          );

          /* =========================
             FIRESTORE PROFILE LISTENER
          ========================= */

          unsubscribeProfile =
            onSnapshot(
              userRef,
              (snapshot) => {
                if (!snapshot.exists()) {
                  console.log(
                    "Profile tidak ditemukan"
                  );

                  setProfile(null);
                  setLoading(false);

                  return;
                }

                const data =
                  snapshot.data();

                const updatedProfile: UserProfile =
                  {
                    uid: firebaseUser.uid,

                    name:
                      data.name ?? "",

                    email:
                      data.email ??
                      firebaseUser.email ??
                      "",

                    role:
                      data.role as UserRole,
                  };

                console.log(
                  "Profile loaded:",
                  updatedProfile
                );

                setProfile(
                  updatedProfile
                );

                setLoading(false);
              },
              (error) => {
                console.error(
                  "Realtime profile listener error:",
                  error
                );

                setProfile(null);
                setLoading(false);
              }
            );
        }
      );

    /* =========================
       CLEANUP
    ========================= */

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }

      unsubscribeAuth();
    };
  }, []);

  /* =========================
     LOGIN
  ========================= */

  const login = async (
    identifier: string,
    password: string
  ) => {
    const value =
      normalizeLoginInput(identifier);

    let email = value;

    const isEmail =
      value.includes("@");

    /* =========================
       LOGIN USING NAME
    ========================= */

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

      email =
        loginNameData.email;

      if (!email) {
        throw new Error(
          "Email untuk nama pengguna tidak ditemukan."
        );
      }
    }

    /* =========================
       FIREBASE LOGIN
    ========================= */

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  };

  /* =========================
     LOGOUT
  ========================= */

  const logout = async () => {
    try {
      console.log(
        "AuthContext: mulai logout..."
      );

      /*
       * Hentikan listener profile
       * sebelum logout.
       */
      if (auth.currentUser) {
        console.log(
          "Current user:",
          auth.currentUser.email
        );
      }

      /*
       * Logout dari Firebase.
       *
       * onAuthStateChanged akan
       * otomatis menerima null.
       */
      await signOut(auth);

      /*
       * Bersihkan state secara manual
       * sebagai tambahan keamanan.
       */
      setUser(null);
      setProfile(null);
      setLoading(false);

      console.log(
        "AuthContext: logout berhasil"
      );
    } catch (error) {
      console.error(
        "AuthContext: logout error:",
        error
      );

      throw error;
    }
  };

  /* =========================
     PROVIDER
  ========================= */

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

/* =========================
   USE AUTH
========================= */

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
