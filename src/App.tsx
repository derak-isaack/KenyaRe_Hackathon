import * as React from "react";
import AuthScreen from "./components/AuthScreen";
import { MainDashboard } from "./components/MainDashboard";
import type { UserData } from "./types";

export default function App() {
  const [user, setUser] = React.useState<UserData | null>(null);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
  };

  const handleLogout = () => setUser(null);

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  return <MainDashboard user={user} onLogout={handleLogout} />;
}
