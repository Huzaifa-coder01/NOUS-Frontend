import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { RoleGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const AnalyticsPage = lazy(() => import('src/pages/admin/analytics'));
const UsersPage = lazy(() => import('src/pages/admin/users'));
const ProfilePage = lazy(() => import('src/pages/admin/profile'));
const SettingsPage = lazy(() => import('src/pages/admin/settings'));
const CatalogPage = lazy(() => import('src/pages/admin/catalog'));
const CatalogProgramPage = lazy(() => import('src/pages/admin/catalog-program'));
const CatalogLevelPage = lazy(() => import('src/pages/admin/catalog-level'));
const CatalogSubjectPage = lazy(() => import('src/pages/admin/catalog-subject'));
const CatalogChapterPage = lazy(() => import('src/pages/admin/catalog-chapter'));
const PastPapersPage = lazy(() => import('src/pages/admin/past-papers'));
const CatalogSubjectPapersPage = lazy(() => import('src/pages/admin/catalog-subject-papers'));
const CatalogChapterPapersPage = lazy(() => import('src/pages/admin/catalog-chapter-papers'));

// ----------------------------------------------------------------------

export const adminRoutes = [
  {
    path: 'admin',
    element: (
      // admin role required - students are sent back to the public site
      <RoleGuard roles={['admin']}>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </RoleGuard>
    ),
    children: [
      { index: true, element: <AnalyticsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'past-papers', element: <PastPapersPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'catalog',
        children: [
          { index: true, element: <CatalogPage /> },
          { path: ':programId', element: <CatalogProgramPage /> },
          { path: ':programId/:levelId', element: <CatalogLevelPage /> },
          { path: ':programId/:levelId/:subjectId', element: <CatalogSubjectPage /> },
          {
            // subject level past papers - must precede the :chapterId route
            path: ':programId/:levelId/:subjectId/past-papers',
            element: <CatalogSubjectPapersPage />,
          },
          { path: ':programId/:levelId/:subjectId/:chapterId', element: <CatalogChapterPage /> },
          {
            path: ':programId/:levelId/:subjectId/:chapterId/past-papers',
            element: <CatalogChapterPapersPage />,
          },
        ],
      },
    ],
  },
];
