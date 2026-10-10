import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, EvacuationRoute, Shelter, SavedRouteHistoryItem, ChatMessage } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  currentUser: User;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  adminSignIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string, confirmPassword: string) => Promise<User>;
  continueAsGuest: () => void;
  signOut: () => void;
  // Saved shelters
  savedShelterIds: string[];
  toggleSaveShelter: (shelterId: string) => void;
  isShelterSaved: (shelterId: string) => boolean;
  // Routing history
  routeHistory: SavedRouteHistoryItem[];
  addRouteHistory: (route: EvacuationRoute, shelter: Shelter) => void;
  // Chat history
  chatHistory: ChatMessage[];
  saveChatHistory: (messages: ChatMessage[]) => void;
  clearChatHistory: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read session on mount so session persists across refresh
  const [currentUser, setCurrentUser] = useState<User>(() => authService.getCurrentUser());
  const [savedShelterIds, setSavedShelterIds] = useState<string[]>(() =>
    authService.getSavedShelterIds(currentUser.id)
  );
  const [routeHistory, setRouteHistory] = useState<SavedRouteHistoryItem[]>(() =>
    authService.getRouteHistory(currentUser.id)
  );
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() =>
    authService.getChatHistory(currentUser.id)
  );

  // Sync user-specific data whenever currentUser changes
  useEffect(() => {
    if (currentUser.role !== 'guest') {
      setSavedShelterIds(authService.getSavedShelterIds(currentUser.id));
      setRouteHistory(authService.getRouteHistory(currentUser.id));
      setChatHistory(authService.getChatHistory(currentUser.id));
    } else {
      setSavedShelterIds([]);
      setRouteHistory([]);
      setChatHistory([]);
    }
  }, [currentUser.id, currentUser.role]);

  const signIn = async (email: string, password: string): Promise<User> => {
    const user = await authService.signIn(email, password);
    setCurrentUser(user);
    return user;
  };

  const adminSignIn = async (email: string, password: string): Promise<User> => {
    const user = await authService.adminSignIn(email, password);
    setCurrentUser(user);
    return user;
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User> => {
    const user = await authService.signUp(name, email, password, confirmPassword);
    setCurrentUser(user);
    return user;
  };

  const continueAsGuest = () => {
    const guest = authService.continueAsGuest();
    setCurrentUser(guest);
  };

  const signOut = () => {
    const guest = authService.signOut();
    setCurrentUser(guest);
  };

  const toggleSaveShelter = (shelterId: string) => {
    if (currentUser.role === 'guest') return;
    const updated = authService.toggleSaveShelter(currentUser.id, shelterId);
    setSavedShelterIds(updated);
  };

  const isShelterSaved = (shelterId: string): boolean => {
    return savedShelterIds.includes(shelterId);
  };

  const addRouteHistory = (route: EvacuationRoute, shelter: Shelter) => {
    if (currentUser.role === 'guest') return;
    const updated = authService.addRouteHistory(currentUser.id, route, shelter);
    setRouteHistory(updated);
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    if (currentUser.role === 'guest') return;
    authService.saveChatHistory(currentUser.id, messages);
    setChatHistory(messages);
  };

  const clearChatHistory = () => {
    authService.clearChatHistory(currentUser.id);
    setChatHistory([]);
  };

  const isAuthenticated = currentUser.role !== 'guest';
  const isAdmin = currentUser.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isAdmin,
        signIn,
        adminSignIn,
        signUp,
        continueAsGuest,
        signOut,
        savedShelterIds,
        toggleSaveShelter,
        isShelterSaved,
        routeHistory,
        addRouteHistory,
        chatHistory,
        saveChatHistory,
        clearChatHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
