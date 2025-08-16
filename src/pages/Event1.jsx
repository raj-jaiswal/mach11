import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Event1() {
  const [active, setActive] = useState(false);
  const [round, setRound] = useState(0);
  const [cash, setCash] = useState(0);
  const [plane, setPlane] = useState("");
  const [amount, setAmount] = useState("");
  const [betLocked, setBetLocked] = useState(false);
  const [teamName, setTeamName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("team");
    if (!stored) return;
    const t = JSON.parse(stored);
    setTeamName(t.teamName);

    const unsubTeam = onSnapshot(doc(db, "teams", t.teamName), (snap) => {
      if (snap.exists()) setCash(snap.data().cash || 0);
    });

    const unsubEvent = onSnapshot(doc(db, "events", "event1"), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() || {};
        setActive(!!data.active);
        const r = data.round || 0;
        setRound(r);

        if (t.teamName && r > 0) {
          const betId = `${r}_${t.teamName}`;
          const betSnap = await getDoc(doc(db, "event1_bets", betId));
          setBetLocked(betSnap.exists());
        } else {
          setBetLocked(false);
        }
      } else {
        setActive(false);
        setRound(0);
        setBetLocked(false);
      }
    });

    return () => {
      unsubTeam();
      unsubEvent();
    };
  }, []);

  const placeBet = async () => {
    if (!teamName) return alert("Please log in again.");
    if (!active) return alert("Betting is not active right now.");
    if (!plane.trim()) return alert("Enter plane number.");
    const amt = Number(amount);
    if (!amt || amt <= 0) return alert("Enter a valid amount.");
    if (amt > cash) return alert("Amount exceeds your current cash.");
    const betId = `${round}_${teamName}`;

    await setDoc(
      doc(db, "event1_bets", betId),
      {
        round,
        teamName,
        plane: plane.trim(),
        amount: amt,
        ts: Date.now(),
      },
      { merge: true }
    );

    setBetLocked(true);
    navigate("/");
  };

  if (!teamName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-6">No team found. Please log in again.</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold mb-4">Round Inactive</h2>
          <p className="text-gray-400 mb-6">
            Please wait for administrators to start the next round.
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (betLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-400 mb-4">Bet Placed!</h2>
          <p className="text-gray-400 mb-2">
            Your bet for <span className="font-bold text-white">Round {round}</span> has been submitted.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Waiting for checkout...
          </p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="card">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.svg" 
                alt="Rocket Boys Logo" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              Round {round}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-gray-400">Available Balance:</span>
              <span className="text-xl font-bold text-green-400">₹{cash}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plane Number
              </label>
              <input
                type="text"
                placeholder="Enter plane number"
                className="w-full"
                value={plane}
                onChange={(e) => setPlane(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bet Amount
              </label>
              <input
                type="number"
                placeholder="Enter amount to bet"
                className="w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={cash}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₹{cash}
              </p>
            </div>

            <button
              onClick={placeBet}
              className="w-full py-4 px-6 text-lg font-semibold btn-success"
            >
              🎯 Place Bet
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-6 text-gray-400 hover:text-white transition-colors duration-200 border border-gray-600 hover:border-gray-400 rounded-xl"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}