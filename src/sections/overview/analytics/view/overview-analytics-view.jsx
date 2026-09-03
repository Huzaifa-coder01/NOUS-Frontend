import { useMemo, useState, useEffect } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { isActive, activeOnly } from 'src/utils/catalog';

import { STATUS } from 'src/_mock/_nous';
import { useNousData } from 'src/context/nous-data';
import { usersApi, docsApi } from 'src/lib/mock-server';

import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { AnalyticsStatTile } from '../analytics-stat-tile';
import { AnalyticsLinkList } from '../analytics-link-list';
import { AnalyticsVisibility } from '../analytics-visibility';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';

// ----------------------------------------------------------------------

const KINDS = [
  { kind: 'past-paper', label: 'Past papers' },
  { kind: 'syllabus', label: 'Syllabus' },
  { kind: 'note', label: 'Student notes' },
];

const glass = (name) => <img alt="" src={`/assets/icons/glass/${name}.svg`} />;

/** Flattens the catalog into one row per node, keeping the ids for links. */
function flattenNodes(courses) {
  const levels = [];
  const subjects = [];
  const chapters = [];

  courses.forEach((course) =>
    course.levels.forEach((level) => {
      levels.push(level);

      level.subjects.forEach((subject) => {
        subjects.push(subject);

        subject.chapters.forEach((chapter) => chapters.push({ chapter, subject, level, course }));
      });
    })
  );

  return { levels, subjects, chapters };
}

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const theme = useTheme();

  const { courses, adminCourses } = useNousData();

  const { user } = useAuthContext();

  const [users, setUsers] = useState([]);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((error) => console.error('[analytics] users load failed:', error));
  }, []);

  useEffect(() => {
    docsApi
      .listAll()
      .then(setDocs)
      .catch((error) => console.error('[analytics] documents load failed:', error));
    // reloads after every catalog change
  }, [courses]);

  const tree = useMemo(() => flattenNodes(adminCourses), [adminCourses]);

  const visible = useMemo(
    () => docs.filter((doc) => doc.effectiveStatus === STATUS.active),
    [docs]
  );

  /** Why a PDF is not reachable: switched off itself, or a parent is off. */
  const visibility = useMemo(
    () => [
      {
        label: 'Visible to students',
        color: 'success',
        hint: 'Active all the way up the tree',
        value: visible.length,
      },
      {
        label: 'Hidden by a parent',
        color: 'warning',
        hint: 'Active, but a parent is switched off',
        value: docs.filter((doc) => doc.hiddenByParent).length,
      },
      {
        label: 'Switched off',
        color: 'error',
        hint: 'Set to inactive, on its own or by a cascade',
        value: docs.filter((doc) => doc.status !== STATUS.active).length,
      },
    ],
    [docs, visible]
  );

  /** What the library holds, per course, split by document type. */
  const byCourse = useMemo(() => {
    const names = adminCourses.map((course) => course.name);

    return {
      categories: names,
      // the widget only ships two colours, and three series would repeat one
      colors: [theme.palette.primary.dark, theme.palette.warning.main, theme.palette.info.main],
      series: KINDS.map((item) => ({
        name: item.label,
        data: names.map(
          (name) => docs.filter((doc) => doc.courseName === name && doc.kind === item.kind).length
        ),
      })),
      options: {
        plotOptions: { bar: { columnWidth: '48%', borderRadius: 4 } },
        tooltip: { y: { formatter: (value) => `${value} PDFs` } },
      },
    };
  }, [adminCourses, docs, theme]);

  /**
   * Things an admin would want to fix: PDFs switched on but stranded under an
   * inactive parent, then active chapters with nothing in them.
   */
  const attention = useMemo(() => {
    const items = [];

    const stranded = docs.filter((doc) => doc.hiddenByParent).length;

    if (stranded) {
      items.push({
        id: 'stranded',
        icon: 'solar:eye-closed-bold',
        color: 'warning',
        badge: stranded,
        primary: `${stranded} PDF${stranded === 1 ? ' is' : 's are'} active but hidden`,
        secondary: 'A course, level, subject or chapter above them is inactive',
        href: paths.admin.pastPapers,
      });
    }

    const withDocs = new Set(
      docs
        .filter((doc) => doc.chapterName)
        .map((doc) =>
          [doc.path.courseId, doc.path.levelId, doc.path.subjectId, doc.path.chapterId].join('/')
        )
    );

    const empty = tree.chapters.filter(
      ({ chapter, subject, level, course }) =>
        isActive(chapter) &&
        isActive(subject) &&
        isActive(level) &&
        isActive(course) &&
        !withDocs.has([course.id, level.id, subject.id, chapter.id].join('/'))
    );

    // one row per subject rather than per chapter - six consecutive chapters of
    // the same subject tell an admin far less than six different subjects do
    const bySubject = new Map();

    empty.forEach(({ chapter, subject, level, course }) => {
      const key = [course.id, level.id, subject.id].join('/');

      if (!bySubject.has(key)) bySubject.set(key, { course, level, subject, chapters: [] });

      bySubject.get(key).chapters.push(chapter);
    });

    [...bySubject.values()].slice(0, 6).forEach(({ course, level, subject, chapters }) => {
      const named = chapters
        .slice(0, 4)
        .map((chapter) => chapter.name)
        .join(', ');
      const rest = chapters.length - 4;

      items.push({
        id: `${course.id}-${level.id}-${subject.id}`,
        icon: 'solar:folder-open-bold',
        color: 'info',
        badge: chapters.length,
        primary: subject.name,
        secondary: `${course.name} · ${level.name} · nothing in ${named}${rest > 0 ? ` +${rest} more` : ''}`,
        href: paths.admin.catalog.subject(course.id, level.id, subject.id),
      });
    });

    return { items, emptyChapters: empty.length, emptySubjects: bySubject.size };
  }, [docs, tree.chapters]);

  /** The newest student uploads - the one thing students can add. */
  const recentNotes = useMemo(
    () =>
      docs
        .filter((doc) => doc.kind === 'note')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((doc) => ({
          id: doc.rowId,
          icon: 'solar:document-text-bold',
          color: doc.effectiveStatus === STATUS.active ? 'success' : 'warning',
          badge: doc.effectiveStatus === STATUS.active ? undefined : 'Hidden',
          primary: doc.name,
          secondary: `${doc.uploadedBy?.name ?? 'A student'} · ${doc.courseName} · ${doc.levelName} · ${doc.subjectName} · ${doc.chapterName} · ${fDate(doc.createdAt)}`,
          href: paths.admin.notes,
        })),
    [docs]
  );

  /** Newest accounts - timeline. */
  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((item, index) => ({
          id: item.id,
          title: `${item.name} · ${item.role === 'admin' ? 'Admin' : 'Student'}`,
          type: `order${index + 1}`,
          time: item.createdAt,
        })),
    [users]
  );

  const stats = {
    courses: { active: activeOnly(adminCourses).length, total: adminCourses.length },
    subjects: { active: tree.subjects.filter(isActive).length, total: tree.subjects.length },
    chapters: {
      active: tree.chapters.filter(({ chapter }) => isActive(chapter)).length,
      total: tree.chapters.length,
    },
    pdfs: { active: visible.length, total: docs.length },
  };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 1 }}>
        Hi, {user?.name?.split(' ')[0] ?? 'admin'} 👋
      </Typography>

      <Typography sx={{ mb: { xs: 3, md: 5 }, color: 'text.secondary' }}>
        What students can reach right now, and what still needs your attention.
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsStatTile
            title="Courses"
            active={stats.courses.active}
            total={stats.courses.total}
            icon={glass('ic-glass-bag')}
            hint="Only active courses appear on the student site"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsStatTile
            title="Subjects"
            color="secondary"
            active={stats.subjects.active}
            total={stats.subjects.total}
            icon={glass('ic-glass-users')}
            hint="Counted across every course and level"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsStatTile
            title="Chapters"
            color="warning"
            active={stats.chapters.active}
            total={stats.chapters.total}
            icon={glass('ic-glass-buy')}
            hint="Counted across every subject"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsStatTile
            title="PDFs"
            color="error"
            active={stats.pdfs.active}
            total={stats.pdfs.total}
            icon={glass('ic-glass-message')}
            hint="Past papers, syllabus and notes a student can actually open"
          />
        </Grid>

        <Grid xs={12} md={5} lg={4}>
          <AnalyticsVisibility
            title="PDF visibility"
            subheader="Why a document does or does not reach students"
            segments={visibility}
          />
        </Grid>

        <Grid xs={12} md={7} lg={8}>
          <AnalyticsWebsiteVisits
            title="Library by course"
            subheader="Every PDF in the catalog, by type"
            chart={byCourse}
          />
        </Grid>

        <Grid xs={12} lg={8}>
          <AnalyticsLinkList
            title="Needs attention"
            subheader={
              attention.emptyChapters
                ? `${attention.emptyChapters} active chapters across ${attention.emptySubjects} subjects have nothing to read yet`
                : 'Gaps a student would notice'
            }
            list={attention.items}
            emptyText="Nothing to fix - every active chapter has content."
          />
        </Grid>

        <Grid xs={12} lg={4}>
          <AnalyticsOrderTimeline title="Newest accounts" list={recentUsers} />
        </Grid>

        <Grid xs={12}>
          <AnalyticsLinkList
            title="Latest student notes"
            subheader="The only thing students can add"
            list={recentNotes}
            minHeight={0}
            emptyText="No student has uploaded notes yet."
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
