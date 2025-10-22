import { useState } from 'react';
import CommunityList from '../components/CommunityList';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { Community } from '../types';
import './CommunitiesPage.css';

// Mock data for now
const mockCommunities: Community[] = [
  {
    id: 1,
    name: 'programming',
    description: 'A community for discussing programming and software development',
    memberCount: 15234,
    createdAt: '2025-01-15',
  },
  {
    id: 2,
    name: 'gaming',
    description: 'Share your gaming experiences and discuss video games',
    memberCount: 23456,
    createdAt: '2025-02-10',
  },
  {
    id: 3,
    name: 'cooking',
    description: 'Share recipes, cooking tips, and culinary adventures',
    memberCount: 8901,
    createdAt: '2025-03-05',
  },
];

function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>(mockCommunities);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateCommunity = (name: string, description: string) => {
    const newCommunity: Community = {
      id: communities.length + 1,
      name,
      description,
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
    setCommunities([...communities, newCommunity]);
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
      <CommunityList communities={communities} />
      <CreateCommunityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCommunity}
      />
    </div>
  );
}

export default CommunitiesPage;
