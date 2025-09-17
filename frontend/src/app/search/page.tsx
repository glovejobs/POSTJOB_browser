'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, ArrowLeft, Briefcase, MapPin, DollarSign,
  Calendar, Users, Save, X, ChevronLeft, ChevronRight,
  Building, Clock, Star, Bookmark, BookmarkCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BRAND_CONFIG } from '@/shared/constants';
import { debounce } from 'lodash';

interface SearchResult {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  createdAt: string;
  applicationCount: number;
  boards: string[];
}

interface SearchFilters {
  status: string[];
  employmentType: string[];
  location: string[];
  company: string[];
  salaryMin?: number;
  salaryMax?: number;
  hasApplications?: boolean;
}

interface Facet {
  value: string;
  count: number;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  url: string;
  createdAt: string;
}

export default function SearchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    status: [],
    employmentType: [],
    location: [],
    company: []
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<Record<string, Facet[]>>({});
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ type: string; value: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Fetch saved searches on mount
  useEffect(() => {
    fetchSavedSearches();
  }, []);

  // Search when filters or query changes
  useEffect(() => {
    performSearch();
  }, [query, filters, sortBy, sortOrder, page]);

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setSavedSearches(data);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.status.length) params.append('status', filters.status.join(','));
      if (filters.employmentType.length) params.append('employmentType', filters.employmentType.join(','));
      if (filters.location.length) params.append('location', filters.location.join(','));
      if (filters.company.length) params.append('company', filters.company.join(','));
      if (filters.salaryMin) params.append('salaryMin', filters.salaryMin.toString());
      if (filters.salaryMax) params.append('salaryMax', filters.salaryMax.toString());
      if (filters.hasApplications !== undefined) params.append('hasApplications', filters.hasApplications.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/search/jobs?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();

      setResults(data.results);
      setFacets(data.facets);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(`/api/search/suggestions?q=${searchQuery}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    }, 300),
    []
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleFilterToggle = (category: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
    setPage(1); // Reset to first page
  };

  const handleSaveSearch = async () => {
    if (!saveSearchName) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the saved search',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: saveSearchName,
          type: 'jobs',
          filters: { ...filters, query },
          url: window.location.href
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Search saved successfully',
        });
        setShowSaveDialog(false);
        setSaveSearchName('');
        fetchSavedSearches();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive',
      });
    }
  };

  const handleLoadSavedSearch = (search: SavedSearch) => {
    const { query: savedQuery, ...savedFilters } = search.filters as any;
    setQuery(savedQuery || '');
    setFilters(savedFilters);
  };

  const handleDeleteSavedSearch = async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Saved search deleted',
        });
        fetchSavedSearches();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      employmentType: [],
      location: [],
      company: []
    });
    setQuery('');
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      posting: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Button
        onClick={() => router.push('/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Search Jobs & Applications</h1>
        <p className="text-gray-600">Find and filter your jobs with advanced search</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search by title, company, location..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          className="pl-10 pr-32 h-12 text-lg"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-1 h-4 w-4" />
            Filters
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full mt-1 w-full z-50">
            <CardContent className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                  onClick={() => {
                    setQuery(suggestion.value);
                    setShowSuggestions(false);
                    searchInputRef.current?.focus();
                  }}
                >
                  {suggestion.type === 'job' && <Briefcase className="h-4 w-4 text-gray-400" />}
                  {suggestion.type === 'company' && <Building className="h-4 w-4 text-gray-400" />}
                  {suggestion.type === 'candidate' && <Users className="h-4 w-4 text-gray-400" />}
                  {suggestion.value}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1 space-y-4">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Saved Searches
                    <Bookmark className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map(search => (
                    <div key={search.id} className="flex items-center justify-between">
                      <button
                        className="text-sm text-blue-600 hover:underline truncate flex-1 text-left"
                        onClick={() => handleLoadSavedSearch(search)}
                      >
                        {search.name}
                      </button>
                      <button
                        onClick={() => handleDeleteSavedSearch(search.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Filter Categories */}
            {Object.entries(facets).map(([category, values]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {values.map(facet => (
                    <label key={facet.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={filters[category as keyof SearchFilters]?.includes(facet.value)}
                        onCheckedChange={() => handleFilterToggle(category as keyof SearchFilters, facet.value)}
                      />
                      <span className="text-sm flex-1">{facet.value}</span>
                      <span className="text-xs text-gray-500">({facet.count})</span>
                    </label>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Clear Filters */}
            <Button
              variant="outline"
              className="w-full"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}

        {/* Results */}
        <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {/* Sort and View Options */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              {results.length} results found
            </p>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Results List */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {results.map(job => (
                <Card
                  key={job.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/job/${job.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </span>
                          {job.employmentType && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {job.employmentType}
                            </span>
                          )}
                        </div>
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center gap-1 text-sm text-green-600 mb-2">
                            <DollarSign className="h-3 w-3" />
                            {job.salaryMin && `$${job.salaryMin.toLocaleString()}`}
                            {job.salaryMin && job.salaryMax && ' - '}
                            {job.salaryMax && `$${job.salaryMax.toLocaleString()}`}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          {job.applicationCount > 0 && (
                            <Badge variant="outline">
                              <Users className="h-3 w-3 mr-1" />
                              {job.applicationCount} applications
                            </Badge>
                          )}
                          {job.boards.length > 0 && (
                            <Badge variant="outline">
                              Posted to {job.boards.length} boards
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Save Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter search name..."
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSearch} style={{ backgroundColor: BRAND_CONFIG.colors.primary }}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}