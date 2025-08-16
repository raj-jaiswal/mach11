import React, { useEffect, useState } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("cash", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTeams(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "🏅";
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0: return "from-yellow-400 to-yellow-600";
      case 1: return "from-gray-300 to-gray-500";
      case 2: return "from-amber-600 to-amber-800";
      default: return "from-blue-500 to-purple-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-xl font-medium">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.svg" 
              alt="Rocket Boys Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-400">ROCKET BOYS - Aviation Trading Championship</p>
        </div>

        <div className="card">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No Teams Yet
              </h3>
              <p className="text-gray-500">Be the first to join the competition!</p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left py-4 px-6">Rank</th>
                    <th className="text-left py-4 px-6">Team</th>
                    <th className="text-right py-4 px-6">Balance</th>
                    <th className="text-right py-4 px-6">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, idx) => {
                    const rank = idx + 1;
                    const change = (team.cash ?? 0) - 10000;
                    return (
                      <tr key={team.id} className="hover:bg-blue-500/10 transition-colors duration-200">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${getRankColor(idx)} rounded-full flex items-center justify-center text-white font-bold`}>
                              #{rank}
                            </div>
                            <span className="text-2xl">{getRankIcon(rank)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-semibold text-white text-lg">
                              {team.teamName || team.id}
                            </span>
                            {team.rolls && (
                              <p className="text-gray-400 text-sm">
                                Rolls: {team.rolls}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-xl font-bold text-green-400">
                            ₹{Math.round(team.cash ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {change >= 0 ? '+' : ''}₹{Math.round(change).toLocaleString()}
                          </span>
                          <div className="text-xs text-gray-400">
                            {change >= 0 ? '📈 Profit' : '📉 Loss'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {teams.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-xl font-bold text-white mb-6">Competition Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-blue-400 mb-2">{teams.length}</p>
                <p className="text-gray-400 text-sm">Total Teams</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-green-400 mb-2">
                  ₹{Math.round(teams.reduce((sum, team) => sum + (team.cash || 0), 0)).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">Total Cash</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-orange-400 mb-2">
                  ₹{Math.round(teams.reduce((sum, team) => sum + (team.cash || 0), 0) / teams.length).toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">Average Cash</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-xl">
                <p className="text-3xl font-bold text-purple-400 mb-2">
                  {teams.filter(team => (team.cash || 0) > 10000).length}
                </p>
                <p className="text-gray-400 text-sm">In Profit</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/")}
            className="py-3 px-8 text-gray-400 hover:text-white transition-colors duration-200 border border-gray-600 hover:border-gray-400 rounded-xl font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}