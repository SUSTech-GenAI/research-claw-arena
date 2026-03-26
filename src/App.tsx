import { useState, ReactNode } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { Github, Trophy, Zap, Clock, CheckCircle, Star, Lightbulb, PenTool, Image as ImageIcon, FlaskConical, ChevronRight } from 'lucide-react';

// --- Mock Data ---
const CLAWS = [
  {
    id: 'claw-claude3',
    name: 'Claw-Claude-3',
    version: 'Opus',
    color: '#8b5cf6', // violet-500
    scores: {
      idea: 95,
      writing: 98,
      plotting: 80,
      experiment: 82,
      tokenEff: 75,
      timeEff: 70,
      completion: 95,
      quality: 96,
    }
  },
  {
    id: 'claw-gpt4',
    name: 'Claw-GPT-4',
    version: 'Turbo',
    color: '#10b981', // emerald-500
    scores: {
      idea: 92,
      writing: 95,
      plotting: 88,
      experiment: 85,
      tokenEff: 70,
      timeEff: 65,
      completion: 98,
      quality: 94,
    }
  },
  {
    id: 'claw-gemini15',
    name: 'Claw-Gemini-1.5',
    version: 'Pro',
    color: '#3b82f6', // blue-500
    scores: {
      idea: 90,
      writing: 92,
      plotting: 85,
      experiment: 90,
      tokenEff: 85,
      timeEff: 88,
      completion: 92,
      quality: 90,
    }
  },
  {
    id: 'claw-llama3',
    name: 'Claw-Llama-3',
    version: '70B',
    color: '#f59e0b', // amber-500
    scores: {
      idea: 85,
      writing: 88,
      plotting: 70,
      experiment: 75,
      tokenEff: 95,
      timeEff: 92,
      completion: 88,
      quality: 85,
    }
  }
];

// Calculate overall scores
const clawsWithOverall = CLAWS.map(claw => {
  const capabilityAvg = (claw.scores.idea + claw.scores.writing + claw.scores.plotting + claw.scores.experiment) / 4;
  const performanceAvg = (claw.scores.tokenEff + claw.scores.timeEff + claw.scores.completion + claw.scores.quality) / 4;
  const overall = Math.round((capabilityAvg + performanceAvg) / 2);
  return { ...claw, overall, capabilityAvg, performanceAvg };
}).sort((a, b) => b.overall - a.overall);

// Prepare data for Radar Charts
const capabilityData = [
  { subject: 'Idea Gen', 'Claw-Claude-3': 95, 'Claw-GPT-4': 92, 'Claw-Gemini-1.5': 90, 'Claw-Llama-3': 85 },
  { subject: 'Writing', 'Claw-Claude-3': 98, 'Claw-GPT-4': 95, 'Claw-Gemini-1.5': 92, 'Claw-Llama-3': 88 },
  { subject: 'Plotting', 'Claw-Claude-3': 80, 'Claw-GPT-4': 88, 'Claw-Gemini-1.5': 85, 'Claw-Llama-3': 70 },
  { subject: 'Experiment', 'Claw-Claude-3': 82, 'Claw-GPT-4': 85, 'Claw-Gemini-1.5': 90, 'Claw-Llama-3': 75 },
];

const performanceData = [
  { subject: 'Token Eff', 'Claw-Claude-3': 75, 'Claw-GPT-4': 70, 'Claw-Gemini-1.5': 85, 'Claw-Llama-3': 95 },
  { subject: 'Time Eff', 'Claw-Claude-3': 70, 'Claw-GPT-4': 65, 'Claw-Gemini-1.5': 88, 'Claw-Llama-3': 92 },
  { subject: 'Completion', 'Claw-Claude-3': 95, 'Claw-GPT-4': 98, 'Claw-Gemini-1.5': 92, 'Claw-Llama-3': 88 },
  { subject: 'Quality', 'Claw-Claude-3': 96, 'Claw-GPT-4': 94, 'Claw-Gemini-1.5': 90, 'Claw-Llama-3': 85 },
];


export default function App() {
  const [selectedClaws, setSelectedClaws] = useState<string[]>(clawsWithOverall.slice(0, 3).map(c => c.id));

  const toggleClaw = (id: string) => {
    if (selectedClaws.includes(id)) {
      if (selectedClaws.length > 1) {
        setSelectedClaws(selectedClaws.filter(c => c !== id));
      }
    } else {
      if (selectedClaws.length < 4) {
        setSelectedClaws([...selectedClaws, id]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <FlaskConical size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">Research Claw Arena</h1>
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Agent Evaluation Benchmark</p>
            </div>
          </div>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-md"
          >
            <Github size={16} />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200 shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">Evaluating Research Agents</h2>
            <p className="text-neutral-600 leading-relaxed mb-6">
              This arena compares the capabilities of various "Research Claws" (AI agents designed for research tasks). 
              We evaluate them across two primary dimensions: <strong>Capability Scope</strong> (Idea generation, Writing, Plotting, Experimentation) 
              and <strong>Performance Metrics</strong> (Token efficiency, Time efficiency, Completion rate, Quality).
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-100">
                <Lightbulb size={16} /> Capability Dimension
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium border border-emerald-100">
                <Zap size={16} /> Performance Dimension
              </div>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} />
              Arena Leaderboard
            </h3>
            <span className="text-sm text-neutral-500">Scores out of 100</span>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-neutral-500 uppercase tracking-wider text-xs border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Rank</th>
                    <th className="px-6 py-4 font-semibold">Model</th>
                    <th className="px-6 py-4 font-semibold text-center bg-blue-50/50">Overall</th>
                    <th className="px-6 py-4 font-semibold text-center" colSpan={4}>Capabilities</th>
                    <th className="px-6 py-4 font-semibold text-center" colSpan={4}>Performance</th>
                  </tr>
                  <tr className="border-t border-neutral-100 text-[10px] text-neutral-400">
                    <th className="px-6 py-2"></th>
                    <th className="px-6 py-2"></th>
                    <th className="px-6 py-2 bg-blue-50/50"></th>
                    <th className="px-2 py-2 text-center" title="Idea Generation">Idea</th>
                    <th className="px-2 py-2 text-center" title="Writing">Write</th>
                    <th className="px-2 py-2 text-center" title="Plotting">Plot</th>
                    <th className="px-2 py-2 text-center" title="Experimentation">Exp</th>
                    <th className="px-2 py-2 text-center" title="Token Efficiency">Tokens</th>
                    <th className="px-2 py-2 text-center" title="Time Efficiency">Time</th>
                    <th className="px-2 py-2 text-center" title="Completion Rate">Comp</th>
                    <th className="px-2 py-2 text-center" title="Quality">Qual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clawsWithOverall.map((claw, idx) => (
                    <tr key={claw.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' : 
                          idx === 1 ? 'bg-neutral-200 text-neutral-700' : 
                          idx === 2 ? 'bg-orange-100 text-orange-800' : 'text-neutral-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: claw.color }}></div>
                          <span className="font-semibold text-neutral-900">{claw.name}</span>
                          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">{claw.version}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center bg-blue-50/30">
                        <span className="font-bold text-blue-700 text-base">{claw.overall}</span>
                      </td>
                      {/* Capabilities */}
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.idea}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.writing}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.plotting}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600 border-r border-neutral-100">{claw.scores.experiment}</td>
                      {/* Performance */}
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.tokenEff}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.timeEff}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.completion}</td>
                      <td className="px-2 py-4 text-center font-mono text-neutral-600">{claw.scores.quality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Visual Comparison */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold">Visual Comparison</h3>
            <div className="flex flex-wrap gap-2">
              {clawsWithOverall.map(claw => (
                <button
                  key={claw.id}
                  onClick={() => toggleClaw(claw.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selectedClaws.includes(claw.id) 
                      ? 'bg-white shadow-sm border-neutral-300 text-neutral-900' 
                      : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div 
                      className={`w-2 h-2 rounded-full ${selectedClaws.includes(claw.id) ? '' : 'opacity-50'}`} 
                      style={{ backgroundColor: claw.color }}
                    ></div>
                    {claw.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capability Radar */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center">
              <h4 className="font-semibold text-neutral-700 mb-6 flex items-center gap-2">
                <Lightbulb size={18} className="text-blue-500" />
                Capability Scope
              </h4>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={capabilityData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#525252', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    {clawsWithOverall.filter(c => selectedClaws.includes(c.id)).map((claw, idx) => (
                      <Radar
                        key={claw.id}
                        name={claw.name}
                        dataKey={claw.name}
                        stroke={claw.color}
                        fill={claw.color}
                        fillOpacity={0.2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Radar */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-center">
              <h4 className="font-semibold text-neutral-700 mb-6 flex items-center gap-2">
                <Zap size={18} className="text-emerald-500" />
                Performance Metrics
              </h4>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#525252', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#a3a3a3', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    {clawsWithOverall.filter(c => selectedClaws.includes(c.id)).map((claw, idx) => (
                      <Radar
                        key={claw.id}
                        name={claw.name}
                        dataKey={claw.name}
                        stroke={claw.color}
                        fill={claw.color}
                        fillOpacity={0.2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Cards */}
        <section>
          <h3 className="text-lg font-bold mb-4">Detailed Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {clawsWithOverall.map(claw => (
              <div key={claw.id} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-neutral-100" style={{ borderTop: `4px solid ${claw.color}` }}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{claw.name}</h4>
                    <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md">{claw.version}</span>
                  </div>
                  <div className="flex items-end gap-2 mt-4">
                    <span className="text-3xl font-bold leading-none" style={{ color: claw.color }}>{claw.overall}</span>
                    <span className="text-sm text-neutral-500 font-medium mb-1">Overall Score</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 bg-neutral-50/50">
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Capabilities</h5>
                      <div className="space-y-2">
                        <ScoreBar label="Idea Gen" score={claw.scores.idea} icon={<Lightbulb size={14} />} color={claw.color} />
                        <ScoreBar label="Writing" score={claw.scores.writing} icon={<PenTool size={14} />} color={claw.color} />
                        <ScoreBar label="Plotting" score={claw.scores.plotting} icon={<ImageIcon size={14} />} color={claw.color} />
                        <ScoreBar label="Experiment" score={claw.scores.experiment} icon={<FlaskConical size={14} />} color={claw.color} />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Performance</h5>
                      <div className="space-y-2">
                        <ScoreBar label="Tokens" score={claw.scores.tokenEff} icon={<Zap size={14} />} color={claw.color} />
                        <ScoreBar label="Time" score={claw.scores.timeEff} icon={<Clock size={14} />} color={claw.color} />
                        <ScoreBar label="Completion" score={claw.scores.completion} icon={<CheckCircle size={14} />} color={claw.color} />
                        <ScoreBar label="Quality" score={claw.scores.quality} icon={<Star size={14} />} color={claw.color} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-neutral-500">
          <p>Research Claw Arena &copy; {new Date().getFullYear()}. Built for GitHub Pages.</p>
          <p className="mt-2">Metrics are simulated for demonstration purposes.</p>
        </div>
      </footer>
    </div>
  );
}

function ScoreBar({ label, score, icon, color }: { label: string, score: number, icon: ReactNode, color: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-24 flex items-center gap-1.5 text-neutral-600">
        <span className="text-neutral-400">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-8 text-right font-mono text-xs font-medium text-neutral-700">
        {score}
      </div>
    </div>
  );
}
