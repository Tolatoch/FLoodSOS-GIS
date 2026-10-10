import { User, EvacuationRoute, Shelter, SavedRouteHistoryItem, ChatMessage } from '../types';

/**
 * FloodSOS GIS Authentication Service
 * 
 * Encapsulates mock authentication, role-based access control, session storage,
 * and user-specific persistence (saved shelters, route history, chat history).
 * Designed for straightforward migration to a FastAPI / OAuth backend.
 */

interface StoredUserAccount extends User {
  passwordHash: string; // Plain/hash for mock authentication
}

// Seeded administrator account (kept strictly in this service, NEVER displayed in UI)
const SEEDED_ADMIN: StoredUserAccount = {
  id: 'usr-admin-01',
  name: 'Admin GIS Center',
  email: 'admin@floodsos.go.th',
  passwordHash: 'admin1234',
  role: 'admin',
  createdAt: '2026-09-01T08:00:00Z',
  token: 'mock-jwt-admin-floodsos-2026',
};

// Seeded demonstration regular user
const SEEDED_USER: StoredUserAccount = {
  id: 'usr-user-01',
  name: 'Somchai Jaidee',
  email: 'user@floodsos.go.th',
  passwordHash: 'user1234',
  role: 'user',
  createdAt: '2026-10-01T08:00:00Z',
  token: 'mock-jwt-user-floodsos-2026',
};

const GUEST_USER: User = {
  id: 'guest-01',
  name: 'Guest User',
  email: 'guest@floodsos.local',
  role: 'guest',
  createdAt: '2026-10-01T00:00:00Z',
};

const SESSION_KEY = 'floodsos_auth_session';
const REGISTERED_USERS_KEY = 'floodsos_registered_users';
const SAVED_SHELTERS_KEY_PREFIX = 'floodsos_saved_shelters_';
const ROUTE_HISTORY_KEY_PREFIX = 'floodsos_route_history_';
const CHAT_HISTORY_KEY_PREFIX = 'floodsos_chat_history_';

class AuthService {
  private getRegisteredUsers(): StoredUserAccount[] {
    try {
      const stored = localStorage.getItem(REGISTERED_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [SEEDED_ADMIN, SEEDED_USER];
  }

  private saveRegisteredUsers(users: StoredUserAccount[]): void {
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save registered users to localStorage', e);
    }
  }

  /**
   * Retrieves the current session user from localStorage, or returns Guest
   */
  public getCurrentUser(): User {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed: User = JSON.parse(session);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return { ...GUEST_USER };
  }

  /**
   * Persists active user session across browser reload
   */
  public saveSession(user: User): void {
    try {
      if (user.role === 'guest') {
        localStorage.removeItem(SESSION_KEY);
      } else {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Failed to persist session', e);
    }
  }

  /**
   * Clears the user session and resets to Guest
   */
  public signOut(): User {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn('Failed to remove session', e);
    }
    return { ...GUEST_USER };
  }

  /**
   * Standard citizen sign in (Email + Password)
   */
  public async signIn(email: string, password: string): Promise<User> {
    // Artificial latency for authentic network feel
    await new Promise((resolve) => setTimeout(resolve, 250));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('MISSING_FIELDS');
    }

    const allUsers = this.getRegisteredUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found || found.passwordHash !== cleanPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      createdAt: found.createdAt,
      token: found.token || `jwt-${found.id}-${Date.now()}`,
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  /**
   * Dedicated Admin sign in at /admin/login
   * Ensures account possesses 'admin' privileges
   */
  public async adminSignIn(email: string, password: string): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      throw new Error('MISSING_FIELDS');
    }

    const allUsers = this.getRegisteredUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found || found.passwordHash !== cleanPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (found.role !== 'admin') {
      throw new Error('UNAUTHORIZED_ADMIN');
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: 'admin',
      createdAt: found.createdAt,
      token: found.token || `jwt-admin-${Date.now()}`,
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  /**
   * Register a new Citizen account (Sign Up)
   */
  public async signUp(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanName) {
      throw new Error('NAME_REQUIRED');
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new Error('INVALID_EMAIL');
    }

    if (cleanPassword.length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }

    if (cleanPassword !== cleanConfirm) {
      throw new Error('PASSWORD_MISMATCH');
    }

    const allUsers = this.getRegisteredUsers();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const newUser: StoredUserAccount = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: cleanPassword,
      role: 'user',
      createdAt: new Date().toISOString(),
      token: `jwt-${Date.now()}`,
    };

    allUsers.push(newUser);
    this.saveRegisteredUsers(allUsers);

    const sessionUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'user',
      createdAt: newUser.createdAt,
      token: newUser.token,
    };

    this.saveSession(sessionUser);
    return sessionUser;
  }

  /**
   * Returns a guest session object
   */
  public continueAsGuest(): User {
    const guest = { ...GUEST_USER };
    this.saveSession(guest);
    return guest;
  }

  // ==========================================
  // Saved Shelters (User specific)
  // ==========================================

  public getSavedShelterIds(userId: string): string[] {
    if (!userId || userId === 'guest-01') return [];
    try {
      const stored = localStorage.getItem(`${SAVED_SHELTERS_KEY_PREFIX}${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public toggleSaveShelter(userId: string, shelterId: string): string[] {
    if (!userId || userId === 'guest-01') return [];
    const current = this.getSavedShelterIds(userId);
    let updated: string[];
    if (current.includes(shelterId)) {
      updated = current.filter((id) => id !== shelterId);
    } else {
      updated = [...current, shelterId];
    }
    try {
      localStorage.setItem(`${SAVED_SHELTERS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save shelters', e);
    }
    return updated;
  }

  // ==========================================
  // Evacuation Routing History (User specific)
  // ==========================================

  public getRouteHistory(userId: string): SavedRouteHistoryItem[] {
    if (!userId || userId === 'guest-01') return [];
    try {
      const stored = localStorage.getItem(`${ROUTE_HISTORY_KEY_PREFIX}${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public addRouteHistory(userId: string, route: EvacuationRoute, shelter: Shelter): SavedRouteHistoryItem[] {
    if (!userId || userId === 'guest-01') return [];
    const current = this.getRouteHistory(userId);
    const newItem: SavedRouteHistoryItem = {
      id: `rh-${Date.now()}`,
      timestamp: new Date().toISOString(),
      shelterId: shelter.id,
      shelterNameTh: shelter.nameTh,
      shelterNameEn: shelter.nameEn,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      origin: route.origin,
      destination: route.destination,
    };

    // Keep up to 15 recent routes
    const updated = [newItem, ...current.filter((item) => item.shelterId !== shelter.id)].slice(0, 15);
    try {
      localStorage.setItem(`${ROUTE_HISTORY_KEY_PREFIX}${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save route history', e);
    }
    return updated;
  }

  // ==========================================
  // AI Chat History (User specific)
  // ==========================================

  public getChatHistory(userId: string): ChatMessage[] {
    if (!userId || userId === 'guest-01') return [];
    try {
      const stored = localStorage.getItem(`${CHAT_HISTORY_KEY_PREFIX}${userId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  }

  public saveChatHistory(userId: string, messages: ChatMessage[]): void {
    if (!userId || userId === 'guest-01') return;
    try {
      localStorage.setItem(`${CHAT_HISTORY_KEY_PREFIX}${userId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  }

  public clearChatHistory(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(`${CHAT_HISTORY_KEY_PREFIX}${userId}`);
    } catch (e) {
      console.warn('Failed to clear chat history', e);
    }
  }
}

export const authService = new AuthService();
