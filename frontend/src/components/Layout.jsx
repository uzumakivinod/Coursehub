import { Outlet, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Search, BookOpen, Github, Twitter, Menu, X } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-surface-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-display font-700 text-lg text-surface-900 hidden sm:block">
            Free<span className="text-brand-500">Course</span>Hub
          </span>
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search free courses…"
            className="input-search pl-9 pr-4 py-2 text-sm"
          />
        </form>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-4">
          <Link to="/" className="text-sm text-surface-600 hover:text-brand-500 font-medium transition-colors">Home</Link>
          <Link to="/search" className="text-sm text-surface-600 hover:text-brand-500 font-medium transition-colors">Browse</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer"
            className="text-surface-500 hover:text-surface-800 transition-colors">
            <Github size={18} />
          </a>
        </nav>

        {/* Mobile menu button */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-surface-600 hover:text-surface-900">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white px-4 py-4 space-y-3 animate-fade-in">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search courses…" className="input-search pl-9" />
          </form>
          <div className="flex gap-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm text-surface-700 font-medium">Home</Link>
            <Link to="/search" onClick={() => setMobileOpen(false)} className="text-sm text-surface-700 font-medium">Browse</Link>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-surface-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="font-display font-bold text-surface-900">FreeCourseHub</span>
            </div>
            <p className="text-sm text-surface-500 leading-relaxed">
              Discover thousands of free courses from Google, IBM, Harvard, MIT, and more — all in one place.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-surface-800 mb-3 text-sm">Platforms</h4>
            <ul className="space-y-1.5 text-sm text-surface-500">
              {['Coursera', 'edX', 'YouTube', 'MIT OCW', 'freeCodeCamp', 'Khan Academy'].map(p => (
                <li key={p}><Link to={`/search?platform=${p}`} className="hover:text-brand-500 transition-colors">{p}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-surface-800 mb-3 text-sm">Categories</h4>
            <ul className="space-y-1.5 text-sm text-surface-500">
              {['Web Development', 'Data Science & ML', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Programming'].map(c => (
                <li key={c}><Link to={`/search?category=${encodeURIComponent(c)}`} className="hover:text-brand-500 transition-colors">{c}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-surface-400">
          <span>© {new Date().getFullYear()} FreeCourseHub. All courses link to their original providers.</span>
          <span>100% Free · Open Source · No Sign-Up Required</span>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
