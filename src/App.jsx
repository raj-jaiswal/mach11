import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { db } from "./firebase/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";

import Login from "./pages/Login";
import Event1 from "./pages/Event1";
import Leaderboard from "./pages/Leaderboard";
import AdminEvent1 from "./pages/AdminEvent1";

function App() {
  const [team, setTeam] = useState(null);        // { teamName, rolls, instituteEmail }
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
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
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
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                  <div className="bg-white text-black shadow-lg rounded-2xl p-6 w-full max-w-md mx-auto">
                    <h1 className="text-2xl font-bold text-center mb-1">
                      Welcome, {team.teamName}!
                    </h1>
                    <p className="text-center mb-6">
                      Current Cash: <span className="font-semibold">₹{cash ?? "—"}</span>
                    </p>

                    <div className="flex flex-col gap-3">
                      <Link to="/event1" className="bg-blue-500 !text-white p-3 rounded-lg text-center hover:bg-blue-600">
                        Start Round
                      </Link>
                    </div>

                    <Link
                      to="/leaderboard"
                      className="mt-5 block bg-black !text-white p-3 rounded-lg text-center hover:bg-orange-600"
                    >
                      Leaderboard
                    </Link>
                  </div>
                </div>
              }
            />

            <Route path="/event1" element={<Event1 />} />

            <Route path="/leaderboard" element={<Leaderboard />} />

            {/* secret-ish admin route: no visible links */}
            <Route path="/adminEvent1" element={<AdminEvent1 />} />


            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
