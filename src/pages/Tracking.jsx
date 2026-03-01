// src/pages/Tracking.jsx
import React, { useState } from 'react';
import { 
  FaTruck, 
  FaMapMarkerAlt, 
  FaClock, 
  FaFilter,
  FaSearch,
  FaList,
  FaMapMarkedAlt,
  FaChartLine,
  FaDownload,
  FaPrint,
  FaShare
} from 'react-icons/fa';
import { MdOutlineWaterDrop, MdOutlineSpeed } from 'react-icons/md';
import WaterTankerMap from '../components/Map/WaterTankerMap';
import LiveTracker from '../components/Tracking/LiveTracker';
import RouteOptimization from '../components/Tracking/RouteOptimization';
import DeliveryHistory from '../components/Tracking/DeliveryHistory';

const Tracking = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [selectedTanker, setSelectedTanker] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    area: 'all',
    tanker: 'all'
  });

  // Sample tanker data for tracking
  const tankers = [
    {
      id: 'TKR-001',
      driver: 'John Danladi',
      status: 'active',
      location: 'PLASU Campus',
      destination: 'Bokkos Hospital',
      waterLevel: 75,
      speed: 0,
      eta: 'Now',
      lastUpdate: '2 min ago'
    },
    {
      id: 'TKR-002',
      driver: 'Musa Ibrahim',
      status: 'en-route',
      location: 'Bokkos Road',
      destination: 'Mangar Community',
      waterLevel: 100,
      speed: 45,
      eta: '15 min',
      lastUpdate: 'Just now'
    },
    {
      id: 'TKR-003',
      driver: 'Peter Sunday',
      status: 'returning',
      location: 'Richa Area',
      destination: 'Water Depot',
      waterLevel: 10,
      speed: 35,
      eta: '30 min',
      lastUpdate: '5 min ago'
    },
    {
      id: 'TKR-004',
      driver: 'Yakubu Moses',
      status: 'active',
      location: 'Bokkos Market',
      destination: 'Butura',
      waterLevel: 45,
      speed: 0,
      eta: 'Now',
      lastUpdate: '10 min ago'
    }
  ];

  const tabs = [
    { id: 'live', name: 'Live Tracking', icon: FaMapMarkedAlt },
    { id: 'route', name: 'Route Optimization', icon: FaChartLine },
    { id: 'history', name: 'Delivery History', icon: FaClock }
  ];

  const filteredTankers = tankers.filter(tanker =>
    tanker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tanker.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tanker.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Tracking Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage all water tanker operations in real-time
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
            <FaDownload />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
            <FaPrint />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FaShare />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'live' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaTruck className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Tankers</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">4</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MdOutlineWaterDrop className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Water</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">23,500 L</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <FaClock className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg ETA</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">22 min</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <MdOutlineSpeed className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Speed</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">32 km/h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* View Toggle and Filters */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <FaMapMarkedAlt />
                  Map View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <FaList />
                  List View
                </button>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tankers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <FaFilter />
                  Filter
                </button>
              </div>
            </div>

            {/* Main Content */}
            {viewMode === 'map' ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <WaterTankerMap />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Tanker Fleet Status
                  </h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTankers.map((tanker) => (
                    <div
                      key={tanker.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedTanker(tanker)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${
                            tanker.status === 'active' ? 'bg-green-500' :
                            tanker.status === 'en-route' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <h4 className="font-semibold text-gray-800 dark:text-white">{tanker.id}</h4>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{tanker.driver}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tanker.status === 'active' ? 'bg-green-100 text-green-600' :
                          tanker.status === 'en-route' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {tanker.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Location</p>
                          <p className="font-medium text-gray-800 dark:text-white">{tanker.location}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Destination</p>
                          <p className="font-medium text-gray-800 dark:text-white">{tanker.destination}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Water Level</p>
                          <p className="font-medium text-gray-800 dark:text-white">{tanker.waterLevel}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">ETA</p>
                          <p className="font-medium text-gray-800 dark:text-white">{tanker.eta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Tracker Modal */}
            {selectedTanker && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="max-w-4xl w-full">
                  <LiveTracker
                    tankerId={selectedTanker.id}
                    onClose={() => setSelectedTanker(null)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'route' && (
          <RouteOptimization />
        )}

        {activeTab === 'history' && (
          <DeliveryHistory />
        )}
      </div>
    </div>
  );
};

export default Tracking;