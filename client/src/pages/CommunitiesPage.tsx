import React, { useState, useEffect } from 'react';
import CommunityList from '../components/CommunityList';
import CreateCommunityModal from '../components/CreateCommunityModal';
import SearchBar from '../components/SearchBar';
import { Community } from '../types';
import { communitiesApi } from '../services/api';
import './CommunitiesPage.css';

type FilterTab = 'all' | 'joined';

function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [joinedSlugs, setJoinedSlugs] = useState<string[]>([]);

  useEffect(() => {
    fetchCommunities();
    loadJoinedCommunities();
    
    // Listen for changes to joined communities
    const handleJoinedChange = () => loadJoinedCommunities();
    window.addEventListener('joinedCommunitiesChanged', handleJoinedChange);
    return () => window.removeEventListener('joinedCommunitiesChanged', handleJoinedChange);
  }, []);

  const loadJoinedCommunities = () => {
    const stored = localStorage.getItem('joinedCommunities');
    if (stored) {
      setJoinedSlugs(JSON.parse(stored));
    } else {
      setJoinedSlugs([]);
    }
  };

  // Filter communities based on active tab and search query
  useEffect(() => {
    let filtered = communities;
    
    // Filter by tab
    if (activeTab === 'joined') {
      filtered = communities.filter(c => c.slug && joinedSlugs.includes(c.slug));
    }
    
    // Filter by search (if not using server-side search)
    if (searchQuery.trim() && activeTab === 'joined') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredCommunities(filtered);
  }, [searchQuery, communities, activeTab, joinedSlugs]);

  const fetchCommunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await communitiesApi.getAll(1, 1000); // Load more communities for better search
      const apiCommunities = response.communities || [];

      // Map API communities to component type
      const mappedCommunities: Community[] = apiCommunities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.member_count || c.memberCount || c.users?.length || 0,
        createdAt: c.createdAt || c.created_at,
      }));

      setCommunities(mappedCommunities);
      // Only set filtered communities if there's no active search
      if (!searchQuery.trim()) {
        setFilteredCommunities(mappedCommunities);
      }
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    // For joined tab, use client-side filtering (already handled in useEffect)
    if (activeTab === 'joined') {
      return;
    }

    if (!query.trim()) {
      // If search is cleared, reload all communities
      await fetchCommunities();
      return;
    }

    // Perform server-side search for all communities
    setIsLoading(true);
    setError(null);
    try {
      const response = await communitiesApi.search(query, 1, 100);
      const apiCommunities = response.communities || [];

      // Map API communities to component type
      const mappedCommunities: Community[] = apiCommunities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.member_count || c.memberCount || c.users?.length || 0,
        createdAt: c.createdAt || c.created_at,
      }));

      setCommunities(mappedCommunities);
      setFilteredCommunities(mappedCommunities);
    } catch (err) {
      console.error('Error searching communities:', err);
      setError('Search failed. Please try again.');
      setFilteredCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setSearchQuery('');
    if (tab === 'all') {
      fetchCommunities();
    }
  };

  const handleCreateCommunity = async (name: string, description: string) => {
    try {
      // Generate slug from name
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      await communitiesApi.create({ name, slug, description });
      
      // Refresh the communities list
      await fetchCommunities();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating community:', err);
      alert(err.response?.data?.error || 'Failed to create community');
    }
  };

  return (
    <div className="communities-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Communities</h1>
          <p>Click on any community to view posts and create content</p>
        </div>
        <button className="create-button" onClick={() => setIsModalOpen(true)}>
          + Create Community
        </button>
      </div>

      <div className="communities-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Communities
        </button>
        <button 
          className={`tab-button ${activeTab === 'joined' ? 'active' : ''}`}
          onClick={() => handleTabChange('joined')}
        >
          Joined
        </button>
      </div>
      
      <div className="search-section">
        <SearchBar
          onSearch={handleSearch}
          placeholder={activeTab === 'joined' ? "Search your joined communities..." : "Search communities by name or description..."}
          showResultCount={searchQuery.length > 0}
          resultCount={filteredCommunities.length}
        />
      </div>
      
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-text-secondary)' }}>
          <p>Loading communities...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-error)' }}>
          <p>{error}</p>
          <button onClick={fetchCommunities} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {filteredCommunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--blueit-text-secondary)' }}>
              {activeTab === 'joined' ? (
                searchQuery ? (
                  <>
                    <p>No joined communities found matching "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} style={{ marginTop: '1rem' }}>
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p>You haven't joined any communities yet.</p>
                    <p style={{ marginTop: '0.5rem' }}>Browse all communities and click "Join" to add them here!</p>
                    <button onClick={() => handleTabChange('all')} style={{ marginTop: '1rem' }}>
                      Browse Communities
                    </button>
                  </>
                )
              ) : searchQuery ? (
                <>
                  <p>No communities found matching "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} style={{ marginTop: '1rem' }}>
                    Clear search
                  </button>
                </>
              ) : (
                <p>No communities available.</p>
              )}
            </div>
          ) : (
            <CommunityList communities={filteredCommunities} />
          )}
        </>
      )}
      
      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCommunity}
      />
    </div>
  );
}

export default CommunitiesPage;
