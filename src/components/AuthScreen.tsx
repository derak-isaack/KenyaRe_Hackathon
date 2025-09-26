import * as React from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { UserData } from "../types";
import { apiService } from "../services/api";

type AuthScreenProps = {
  onLogin: (user: UserData) => void;
};

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [tab, setTab] = React.useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [login, setLogin] = React.useState({ username: "", password: "" });
  const [register, setRegister] = React.useState({
    name: "",
    email: "",
    password: "",
  });

  // ----- handlers (typed) -----
  const onLoginUsername = (e: ChangeEvent<HTMLInputElement>) =>
    setLogin((s) => ({ ...s, username: e.target.value }));
  const onLoginPassword = (e: ChangeEvent<HTMLInputElement>) =>
    setLogin((s) => ({ ...s, password: e.target.value }));

  const onRegisterName = (e: ChangeEvent<HTMLInputElement>) =>
    setRegister((s) => ({ ...s, name: e.target.value }));
  const onRegisterEmail = (e: ChangeEvent<HTMLInputElement>) =>
    setRegister((s) => ({ ...s, email: e.target.value }));
  const onRegisterPassword = (e: ChangeEvent<HTMLInputElement>) =>
    setRegister((s) => ({ ...s, password: e.target.value }));

  const submitLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!login.username || !login.password) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.login(login.username, login.password);

      if (response.status === 'success') {
        onLogin({
          name: login.username,
          email: login.username.includes('@') ? login.username : `${login.username}@company.com`,
          role: login.username === 'admin' ? 'Administrator' : 'Analyst'
        });
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!register.name || !register.email || !register.password) return;

    // For demo purposes, just log them in
    onLogin({
      name: register.name,
      email: register.email,
      role: 'Analyst'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Hakika claims</h1>
          <p className="text-gray-600">Advanced Fraud Detection & Risk Analytics</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur rounded-xl shadow-md border border-gray-200 p-2">
          <div className="grid grid-cols-2 gap-2 p-1">
            <button
              className={`py-2 rounded-lg text-sm font-medium transition ${tab === "login"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setTab("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`py-2 rounded-lg text-sm font-medium transition ${tab === "register"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700 hover:bg-gray-100"
                }`}
              onClick={() => setTab("register")}
              type="button"
            >
              Register
            </button>
          </div>

          {/* Content */}
          {tab === "login" ? (
            <div className="p-4 pt-2">
              <div className="space-y-1 mb-4">
                <h2 className="text-lg font-semibold">Welcome back</h2>
                <p className="text-sm text-gray-600">
                  Enter your credentials to access the system
                </p>
              </div>

              <form className="space-y-4" onSubmit={submitLogin}>
                {error && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="login-username" className="text-sm font-medium">
                    Enter your username
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    value={login.username}
                    onChange={onLoginUsername}
                    required
                    disabled={isLoading}
                    className="w-full h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="admin, analyst, or manager"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Enter your password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={login.password}
                    onChange={onLoginPassword}
                    required
                    disabled={isLoading}
                    className="w-full h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                <p className="text-center text-xs text-gray-500 mt-2">
                </p>
              </form>
            </div>
          ) : (
            <div className="p-4 pt-2">
              <div className="space-y-1 mb-4">
                <h2 className="text-lg font-semibold">Create account</h2>
                <p className="text-sm text-gray-600">Register for system access</p>
              </div>

              <form className="space-y-4" onSubmit={submitRegister}>
                <div className="space-y-1">
                  <label htmlFor="reg-name" className="text-sm font-medium">
                    Enter your full name
                  </label>
                  <input
                    id="reg-name"
                    value={register.name}
                    onChange={onRegisterName}
                    required
                    className="w-full h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Jane Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-sm font-medium">
                    Enter your email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={register.email}
                    onChange={onRegisterEmail}
                    required
                    className="w-full h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-password" className="text-sm font-medium">
                    Create a password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    value={register.password}
                    onChange={onRegisterPassword}
                    required
                    className="w-full h-10 rounded-md border border-gray-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-10 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition"
                >
                  Create Account
                </button>

                <p className="text-center text-xs text-gray-500 mt-2">
                  Demo credentials: any email/password combination
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
