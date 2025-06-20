import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Edit, 
  Trash2, 
  Star,
  MoreHorizontal
} from 'lucide-react';

export function Templates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Templates', count: 24 },
    { id: 'blog', name: 'Blog Posts', count: 8 },
    { id: 'social', name: 'Social Media', count: 6 },
    { id: 'email', name: 'Email Marketing', count: 5 },
    { id: 'product', name: 'Product Pages', count: 3 },
    { id: 'landing', name: 'Landing Pages', count: 2 },
  ];

  const templates = [
    {
      id: 1,
      name: 'Tech Blog Post',
      description: 'Comprehensive template for technology-focused blog posts with SEO optimization',
      category: 'blog',
      isFavorite: true,
      lastModified: '2 days ago',
      usage: 45
    },
    {
      id: 2,
      name: 'Product Launch Email',
      description: 'Email template for announcing new product launches with compelling CTAs',
      category: 'email',
      isFavorite: false,
      lastModified: '1 week ago',
      usage: 23
    },
    {
      id: 3,
      name: 'Social Media Campaign',
      description: 'Multi-platform social media posts template for marketing campaigns',
      category: 'social',
      isFavorite: true,
      lastModified: '3 days ago',
      usage: 67
    },
    {
      id: 4,
      name: 'E-commerce Product Description',
      description: 'Optimized product description template for online stores',
      category: 'product',
      isFavorite: false,
      lastModified: '5 days ago',
      usage: 34
    },
    {
      id: 5,
      name: 'Landing Page Hero',
      description: 'High-converting hero section template for landing pages',
      category: 'landing',
      isFavorite: false,
      lastModified: '1 week ago',
      usage: 12
    },
    {
      id: 6,
      name: 'Newsletter Template',
      description: 'Weekly newsletter template with sections for news, tips, and updates',
      category: 'email',
      isFavorite: true,
      lastModified: '4 days ago',
      usage: 28
    },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage your content templates</p>
        </div>
        
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Category:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                </div>
                
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Used {template.usage} times</span>
                <span>{template.lastModified}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                
                <button className="flex items-center justify-center p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                
                <button className="flex items-center justify-center p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first template'}
          </p>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto">
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      )}
    </div>
  );
}