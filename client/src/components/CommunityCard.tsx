import { useNavigate } from 'react-router-dom';
import { Community } from '../types';
import './CommunityCard.css';

interface CommunityCardProps {
  community: Community;
}

function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/communities/${community.id}`);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/communities/${community.id}`);
  };

  return (
    <div className="community-card" onClick={handleCardClick}>
      <div className="community-icon">
        {community.name.charAt(0).toUpperCase()}
      </div>
      <div className="community-info">
        <h3 className="community-name">r/{community.name}</h3>
        <p className="community-description">{community.description}</p>
        <div className="community-stats">
          <span>{community.memberCount.toLocaleString()} members</span>
        </div>
      </div>
      <button className="join-button" onClick={handleViewClick}>
        View
      </button>
    </div>
  );
}

export default CommunityCard;
