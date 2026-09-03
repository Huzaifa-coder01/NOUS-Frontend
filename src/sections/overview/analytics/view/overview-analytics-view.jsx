import { useMemo, useState, useEffect } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { usersApi } from 'src/lib/mock-server';
import { useNousData } from 'src/context/nous-data';

import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

/** Spark-line series for the summary tiles - a simple ramp up to the total. */
function ramp(total) {
  const steps = 8;

  return Array.from({ length: steps }, (_, index) =>
    Math.max(0, Math.round((total * (index + 1)) / steps))
  );
}

const SPARK_CATEGORIES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export function OverviewAnalyticsView() {
  const { programs } = useNousData();

  const { user } = useAuthContext();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    usersApi
      .list()
      .then(setUsers)
      .catch((error) => console.error('[analytics] users load failed:', error));
  }, []);

  const stats = useMemo(() => {
    const levels = programs.flatMap((program) => program.levels);
    const subjects = levels.flatMap((level) => level.subjects);
    const chapters = subjects.flatMap((subject) => subject.chapters);
    const resources = chapters.flatMap((chapter) => chapter.resources ?? []);
    const published = resources.filter((resource) => resource.content?.trim());

    return {
      programs: programs.length,
      levels: levels.length,
      subjects: subjects.length,
      chapters: chapters.length,
      resources: resources.length,
      published: published.length,
      coverage: resources.length ? Math.round((published.length / resources.length) * 100) : 0,
    };
  }, [programs]);

  /** Chapters per program - donut. */
  const chaptersByProgram = useMemo(
    () =>
      programs.map((program) => ({
        label: program.name,
        value: program.levels.reduce(
          (total, level) =>
            total + level.subjects.reduce((sum, subject) => sum + subject.chapters.length, 0),
          0
        ),
      })),
    [programs]
  );

  /** Subjects and chapters per level - grouped bars. */
  const perLevel = useMemo(() => {
    const levels = programs.flatMap((program) =>
      program.levels.map((level) => ({
        name: `${program.name} · ${level.name}`,
        subjects: level.subjects.length,
        chapters: level.subjects.reduce((total, subject) => total + subject.chapters.length, 0),
      }))
    );

    return {
      categories: levels.map((level) => level.name),
      series: [
        { name: 'Subjects', data: levels.map((level) => level.subjects) },
        { name: 'Chapters', data: levels.map((level) => level.chapters) },
      ],
    };
  }, [programs]);

  /** Content coverage per level - horizontal bars. */
  const coverageByLevel = useMemo(() => {
    const levels = programs.flatMap((program) =>
      program.levels.map((level) => {
        const resources = level.subjects
          .flatMap((subject) => subject.chapters)
          .flatMap((chapter) => chapter.resources ?? []);

        const published = resources.filter((resource) => resource.content?.trim()).length;

        return {
          name: `${program.name} · ${level.name}`,
          percent: resources.length ? Math.round((published / resources.length) * 100) : 0,
        };
      })
    );

    return {
      categories: levels.map((level) => level.name),
      series: [{ name: 'Published %', data: levels.map((level) => level.percent) }],
    };
  }, [programs]);

  /** Published content by resource type - radar. */
  const byResourceType = useMemo(() => {
    const totals = new Map();

    programs
      .flatMap((program) => program.levels)
      .flatMap((level) => level.subjects)
      .flatMap((subject) => subject.chapters)
      .flatMap((chapter) => chapter.resources ?? [])
      .forEach((resource) => {
        const entry = totals.get(resource.name) ?? { total: 0, published: 0 };

        entry.total += 1;
        if (resource.content?.trim()) entry.published += 1;

        totals.set(resource.name, entry);
      });

    const categories = [...totals.keys()];

    return {
      categories,
      series: [
        { name: 'Total', data: categories.map((name) => totals.get(name).total) },
        { name: 'Published', data: categories.map((name) => totals.get(name).published) },
      ],
    };
  }, [programs]);

  /** Chapters still without any content - a to-do list. */
  const emptyChapters = useMemo(
    () =>
      programs
        .flatMap((program) =>
          program.levels.flatMap((level) =>
            level.subjects.flatMap((subject) =>
              subject.chapters
                .filter(
                  (chapter) => !(chapter.resources ?? []).some((item) => item.content?.trim())
                )
                .map((chapter) => ({
                  id: `${program.id}-${level.id}-${subject.id}-${chapter.id}`,
                  name: `${subject.name} — ${chapter.name}`,
                }))
            )
          )
        )
        .slice(0, 6),
    [programs]
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

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, {user?.name?.split(' ')[0] ?? 'admin'} 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Programs"
            percent={0}
            total={stats.programs}
            icon={<img alt="Programs" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{ categories: SPARK_CATEGORIES, series: ramp(stats.programs) }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Subjects"
            percent={0}
            total={stats.subjects}
            color="secondary"
            icon={<img alt="Subjects" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{ categories: SPARK_CATEGORIES, series: ramp(stats.subjects) }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Chapters"
            percent={0}
            total={stats.chapters}
            color="warning"
            icon={<img alt="Chapters" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{ categories: SPARK_CATEGORIES, series: ramp(stats.chapters) }}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <AnalyticsWidgetSummary
            title="Published resources"
            percent={stats.coverage}
            total={stats.published}
            color="error"
            icon={<img alt="Resources" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{ categories: SPARK_CATEGORIES, series: ramp(stats.published) }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Chapters by program"
            chart={{ series: chaptersByProgram }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsWebsiteVisits
            title="Catalog size"
            subheader="Subjects and chapters per level"
            chart={perLevel}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsConversionRates
            title="Content coverage"
            subheader={`${stats.published} of ${stats.resources} resources published`}
            chart={coverageByLevel}
          />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentSubject
            title="Resources by type"
            chart={byResourceType}
          />
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          <AnalyticsTasks title="Chapters needing content" list={emptyChapters} />
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <AnalyticsOrderTimeline title="Newest accounts" list={recentUsers} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
