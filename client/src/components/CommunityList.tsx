import { Community } from '../types';
import CommunityCard from './CommunityCard';
import './CommunityList.css';

interface CommunityListProps {
  communities: Community[];
}

function CommunityList({ communities }: CommunityListProps) {
  return (
    <div className="community-list">
      <div className="community-grid">
        {communities.map((community) => (
          <CommunityCard
            key={community.id}
            community={community}
          />
        ))}
      </div>
      {communities.length === 0 && (
        <div className="empty-state">
          <p>No communities yet. Create your first one!</p>
        </div>
      )}
    </div>
  );
}

export default CommunityList;
