import { useState, useEffect } from 'react';
import CommunityList from '../components/CommunityList';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { Community } from '../types';
import { communitiesApi, Community as ApiCommunity } from '../services/api';
import './CommunitiesPage.css';

function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await communitiesApi.getAll(1, 100);
      const apiCommunities = response.communities || [];
      
      // Map API communities to component type
      const mappedCommunities: Community[] = apiCommunities.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        memberCount: c.users?.length || 0,
        createdAt: c.createdAt || c.created_at,
      }));
      
      setCommunities(mappedCommunities);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities. Please try again.');
    } finally {
      setIsLoading(false);
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
        <CommunityList communities={communities} />
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
