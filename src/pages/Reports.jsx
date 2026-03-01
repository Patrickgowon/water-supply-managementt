// src/pages/Reports.jsx
import React, { useState } from 'react';
import { 
  FaChartBar, 
  FaDownload, 
  FaPrint, 
  FaShare,
  FaCalendarAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileWord,
  FaChartLine,
  FaChartPie,
  FaChartArea,
  FaTruck,
  FaWater,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [reportType, setReportType] = useState('daily');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  // Chart data for delivery trends
  const deliveryTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Deliveries',
        data: [12, 15, 18, 14, 22, 25, 20],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Chart data for water distribution
  const waterDistributionData = {
    labels: ['PLASU Campus', 'Bokkos Hospital', 'Mangar', 'Richa', 'Butura', 'Bokkos Town'],
    datasets: [
      {
        label: 'Water Delivered (L)',
        data: [45000, 38000, 25000, 18000, 22000, 42000],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)'
        ]
      }
    ]
  };

  // Chart data for tanker performance
  const tankerPerformanceData = {
    labels: ['TKR-001', 'TKR-002', 'TKR-003', 'TKR-004'],
    datasets: [
      {
        label: 'Deliveries',
        data: [45, 52, 38, 41],
        backgroundColor: '#3B82F6'
      },
      {
        label: 'Distance (km)',
        data: [580, 720, 490, 560],
        backgroundColor: '#10B981'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  // Report metrics
  const reportMetrics = {
    totalDeliveries: 284,
    totalWater: 1250000,
    avgResponseTime: 32,
    satisfactionRate: 94,
    activeTankers: 4,
    coverageArea: 78,
    topLocations: [
      { name: 'PLASU Campus', count: 85, amount: 425000 },
      { name: 'Bokkos Hospital', count: 72, amount: 576000 },
      { name: 'Bokkos Town', count: 68, amount: 340000 },
      { name: 'Mangar', count: 59, amount: 295000 }
    ],
    performance: {
      onTime: 92,
      delayed: 6,
      failed: 2
    }
  };

  const generateReport = () => {
    setGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setGenerating(false);
      alert(`Report generated successfully in ${selectedFormat.toUpperCase()} format!`);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate and analyze comprehensive reports on water supply operations
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FaChartBar />
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
            <FaDownload />
            Download
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
            <FaPrint />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
            <FaShare />
            Share
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Report Type
            </label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="quarterly">Quarterly Report</option>
              <option value="yearly">Yearly Report</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period
            </label>
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
              <option value="year">Last 12 months</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFormat('pdf')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                  selectedFormat === 'pdf'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaFilePdf />
                PDF
              </button>
              <button
                onClick={() => setSelectedFormat('excel')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                  selectedFormat === 'excel'
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaFileExcel />
                Excel
              </button>
              <button
                onClick={() => setSelectedFormat('word')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border ${
                  selectedFormat === 'word'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FaFileWord />
                Word
              </button>
            </div>
          </div>

          {/* Date Range (for custom) */}
          {reportType === 'custom' && (
            <div className="flex gap-2">
              <input 
                type="date" 
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                placeholder="Start Date"
              />
              <input 
                type="date" 
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700"
                placeholder="End Date"
              />
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{reportMetrics.totalDeliveries}</p>
              <p className="text-xs text-green-600 mt-1">↑ 12% from last period</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FaTruck className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Water</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{(reportMetrics.totalWater/1000).toFixed(1)}K L</p>
              <p className="text-xs text-green-600 mt-1">↑ 8% from last period</p>
            </div>
            <div className="bg-cyan-100 p-3 rounded-lg">
              <FaWater className="text-cyan-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{reportMetrics.avgResponseTime} min</p>
              <p className="text-xs text-green-600 mt-1">↓ 5 min improvement</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FaClock className="text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rate</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{reportMetrics.satisfactionRate}%</p>
              <p className="text-xs text-green-600 mt-1">↑ 3% from last period</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <FaUsers className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Delivery Trends
          </h3>
          <div className="h-64">
            <Line data={deliveryTrendData} options={chartOptions} />
          </div>
        </div>

        {/* Water Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Water Distribution by Area
          </h3>
          <div className="h-64">
            <Bar data={waterDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Tanker Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Tanker Performance
          </h3>
          <div className="h-64">
            <Bar data={tankerPerformanceData} options={chartOptions} />
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Delivery Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">On Time</span>
                <span className="font-medium text-gray-800 dark:text-white">{reportMetrics.performance.onTime}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${reportMetrics.performance.onTime}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Delayed</span>
                <span className="font-medium text-gray-800 dark:text-white">{reportMetrics.performance.delayed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${reportMetrics.performance.delayed}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">Failed</span>
                <span className="font-medium text-gray-800 dark:text-white">{reportMetrics.performance.failed}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${reportMetrics.performance.failed}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Locations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Top Delivery Locations
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Number of Deliveries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total Water (L)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reportMetrics.topLocations.map((location, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">{location.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{location.count}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{location.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {((location.amount / reportMetrics.totalWater) * 100).toFixed(1)}%
                      </span>
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${(location.amount / reportMetrics.totalWater) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">
          Executive Summary
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          This report covers water delivery operations for the period. Total of {reportMetrics.totalDeliveries} deliveries 
          were completed, delivering 
                      {(reportMetrics.totalWater / 1000).toFixed(1)}K liters of water across the Bokkos region. 
          The average response time was {reportMetrics.avgResponseTime} minutes with a {reportMetrics.satisfactionRate}% 
          customer satisfaction rate. PLASU Campus and Bokkos Hospital remain the highest priority locations, 
          receiving 35% of total water volume. On-time delivery rate stands at {reportMetrics.performance.onTime}%, 
          showing a 5% improvement from the previous period. The fleet of {reportMetrics.activeTankers} active tankers 
          covered {reportMetrics.coverageArea}% of the target area, with TKR-002 being the most productive tanker 
          completing 52 deliveries over 720 km.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Download Full Report
          </button>
          <button className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm">
            Schedule Report
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FaFileExcel className="text-green-600 text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">Daily Operations Report</h4>
              <p className="text-xs text-gray-500">Last generated: Today 08:00 AM</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Complete daily summary of all deliveries, tanker status, and water distribution.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Size: 2.4 MB</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FaFilePdf className="text-red-600 text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">Weekly Analytics Report</h4>
              <p className="text-xs text-gray-500">Last generated: Monday 09:00 AM</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Weekly trends, performance metrics, and predictive analytics for planning.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Size: 5.1 MB</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaFileWord className="text-blue-600 text-xl" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-white">Monthly Summary Report</h4>
              <p className="text-xs text-gray-500">Last generated: Jan 1, 2024</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Comprehensive monthly overview with financial data and community impact.
          </p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Size: 8.7 MB</span>
            <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
          </div>
        </div>
      </div>

      {/* Custom Report Builder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Custom Report Builder
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Metrics
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Delivery Volume</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Response Time</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Tanker Utilization</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Customer Feedback</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cost Analysis</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Locations
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">PLASU Campus</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bokkos Hospital</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bokkos Town</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mangar</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Richa</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chart Types
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="chart" className="text-blue-600" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Line Chart</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="chart" className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bar Chart</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="chart" className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pie Chart</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="chart" className="text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Area Chart</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Preview
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Custom Report
          </button>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Scheduled Reports
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Weekly Operations Report</p>
                <p className="text-xs text-gray-500">Every Monday at 08:00 AM • PDF format</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
              <button className="text-sm text-red-600 hover:text-red-800">Disable</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Monthly Performance Report</p>
                <p className="text-xs text-gray-500">Every 1st of month at 09:00 AM • Excel format</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
              <button className="text-sm text-red-600 hover:text-red-800">Disable</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Quarterly Impact Assessment</p>
                <p className="text-xs text-gray-500">Every quarter • PDF format</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
              <button className="text-sm text-red-600 hover:text-red-800">Disable</button>
            </div>
          </div>
        </div>

        <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
          + Schedule New Report
        </button>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Bulk Export Options
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FaFileExcel className="text-green-600" />
            Export All Data (Excel)
          </button>
          <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FaFilePdf className="text-red-600" />
            Export Charts (PDF)
          </button>
          <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FaFileWord className="text-blue-600" />
            Export Summary (Word)
          </button>
          <button className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FaChartBar className="text-purple-600" />
            Export Raw Data (CSV)
          </button>
        </div>
      </div>

      {/* Data Freshness Note */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Data last updated: {new Date().toLocaleString()} • Reports include data from all {reportMetrics.activeTankers} active tankers • Next automatic update in 15 minutes
      </div>
    </div>
  );
};

export default Reports;