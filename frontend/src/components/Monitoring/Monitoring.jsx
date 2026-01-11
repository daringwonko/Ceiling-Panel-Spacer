import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Generate mock data for demo
function generateMockData(points = 20) {
  const data = []
  const now = Date.now()

  for (let i = points; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 60000).toLocaleTimeString(),
      temperature: 22 + Math.random() * 4,
      humidity: 45 + Math.random() * 10,
      power: 1000 + Math.random() * 500,
    })
  }

  return data
}

export default function Monitoring() {
  const [data, setData] = useState(() => generateMockData())
  const [alerts, setAlerts] = useState([
    { id: 1, severity: 'warning', message: 'Temperature above threshold in Zone A', time: '2 min ago' },
    { id: 2, severity: 'info', message: 'Scheduled maintenance in 24 hours', time: '1 hour ago' },
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString(),
          temperature: 22 + Math.random() * 4,
          humidity: 45 + Math.random() * 10,
          power: 1000 + Math.random() * 500,
        }
        return [...prev.slice(1), newPoint]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const stats = [
    { name: 'Active Sensors', value: 12, status: 'healthy' },
    { name: 'Avg Temperature', value: '23.5°C', status: 'healthy' },
    { name: 'Avg Humidity', value: '48%', status: 'healthy' },
    { name: 'Power Usage', value: '1.2 kW', status: 'warning' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Monitoring Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time sensor data and alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-400">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">{stat.name}</span>
              <div className={`w-2 h-2 rounded-full ${stat.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="mb-4">Temperature & Humidity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Temperature (°C)"
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Humidity (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="mb-4">Power Consumption</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line
                type="monotone"
                dataKey="power"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Power (W)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="card p-6">
        <h3 className="mb-4">Recent Alerts</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                alert.severity === 'warning' ? 'bg-yellow-500/10' :
                alert.severity === 'error' ? 'bg-red-500/10' :
                'bg-blue-500/10'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                alert.severity === 'warning' ? 'bg-yellow-500' :
                alert.severity === 'error' ? 'bg-red-500' :
                'bg-blue-500'
              }`} />
              <span className="flex-1">{alert.message}</span>
              <span className="text-slate-500 text-sm">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
