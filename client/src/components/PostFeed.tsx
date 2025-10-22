import PostCard from './PostCard';
import { Post } from '../types';
import './PostFeed.css';

interface PostFeedProps {
  posts: Post[];
  onVote?: (postId: number, value: number) => void;
}

function PostFeed({ posts, onVote }: PostFeedProps) {
  return (
    <div className="post-feed">
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onVote={onVote} />
        ))
      ) : (
        <div className="empty-feed">
          <p>No posts yet. Be the first to create one!</p>
        </div>
      )}
    </div>
  );
}

export default PostFeed;
