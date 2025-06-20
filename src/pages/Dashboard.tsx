import React from 'react';
import { 
  TrendingUp, 
  FileCheck, 
  AlertCircle, 
  Clock,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Page } from '../App';

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const stats = [
    { 
      label: 'Total Articles Generated', 
      value: '1,247', 
      change: '+12%', 
      changeType: 'positive',
      icon: FileCheck 
    },
    { 
      label: 'Success Rate', 
      value: '94.2%', 
      change: '+2.1%', 
      changeType: 'positive',
      icon: TrendingUp 
    },
    { 
      label: 'Failed Generations', 
      value: '23', 
      change: '-8%', 
      changeType: 'negative',
      icon: AlertCircle 
    },
    { 
      label: 'Avg. Generation Time', 
      value: '2.3s', 
      change: '-0.5s', 
      changeType: 'positive',
      icon: Clock 
    },
  ];

  const recentActivity = [
    { id: 1, title: 'Blog Post: "AI in Marketing"', status: 'completed', time: '2 minutes ago' },
    { id: 2, title: 'Product Description Set', status: 'processing', time: '5 minutes ago' },
    { id: 3, title: 'Social Media Campaign', status: 'completed', time: '12 minutes ago' },
    { id: 4, title: 'Email Newsletter Draft', status: 'failed', time: '18 minutes ago' },
    { id: 5, title: 'Landing Page Copy', status: 'completed', time: '1 hour ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your content generation overview.</p>
        </div>
        
        <button
          onClick={() => onNavigate('generation')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Generation</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <button 
                onClick={() => onNavigate('history')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : activity.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={() => onNavigate('generation')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Generate Content</p>
                    <p className="text-sm text-gray-500">Create new content with AI</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Edit Templates</p>
                    <p className="text-sm text-gray-500">Customize content templates</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => onNavigate('campaigns')}
                className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Campaigns</p>
                    <p className="text-sm text-gray-500">Manage content campaigns</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}