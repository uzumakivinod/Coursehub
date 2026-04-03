import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-display font-extrabold text-gradient">404</div>
        <h1 className="font-display font-bold text-2xl text-surface-800">Page not found</h1>
        <p className="text-surface-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <Home size={15} /> Home
          </Link>
          <Link to="/search" className="btn-secondary">
            <Search size={15} /> Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
}
