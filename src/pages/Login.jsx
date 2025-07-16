import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const users = [
  { username: "admin", password: "admin123" },
  { username: "user1", password: "pass1" },
  { username: "tod", password: "1699" },

  { username: "lfo", password: "0612" },
  { username: "did", password: "8959" },
  { username: "iia", password: "6624" },
  { username: "mba", password: "0641" },
  { username: "omo", password: "0800" },
  { username: "san", password: "8507" },
  { username: "rna", password: "1235" },
  { username: "isi", password: "0792" },
  { username: "tor", password: "0508" },
  { username: "rva", password: "0839" },
];


export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem("loggedInUser");
    if (loggedInUser) {
      // Ако вече има логнат потребител, пренасочи към dashboard
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); // Изчистваме грешката при нов submit

    const user = users.find(
      (u) => u.username === username.trim() && u.password === password
    );

    if (user) {
      try {
        localStorage.setItem("loggedInUser", user.username);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("localStorage set error:", error);
        setError("Failed to save login state.");
      }
    } else {
      setError("Incorrect username or password");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h2>Login</h2>
      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              autoComplete="username"
            />
          </label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8, marginTop: 4 }}
              autoComplete="current-password"
            />
          </label>
        </div>
        <button
          type="submit"
          style={{ padding: 10, width: "100%", cursor: "pointer" }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
