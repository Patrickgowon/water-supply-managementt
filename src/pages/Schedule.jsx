// src/pages/Schedule.jsx
import React, { useState } from 'react';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaTruck,
  FaPlus,
  FaFilter,
  FaSearch,
  FaDownload,
  FaPrint,
  FaShare,
  FaCheckCircle,
  FaExclamationCircle,
  FaEdit,
  FaTrash,
  FaCopy
} from 'react-icons/fa';
import { MdOutlineWaterDrop } from 'react-icons/md';

const Schedule = () => {
  const [view, setView] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample schedule data
  const scheduleData = {
    daily: [
      {
        id: 1,
        time: '08:00 AM',
        location: 'PLASU Main Campus',
        area: 'Bokkos',
        tanker: 'TKR-001',
        driver: 'John Danladi',
        amount: 5000,
        status: 'completed',
        priority: 'high',
        notes: 'Regular supply'
      },
      {
        id: 2,
        time: '09:30 AM',
        location: 'Bokkos General Hospital',
        area: 'Bokkos Town',
        tanker: 'TKR-002',
        driver: 'Musa Ibrahim',
        amount: 8000,
        status: 'in-progress',
        priority: 'high',
        notes: 'Emergency supply needed'
      },
      {
        id: 3,
        time: '11:00 AM',
        location: 'Mangar Community',
        area: 'Mangar',
        tanker: 'TKR-003',
        driver: 'Peter Sunday',
        amount: 5000,
        status: 'scheduled',
        priority: 'medium',
        notes: 'Weekly supply'
      },
      {
        id: 4,
        time: '02:00 PM',
        location: 'Bokkos Market',
        area: 'Bokkos Town',
        tanker: 'TKR-004',
        driver: 'Yakubu Moses',
        amount: 6000,
        status: 'scheduled',
        priority: 'medium',
        notes: 'Peak hours supply'
      },
      {
        id: 5,
        time: '04:30 PM',
        location: 'Richa Village',
        area: 'Richa',
        tanker: 'TKR-001',
        driver: 'John Danladi',
        amount: 5000,
        status: 'scheduled',
        priority: 'low',
        notes: 'Bi-weekly supply'
      },
      {
        id: 6,
        time: '06:00 PM',
        location: 'Butura Community',
        area: 'Butura',
        tanker: 'TKR-002',
        driver: 'Musa Ibrahim',
        amount: 8000,
        status: 'pending',
        priority: 'high',
        notes: 'Urgent request'
      }
    ],
    weekly: [
      // Weekly schedule data
    ],
    monthly: [
      // Monthly schedule data
    ]
  };

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-green-100 text-green-600',
      'in-progress': 'bg-blue-100 text-blue-600',
      'scheduled': 'bg-gray-100 text-gray-600',
      'pending': 'bg-yellow-100 text-yellow-600',
      'cancelled': 'bg-red-100 text-red-600'
    };
    
    const icons = {
      'completed': <FaCheckCircle className="text-green-600" />,
      'in-progress': <FaClock className="text-blue-600" />,
      'scheduled': <FaCalendarAlt className="text-gray-600" />,
      'pending': <FaExclamationCircle className="text-yellow-600" />,
      'cancelled': <FaExclamationCircle className="text-red-600" />
    };

    return (
      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      'high': 'bg-red-100 text-red-600',
      'medium': 'bg-yellow-100 text-yellow-600',
      'low': 'bg-green-100 text-green-600'
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[priority]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  // Calculate summary stats
  const totalDeliveries = scheduleData.daily.length;
  const completedToday = scheduleData.daily.filter(d => d.status === 'completed').length;
  const totalWater = scheduleData.daily.reduce((sum, d) => sum + d.amount, 0);
  const pendingCount = scheduleData.daily.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Delivery Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Plan and manage water deliveries across Bokkos region
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
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FaPlus />
            <span className="hidden sm:inline">New Schedule</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalDeliveries}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaCalendarAlt className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Today</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{completedToday}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaCheckCircle className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Water</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{(totalWater/1000).toFixed(1)}K L</p>
            </div>
            <div className="bg-cyan-100 p-3 rounded-lg">
              <MdOutlineWaterDrop className="text-cyan-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{pendingCount}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaClock className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['daily', 'weekly', 'monthly'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                  view === viewType
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              ←
            </button>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              →
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <FaFilter />
            </button>
          </div>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        {/* Timeline Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-300">Time</div>
          <div className="col-span-3 text-sm font-medium text-gray-600 dark:text-gray-300">Location</div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-300">Tanker/Driver</div>
          <div className="col-span-1 text-sm font-medium text-gray-600 dark:text-gray-300">Amount</div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-300">Status</div>
          <div className="col-span-2 text-sm font-medium text-gray-600 dark:text-gray-300">Actions</div>
        </div>

        {/* Timeline Items */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {scheduleData.daily.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <FaClock className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{item.time}</span>
                </div>
              </div>
              
              <div className="col-span-3">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">{item.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.area}</p>
                </div>
              </div>
              
              <div className="col-span-2">
                <div>
                  <p className="text-sm text-gray-800 dark:text-white">{item.tanker}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.driver}</p>
                </div>
              </div>
              
              <div className="col-span-1">
                <p className="text-sm font-medium text-blue-600">{item.amount}L</p>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  {getPriorityBadge(item.priority)}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Edit">
                    <FaEdit />
                  </button>
                  <button className="p-1 hover:bg-green-100 rounded text-green-600" title="Copy">
                    <FaCopy />
                  </button>
                  <button className="p-1 hover:bg-red-100 rounded text-red-600" title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  Schedule New Delivery
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700">
                      <option>PLASU Main Campus</option>
                      <option>Bokkos General Hospital</option>
                      <option>Mangar Community</option>
                      <option>Bokkos Market</option>
                      <option>Richa Village</option>
                      <option>Butura Community</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tanker
                    </label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700">
                      <option>TKR-001 (5000L)</option>
                      <option>TKR-002 (8000L)</option>
                      <option>TKR-003 (5000L)</option>
                      <option>TKR-004 (6000L)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time
                    </label>
                    <input 
                      type="time" 
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount (Liters)
                    </label>
                    <input 
                      type="number" 
                      placeholder="5000"
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700">
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient/Contact
                  </label>
                  <input 
                    type="text" 
                    placeholder="Name and contact information"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea 
                    rows="3"
                    placeholder="Any special instructions..."
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                  ></textarea>
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Schedule Delivery
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;