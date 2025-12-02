import './PostSortFilter.css';

export type SortOption = 'hot' | 'new' | 'downvotes' | 'controversial' | 'oldest';

interface PostSortFilterProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  disabled?: boolean;
}

function PostSortFilter({ currentSort, onSortChange, disabled = false }: PostSortFilterProps) {
  const sortOptions: { value: SortOption; label: string; icon: string; description: string }[] = [
    { value: 'hot', label: 'Hot', icon: '🔥', description: 'Most upvoted' },
    { value: 'new', label: 'New', icon: '✨', description: 'Most recent' },
    { value: 'downvotes', label: 'Most Downvotes', icon: '⬇️', description: 'Lowest score' },
    { value: 'controversial', label: 'Controversial', icon: '💬', description: 'Most commented' },
    { value: 'oldest', label: 'Oldest', icon: '📅', description: 'Oldest first' },
  ];

  return (
    <div className="post-sort-filter">
      {sortOptions.map((option) => (
        <button
          key={option.value}
          className={`sort-option ${currentSort === option.value ? 'active' : ''}`}
          onClick={() => onSortChange(option.value)}
          disabled={disabled}
          title={option.description}
        >
          <span className="sort-icon">{option.icon}</span>
          <span className="sort-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default PostSortFilter;
