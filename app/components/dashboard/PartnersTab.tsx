import { Users, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';

const partnersData = [
  { id: 1, name: 'Swift Logistics', riders: 45, status: 'active', revenue: 28000, deliveries: 890, rating: 4.8 },
  { id: 2, name: 'Express Delivery Co', riders: 32, status: 'active', revenue: 19500, deliveries: 620, rating: 4.6 },
  { id: 3, name: 'FastTrack Services', riders: 28, status: 'active', revenue: 15200, deliveries: 480, rating: 4.7 },
  { id: 4, name: 'Metro Couriers', riders: 18, status: 'inactive', revenue: 4300, deliveries: 130, rating: 4.3 },
];

export default function PartnersTab() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Logistics Partners</h2>
        <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 shadow hover:shadow-lg transition-all text-sm">
          <Users size={18} />
          Add Partner
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search partners..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Partner Name</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Riders</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Deliveries</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {partnersData.map((partner) => (
                <tr key={partner.id} className="hover:bg-yellow-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 text-sm">{partner.name}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">{partner.riders}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600 text-sm">{partner.deliveries}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-bold text-sm">₦{partner.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-900 font-semibold text-sm">{partner.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      partner.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {partner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" title="View">
                        <Eye size={14} className="text-blue-600" />
                      </button>
                      <button className="p-1.5 hover:bg-green-100 rounded-lg transition-colors" title="Edit">
                        <Edit size={14} className="text-green-600" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
