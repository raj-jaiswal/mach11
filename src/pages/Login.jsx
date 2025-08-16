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
        await setDoc(teamRef, {
          teamName: teamName.trim(),
          rolls: rolls.trim(),
          instituteEmail: instituteEmail.trim(),
          cash: 10000,
          createdAt: Date.now()
        });
      } else {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <form onSubmit={submit} className="card">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img 
                src="/logo.svg" 
                alt="Rocket Boys Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">
              ROCKET BOYS
            </h1>
            <p className="text-gray-400">
              Aviation Trading Championship
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name
              </label>
              <input
                className="w-full"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Falcons"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Roll Numbers
              </label>
              <input
                className="w-full"
                value={rolls}
                onChange={(e) => setRolls(e.target.value)}
                placeholder="e.g., 23XX01, 23XX02"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Institute Email
              </label>
              <input
                type="email"
                className="w-full"
                value={instituteEmail}
                onChange={(e) => setInstituteEmail(e.target.value)}
                placeholder="name_roll@iitp.ac.in"
                required
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 px-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="loading"></div>
                  Signing in...
                </div>
              ) : (
                "Enter Dashboard"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}