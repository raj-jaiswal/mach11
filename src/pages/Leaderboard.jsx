import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("cash", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Leaderboard</h1>
      <div className="bg-white text-black rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Rank</th>
              <th className="text-left p-3">Team</th>
              <th className="text-right p-3">Cash</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, idx) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{idx + 1}</td>
                <td className="p-3 font-medium">{t.teamName || t.id}</td>
                <td className="p-3 text-right">₹{Math.round(t.cash ?? 0)}</td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td className="p-3 text-center" colSpan={4}>
                  No teams yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
