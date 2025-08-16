import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { db } from "./firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

import Login from "./pages/Login";
import Event1 from "./pages/Event1";
import Leaderboard from "./pages/Leaderboard";
import AdminEvent1 from "./pages/AdminEvent1";

function App() {
  const [team, setTeam] = useState(null);
  const [cash, setCash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("team");
    if (!stored) {
      setLoading(false);
      return;
    }
    const parsed = JSON.parse(stored);
    setTeam(parsed);

    const unsub = onSnapshot(doc(db, "teams", parsed.teamName), (snap) => {
      if (snap.exists()) {
        setCash(snap.data().cash);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogin = (teamObj) => {
    localStorage.setItem("team", JSON.stringify(teamObj));
    setTeam(teamObj);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-xl font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {!team ? (
          <>
            <Route path="/" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="w-full max-w-md fade-in">
                    <div className="card text-center">
                      <div className="mb-6">
                        <div className="flex justify-center mb-4">
                          <img 
                            src="/logo.svg" 
                            alt="Rocket Boys Logo" 
                            className="w-20 h-20 object-contain"
                          />
                        </div>
                        <h1 className="text-3xl font-bold gradient-text mb-2">
                          ROCKET BOYS
                        </h1>
                        <p className="text-xl font-semibold text-white mb-1">
                          {team.teamName}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-6">
                          <span className="text-gray-400">Current Balance:</span>
                          <span className="text-2xl font-bold text-green-400">
                            ₹{cash ?? "—"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Link 
                          to="/event1" 
                          className="block w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                         Start Round
                        </Link>

                        <Link
                          to="/leaderboard"
                          className="block w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        >
                          Leaderboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              }
            />

            <Route path="/event1" element={<Event1 />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/adminEvent1" element={<AdminEvent1 />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;