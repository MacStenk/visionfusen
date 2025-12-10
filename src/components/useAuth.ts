import { useEffect, useState } from 'react';

interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  pubkey: string | null;
  username: string | null;
  loginMethod: 'password' | 'extension' | null;
}

export function useAuth(redirectIfNotLoggedIn = true): AuthState {
  const [state, setState] = useState<AuthState>({
    isLoggedIn: false,
    isLoading: true,
    pubkey: null,
    username: null,
    loginMethod: null,
  });

  useEffect(() => {
    const checkAuth = () => {
      const sessionActive = localStorage.getItem('nostr_session_active');
      const pubkey = localStorage.getItem('nostr_pubkey');
      const username = localStorage.getItem('visionfusen_username');
      const loginMethod = localStorage.getItem('nostr_login_method') as 'password' | 'extension' | null;

      if (sessionActive === 'true' && pubkey) {
        setState({
          isLoggedIn: true,
          isLoading: false,
          pubkey,
          username,
          loginMethod,
        });
      } else {
        setState({
          isLoggedIn: false,
          isLoading: false,
          pubkey: null,
          username: null,
          loginMethod: null,
        });

        // Redirect to login if not authenticated
        if (redirectIfNotLoggedIn) {
          window.location.href = '/login';
        }
      }
    };

    checkAuth();
  }, [redirectIfNotLoggedIn]);

  return state;
}

export function logout() {
  localStorage.removeItem('nostr_session_active');
  localStorage.removeItem('nostr_pubkey');
  localStorage.removeItem('nostr_login_method');
  // Keep encrypted key and username for future logins on this device
  window.location.href = '/';
}
