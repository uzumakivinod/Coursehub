import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import CourseDetailPage from './pages/CourseDetailPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<HomePage />} />
        <Route path="/search"      element={<ResultsPage />} />
        <Route path="/course/:id"  element={<CourseDetailPage />} />
        <Route path="*"            element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
