// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { auth } from "../firebase/config";

import {
  getUserProfile,
} from "../firebase/firestore";

import {
  logout as firebaseLogout,
} from "../firebase/auth";

import {
  UserProfile,
} from "../types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

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

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {

          try {

            setUser(firebaseUser);

            if (firebaseUser) {

              const userProfile =
                await getUserProfile(
                  firebaseUser.uid
                );

              setProfile(userProfile);

            } else {

              setProfile(null);

            }

          } catch (error) {

            console.error(
              "Auth error:",
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

  const logout = async () => {

    await firebaseLogout();

    setUser(null);
    setProfile(null);

  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
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