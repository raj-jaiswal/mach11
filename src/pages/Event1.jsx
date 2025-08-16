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

    // team cash
    const unsubTeam = onSnapshot(doc(db, "teams", t.teamName), (snap) => {
      if (snap.exists()) setCash(snap.data().cash || 0);
    });

    // event state
    const unsubEvent = onSnapshot(doc(db, "events", "event1"), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() || {};
        setActive(!!data.active);
        const r = data.round || 0;
        setRound(r);

        // lock if already bet this round
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

    // create or overwrite this team's bet for current round
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
      <div className="p-4 text-center">
        No team found. Please log in again.
      </div>
    );
  }

  if (!active) {
    return (
      <div className="p-4 text-center">
        Round isn’t active yet. Please wait for admins to start the round.
      </div>
    );
  }

  if (betLocked) {
    return (
      <div className="p-4 text-center">
        You’ve already placed a bet for round {round}. Waiting for checkout…
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Round {round}</h2>
      <p className="mb-4">Your Cash: <strong>₹{cash}</strong></p>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Plane Number"
          className="border rounded-lg p-2 w-full"
          value={plane}
          onChange={(e) => setPlane(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount"
          className="border rounded-lg p-2 w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
        />
        <button
          onClick={placeBet}
          className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700"
        >
          Place Bet
        </button>
      </div>
    </div>
  );
}
