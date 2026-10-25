import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './layout/Layout';
import { CatalogProvider } from './lib/catalog';
import Home from './pages/Home';

// Inner pages load on demand so the landing page stays light.
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
// Jobs page commented out for now (owner request, 23 Oct); /jobs falls through to the home redirect.
// const JobsPage = lazy(() => import('./pages/JobsPage'));
// Blog commented out for now (owner request, 23 Oct); /blogs and /blogs/:slug fall through to the home redirect.
// const BlogsPage = lazy(() => import('./pages/BlogsPage'));
// const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
// Internal pages: CMS (/admin, outside the site layout) and the design-system review page.
const AdminPage = lazy(() => import('./admin/AdminPage'));
const DesignSystem = lazy(() => import('./pages/DesignSystem'));

const page = (node: ReactNode) => <Suspense fallback={null}>{node}</Suspense>;

export default function App() {
  return (
    // Clean URLs (owner request, 25 Oct: bvvarmyacademy.in/courses, no "#/"). GitHub Pages has no server-side routing,
    // so the build also writes the page as 404.html and as <route>/index.html (scripts/spa-fallback.mjs).
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      {/* Courses + exams from Firestore (bundled courses until they load). */}
      <CatalogProvider>
      <Routes>
        <Route path="admin" element={page(<AdminPage />)} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={page(<CoursesPage />)} />
          <Route path="courses/:id" element={page(<CourseDetailPage />)} />
          {/* <Route path="jobs" element={page(<JobsPage />)} /> */}
          {/* <Route path="blogs" element={page(<BlogsPage />)} />
          <Route path="blogs/:slug" element={page(<BlogPostPage />)} /> */}
          <Route path="about" element={page(<AboutPage />)} />
          <Route path="design-system" element={page(<DesignSystem />)} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </CatalogProvider>
    </BrowserRouter>
  );
}
