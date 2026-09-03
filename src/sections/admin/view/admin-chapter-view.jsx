import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { countActive, chapterDocs } from 'src/utils/catalog';
import { STATUS, CHAPTER_SECTIONS } from 'src/_mock/_nous';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { AdminPageHeader } from '../components/admin-page-header';

// ----------------------------------------------------------------------

/**
 * A chapter is just a container for its three document sections, so this page
 * is a hub: counts per section and a way into each list.
 */
export function AdminChapterView({ course, level, subject, chapter }) {
  const navigate = useNavigate();

  const ids = [course.id, level.id, subject.id, chapter.id];

  return (
    <DashboardContent>
      <AdminPageHeader
        title={chapter.title || chapter.name}
        subtitle="Everything a student sees inside this chapter"
        links={[
          { name: 'Catalog', href: paths.admin.catalog.root },
          { name: course.name, href: paths.admin.catalog.course(course.id) },
          { name: level.name, href: paths.admin.catalog.level(course.id, level.id) },
          {
            name: subject.name,
            href: paths.admin.catalog.subject(course.id, level.id, subject.id),
          },
          { name: chapter.name },
        ]}
      />

      {chapter.status !== STATUS.active && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This chapter is inactive, so none of the PDFs below are visible to students - whatever
          their own status. Switch the chapter back on from the chapter list.
        </Alert>
      )}

      <Stack spacing={2.5}>
        {CHAPTER_SECTIONS.map((section) => {
          const docs = chapterDocs(chapter, section.kind);
          const active = countActive(docs);

          return (
            <Card key={section.id} sx={{ p: 3 }}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box sx={{ fontSize: 30 }}>{section.icon}</Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6">{section.name}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {section.kind === 'note'
                      ? 'Uploaded by students - you can activate, rename or delete them'
                      : section.description}
                  </Typography>
                </Box>

                <Label color={active ? 'success' : 'default'}>
                  {active} active / {docs.length} total
                </Label>

                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:folder-with-files-bold" />}
                  onClick={() => navigate(paths.admin.catalog.chapterSection(...ids, section.id))}
                >
                  Manage
                </Button>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </DashboardContent>
  );
}
