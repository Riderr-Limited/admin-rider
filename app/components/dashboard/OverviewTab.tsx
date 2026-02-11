import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 45000, deliveries: 1200 },
  { month: 'Feb', revenue: 52000, deliveries: 1450 },
  { month: 'Mar', revenue: 48000, deliveries: 1350 },
  { month: 'Apr', revenue: 61000, deliveries: 1680 },
  { month: 'May', revenue: 58000, deliveries: 1590 },
  { month: 'Jun', revenue: 67000, deliveries: 1820 },
];

const deliveryStatusData = [
  { name: 'Completed', value: 1820, color: '#10b981' },
  { name: 'In Transit', value: 245, color: '#3b82f6' },
  { name: 'Pending', value: 89, color: '#f59e0b' },
  { name: 'Cancelled', value: 34, color: '#ef4444' },
];

const customerIssues = [
  { id: 1, customer: 'John Doe', issue: 'Delayed delivery', status: 'pending', priority: 'high', time: '2 hours ago' },
  { id: 2, customer: 'Jane Smith', issue: 'Package damaged', status: 'resolved', priority: 'medium', time: '5 hours ago' },
  { id: 3, customer: 'Mike Johnson', issue: 'Wrong address', status: 'in-progress', priority: 'high', time: '1 hour ago' },
];

const stats = [
  { label: 'Total Revenue', value: '₦67,000', change: '+15.3%', color: 'bg-emerald-500' },
  { label: 'Active Partners', value: '12', change: '+2', color: 'bg-yellow-500' },
  { label: 'Total Deliveries', value: '1,820', change: '+12.5%', color: 'bg-purple-500' },
  { label: 'Pending Issues', value: '8', change: '-3', color: 'bg-red-500' },
];

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} p-2 rounded-lg shadow-sm w-10 h-10`}></div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-500 text-xs font-medium mb-1">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3">Delivery Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={deliveryStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
                style={{ fontSize: '11px' }}
              >
                {deliveryStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Recent Customer Issues</h3>
        <div className="space-y-2">
          {customerIssues.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-yellow-300 transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  issue.priority === 'urgent' ? 'bg-red-500' :
                  issue.priority === 'high' ? 'bg-yellow-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{issue.customer}</p>
                  <p className="text-xs text-gray-600">{issue.issue}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{issue.time}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  issue.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {issue.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
