import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { NousLayout } from 'src/sections/nous';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/pages/nous/home'));
const ProgramPage = lazy(() => import('src/pages/nous/program'));
const LevelPage = lazy(() => import('src/pages/nous/level'));
const SubjectPage = lazy(() => import('src/pages/nous/subject'));
const ChapterPage = lazy(() => import('src/pages/nous/chapter'));
const ResourcePage = lazy(() => import('src/pages/nous/resource'));

// ----------------------------------------------------------------------

export const nousRoutes = [
  {
    element: (
      // the student site requires an account; sign in decides where you land
      <AuthGuard>
        <NousLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </NousLayout>
      </AuthGuard>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: 'programs',
        children: [
          { index: true, element: <HomePage /> },
          { path: ':programId', element: <ProgramPage /> },
          { path: ':programId/:levelId', element: <LevelPage /> },
          { path: ':programId/:levelId/:subjectId', element: <SubjectPage /> },
          { path: ':programId/:levelId/:subjectId/:chapterId', element: <ChapterPage /> },
          {
            path: ':programId/:levelId/:subjectId/:chapterId/:resourceId',
            element: <ResourcePage />,
          },
        ],
      },
    ],
  },
];
