# Guia: Persistência de Login + Perfis Clicáveis

## 1. Persistência de Login (não deslogar no refresh)

### Opção A: Context API + localStorage (mais simples)

**`src/contexts/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "@aldeario:auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaura sessão ao carregar
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { user, token } = JSON.parse(stored);
        setUser(user);
        // Opcional: validar token com backend aqui
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider");
  return context;
};
```

**`src/App.tsx` — Proteger rotas**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div>Carregando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route path="/perfil/:userId" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

**`src/pages/LoginPage.tsx` — Exemplo de uso**

```tsx
import { useAuth } from "../contexts/AuthContext";

function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async (credentials) => {
    const res = await fetch("/api/login", { ... });
    const data = await res.json();
    login(data.user, data.token); // Agora persiste!
  };
}
```

---

### Opção B: Zustand + Persist (mais robusto)

```bash
npm install zustand
```

**`src/store/authStore.ts`**

```tsx
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "@aldeario:auth", // chave no localStorage
    }
  )
);
```

---

## 2. Bolinhas de Perfil Clicáveis

### Componente Avatar Reutilizável

**`src/components/UserAvatar.tsx`**

```tsx
import { useNavigate } from "react-router-dom";

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  };
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  clickable?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

export function UserAvatar({ user, size = "md", showName = false, clickable = true }: UserAvatarProps) {
  const navigate = useNavigate();

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleClick = () => {
    if (clickable) {
      navigate(`/perfil/${user.id}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center font-medium
          ${user.avatar ? "" : (user.color || "bg-emerald-600 text-white")}
          ${clickable ? "cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:scale-105 transition-all" : "cursor-default"}
          overflow-hidden
        `}
        title={clickable ? `Ver perfil de ${user.name}` : undefined}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {showName && (
        <span 
          onClick={clickable ? handleClick : undefined}
          className={clickable ? "cursor-pointer hover:text-emerald-600 transition-colors" : ""}
        >
          {user.name}
        </span>
      )}
    </div>
  );
}
```

### Uso no Mapa/Lista de Pessoas

**`src/components/PeopleMap.tsx`**

```tsx
import { UserAvatar } from "./UserAvatar";

const people = [
  { id: "1", name: "Ana Silva", avatar: "/avatars/ana.jpg", x: 120, y: 200 },
  { id: "2", name: "João Pedro", color: "bg-blue-600 text-white", x: 300, y: 150 },
];

export function PeopleMap() {
  return (
    <div className="relative w-full h-[600px] bg-stone-100 rounded-xl">
      {people.map((person) => (
        <div
          key={person.id}
          className="absolute"
          style={{ left: person.x, top: person.y }}
        >
          <div className="flex flex-col items-center gap-1 group">
            <UserAvatar user={person} size="lg" />
            {/* Tooltip ao hover */}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-black/75 text-white px-2 py-1 rounded-full whitespace-nowrap">
              {person.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Página de Perfil

**`src/pages/ProfilePage.tsx`**

```tsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setProfile);
  }, [userId]);

  if (!profile) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            profile.name.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <p className="text-stone-500">{profile.role || "Membro"}</p>
        </div>
      </div>
      {/* Mais info... */}
    </div>
  );
}
```

---

## Resumo das Mudanças

| Problema | Solução | Arquivos |
|----------|---------|----------|
| Desloga no refresh | Persistir auth no localStorage | `AuthContext.tsx` ou `authStore.ts` |
| Bolinhas sem ação | Envelopar em `<button>` com `useNavigate` | `UserAvatar.tsx` |
| Rotas de perfil | Adicionar `/perfil/:userId` | `App.tsx` + `ProfilePage.tsx` |

## Dicas de Segurança

1. **Token expirado**: No `useEffect` do AuthContext, faça uma requisição silenciosa ao backend para validar o token ao carregar.
2. **Logout automático**: Se o backend retornar 401, chame `logout()` imediatamente.
3. **Dados sensíveis**: Nunca armazene senhas no localStorage. Apenas token JWT e dados públicos do usuário.

---
*Gerado para projeto Aldeario / Ecovila Terra de Canaã*
