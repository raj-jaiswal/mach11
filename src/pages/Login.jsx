import React, { useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Login({ onLogin }) {
  const [teamName, setTeamName] = useState("");
  const [rolls, setRolls] = useState("");
  const [instituteEmail, setInstituteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!teamName.trim() || !rolls.trim() || !instituteEmail.trim()) {
      alert("Please fill all fields.");
      return;
    }

    setBusy(true);
    try {
      const teamRef = doc(db, "teams", teamName.trim());
      const snap = await getDoc(teamRef);

      if (!snap.exists()) {
        // New team: initialize with 10000 cash
        await setDoc(teamRef, {
          teamName: teamName.trim(),
          rolls: rolls.trim(),
          instituteEmail: instituteEmail.trim(),
          cash: 10000,
          createdAt: Date.now()
        });
      } else {
        // Existing team: ensure base fields exist, do NOT overwrite cash
        const data = snap.data() || {};
        await setDoc(
          teamRef,
          {
            teamName: data.teamName ?? teamName.trim(),
            rolls: data.rolls ?? rolls.trim(),
            instituteEmail: data.instituteEmail ?? instituteEmail.trim(),
            cash: typeof data.cash === "number" ? data.cash : 10000
          },
          { merge: true }
        );
      }

      onLogin({ teamName: teamName.trim(), rolls: rolls.trim(), instituteEmail: instituteEmail.trim() });
    } catch (err) {
      console.error(err);
      alert("Login failed. Check console.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-100 p-4">
      <form onSubmit={submit} className="bg-white text-black w-full max-w-md rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        <label className="block">
          <span className="text-sm font-medium">Team Name</span>
          <input
            className="mt-1 w-full border rounded-lg p-2"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., Falcons"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Rolls (comma-separated)</span>
          <input
            className="mt-1 w-full border rounded-lg p-2"
            value={rolls}
            onChange={(e) => setRolls(e.target.value)}
            placeholder="e.g., 23XX01, 23XX02"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Institute Email</span>
          <input
            type="email"
            className="mt-1 w-full border rounded-lg p-2"
            value={instituteEmail}
            onChange={(e) => setInstituteEmail(e.target.value)}
            placeholder="name_roll@iitp.ac.in"
          />
        </label>

        <button
          disabled={busy}
          className="w-full bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
