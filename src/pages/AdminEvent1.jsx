import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export default function AdminEvent1() {
  const [active, setActive] = useState(false);
  const [round, setRound] = useState(0);
  const [bets, setBets] = useState([]);
  const [loadingBets, setLoadingBets] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "event1"), (snap) => {
      const data = snap.data() || {};
      setActive(!!data.active);
      setRound(data.round || 0);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!round) {
      setBets([]);
      setLoadingBets(false);
      return;
    }
    setLoadingBets(true);
    const q = query(collection(db, "event1_bets"), where("round", "==", round));
    getDocs(q).then((snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBets(list);
      setLoadingBets(false);
    });
  }, [round, active]);

  const startRound = async () => {
    const ref = doc(db, "events", "event1");
    const snap = await getDoc(ref);
    const current = snap.exists() ? (snap.data().round || 0) : 0;
    const nextRound = current + 1;
    await setDoc(ref, { active: true, round: nextRound }, { merge: true });
    setActive(true);
    setRound(nextRound);
  };

  const stopRound = async () => {
    await setDoc(doc(db, "events", "event1"), { active: false }, { merge: true });
    setActive(false);
  };

  const checkout = async () => {
    if (!round) return alert("No active round to checkout.");
    
    const q = query(collection(db, "event1_bets"), where("round", "==", round));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (list.length === 0) {
      await setDoc(doc(db, "events", "event1"), { active: false }, { merge: true });
      alert("No bets placed this round. Stopping the event.");
      setActive(false);
      return;
    }

    const winningPlane = prompt("Enter winning plane number:");
    if (!winningPlane) return;

    const winners = list.filter((b) => String(b.plane).trim() === String(winningPlane).trim());
    const losers = list.filter((b) => String(b.plane).trim() !== String(winningPlane).trim());

    const totalWinners = winners.reduce((s, b) => s + Number(b.amount || 0), 0);
    const totalLosers = losers.reduce((s, b) => s + Number(b.amount || 0), 0);

    for (const bet of losers) {
      const teamRef = doc(db, "teams", bet.teamName);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) continue;
      const currentCash = teamSnap.data().cash || 0;
      await updateDoc(teamRef, { cash: currentCash - Number(bet.amount || 0) });
    }

    if (winners.length && totalWinners > 0 && totalLosers > 0) {
      for (const bet of winners) {
        const teamRef = doc(db, "teams", bet.teamName);
        const teamSnap = await getDoc(teamRef);
        if (!teamSnap.exists()) continue;
        const currentCash = teamSnap.data().cash || 0;
        const gain = (Number(bet.amount || 0) / totalWinners) * totalLosers;
        await updateDoc(teamRef, { cash: currentCash + gain });
      }
    }

    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "event1_bets", d.id));
    }

    await setDoc(doc(db, "events", "event1"), { active: false }, { merge: true });
    setActive(false);
    setBets([]);

    alert("Checkout complete. Round cleared and event stopped.");
  };

  const totals = useMemo(() => {
    const map = new Map();
    for (const b of bets) {
      const key = String(b.plane);
      map.set(key, (map.get(key) || 0) + Number(b.amount || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [bets]);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.svg" 
              alt="Rocket Boys Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">⚙️ Admin Panel</h1>
          <p className="text-gray-400">ROCKET BOYS - Event Management</p>
        </div>

        {/* Status Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Event Status</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={active ? "status-active" : "status-inactive"}>
                    {active ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Round:</span>
                  <span className="text-white font-bold text-lg">#{round}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!active ? (
              <button onClick={startRound} className="btn-success">
                ▶️ Start New Round
              </button>
            ) : (
              <button onClick={stopRound} className="btn-warning">
                ⏸️ Stop Round
              </button>
            )}
            <button onClick={checkout} className="btn-danger">
              💰 Checkout & Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bets Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Current Bets</h3>
              <span className="text-sm text-gray-400">Round {round}</span>
            </div>
            
            {loadingBets ? (
              <div className="text-center py-8">
                <div className="loading mb-4"></div>
                <p className="text-gray-400">Loading bets...</p>
              </div>
            ) : bets.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-400">No bets placed yet</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-600">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="text-left py-3 px-4 text-sm">Team</th>
                      <th className="text-center py-3 px-4 text-sm">Plane</th>
                      <th className="text-right py-3 px-4 text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((bet) => (
                      <tr key={bet.id} className="border-t border-gray-700 hover:bg-blue-500/10">
                        <td className="py-3 px-4 font-medium text-white">{bet.teamName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                            {bet.plane}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-green-400">
                          ₹{bet.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals by Plane */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-4">Plane Totals</h3>
            
            {totals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-gray-400">No totals to display</p>
              </div>
            ) : (
              <div className="space-y-3">
                {totals.map(([plane, amount], idx) => (
                  <div 
                    key={plane} 
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {idx === 0 ? "🏆" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "✈️"}
                      </span>
                      <span className="font-semibold text-white text-lg">
                        Plane {plane}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-green-400">
                      ₹{amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}