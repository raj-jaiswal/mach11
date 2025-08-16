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
  const [bets, setBets] = useState([]); // [{teamName, plane, amount}]
  const [loadingBets, setLoadingBets] = useState(true);

  // watch event state
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", "event1"), (snap) => {
      const data = snap.data() || {};
      setActive(!!data.active);
      setRound(data.round || 0);
    });
    return () => unsub();
  }, []);

  // load bets for current round
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
    // increment round and activate
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
    // fetch bets again to be safe
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

    // apply balances
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

    // clear bets for this round
    for (const d of snapshot.docs) {
      await deleteDoc(doc(db, "event1_bets", d.id));
    }

    // stop event
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
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Event 1</h1>

      <div className="flex gap-3 mb-4">
        {!active ? (
          <button onClick={startRound} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Start New Round
          </button>
        ) : (
          <button onClick={stopRound} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
            Stop (no checkout)
          </button>
        )}
        <button onClick={checkout} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Checkout & Reset Bets
        </button>
      </div>

      <div className="mb-2">Status: <b>{active ? "Active" : "Inactive"}</b> | Round: <b>{round}</b></div>

      <div className="mt-4 bg-white rounded-xl shadow text-black">
        <div className="p-4 border-b font-semibold">Bets (Round {round})</div>
        <div className="p-4">
          {loadingBets ? (
            <div>Loading bets…</div>
          ) : bets.length === 0 ? (
            <div>No bets yet.</div>
          ) : (
            <ul className="divide-y">
              {bets.map((b) => (
                <li key={b.id} className="py-2 flex items-center justify-between">
                  <span className="font-medium">{b.teamName}</span>
                  <span>Plane: <b>{b.plane}</b></span>
                  <span>Amt: <b>₹{b.amount}</b></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow text-black">
        <div className="p-4 border-b font-semibold">Totals by Plane</div>
        <div className="p-4">
          {totals.length === 0 ? (
            <div>No totals yet.</div>
          ) : (
            <ul className="space-y-1">
              {totals.map(([plane, amt]) => (
                <li key={plane} className="flex justify-between">
                  <span>Plane {plane}</span>
                  <span>₹{amt}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
