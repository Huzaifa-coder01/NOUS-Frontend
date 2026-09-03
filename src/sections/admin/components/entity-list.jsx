import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { STATUS } from 'src/_mock/_nous';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { EntityDialog } from './entity-dialog';
import { StatusSwitch } from './status-switch';

// ----------------------------------------------------------------------

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: STATUS.active, label: 'Active' },
  { value: STATUS.inactive, label: 'Inactive' },
];

/**
 * The template's list-page pattern (breadcrumbs → card → search toolbar →
 * status tabs → filter chips → sortable, selectable table → pagination) wired
 * to one entity.
 *
 * Every catalog CRUD screen renders through this so they all behave the same:
 * search, status filtering, activate/deactivate, delete and pagination come for
 * free and stay consistent.
 */
export function EntityList({
  heading,
  links,
  rows,
  columns,
  searchFields = ['name'],
  searchPlaceholder = 'Search...',
  createLabel,
  editLabel,
  fields,
  emptyValues,
  toValues,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
  onOpen,
  onToggleStatus,
  cascades = false,
  deleteNote,
  openLabel = 'Manage',
  describe = (row) => row.name,
  statusOf = (row) => row.status,
  extraActions,
  toolbar,
}) {
  const table = useTable({ defaultRowsPerPage: 10 });

  const confirmMany = useBoolean();

  const [dialog, setDialog] = useState(null);
  const [confirmRow, setConfirmRow] = useState(null);

  const filters = useSetState({ query: '', status: 'all' });

  const dataFiltered = applyFilter({
    inputData: rows,
    comparator: getComparator(table.order, table.orderBy),
    query: filters.state.query,
    status: filters.state.status,
    searchFields,
    statusOf,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = !!filters.state.query || filters.state.status !== 'all';

  const notFound = !dataFiltered.length;

  const handleSearch = useCallback(
    (event) => {
      table.onResetPage();
      filters.setState({ query: event.target.value });
    },
    [filters, table]
  );

  const handleStatusTab = useCallback(
    (event, value) => {
      table.onResetPage();
      filters.setState({ status: value });
    },
    [filters, table]
  );

  const handleSubmit = async (values) => {
    if (dialog?.mode === 'edit') {
      await onUpdate(dialog.row, values);
    } else {
      await onCreate(values);
    }

    toast.success(dialog?.mode === 'edit' ? 'Update success!' : 'Create success!');
  };

  const handleDeleteRow = async () => {
    const row = confirmRow;

    setConfirmRow(null);

    try {
      await onDelete(row);

      toast.success('Delete success!');
      table.onUpdatePageDeleteRow(dataInPage.length);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteRows = async () => {
    confirmMany.onFalse();

    const selectedRows = rows.filter((row) => table.selected.includes(rowKey(row)));

    const results = await Promise.allSettled(selectedRows.map((row) => onDelete(row)));

    const failed = results.filter((result) => result.status === 'rejected');

    if (failed.length) {
      toast.error(failed[0].reason?.message ?? 'Some items could not be deleted');
    } else {
      toast.success('Delete success!');
    }

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  };

  const handleMove = async (row, direction) => {
    try {
      await onMove(row, direction);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const tableHead = [
    ...columns.map((column) => ({ id: column.id, label: column.label, width: column.width })),
    ...(onToggleStatus ? [{ id: 'status', label: 'Status', width: 160 }] : []),
    { id: '', width: 140 },
  ];

  const counts = {
    all: rows.length,
    [STATUS.active]: rows.filter((row) => statusOf(row) === STATUS.active).length,
    [STATUS.inactive]: rows.filter((row) => statusOf(row) !== STATUS.active).length,
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={heading}
        links={links}
        action={
          onCreate && (
            <Button
              variant="contained"
              onClick={() => setDialog({ mode: 'create' })}
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {createLabel}
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <Tabs
          value={filters.state.status}
          onChange={handleStatusTab}
          sx={{ px: 2.5, boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.palette.grey[500]}14` }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={tab.value === filters.state.status ? 'filled' : 'soft'}
                  color={
                    (tab.value === STATUS.active && 'success') ||
                    (tab.value === STATUS.inactive && 'default') ||
                    'info'
                  }
                >
                  {counts[tab.value]}
                </Label>
              }
            />
          ))}
        </Tabs>

        <Stack spacing={2} sx={{ p: 2.5 }} direction={{ xs: 'column', md: 'row' }}>
          <TextField
            fullWidth
            value={filters.state.query}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {extraActions}
        </Stack>

        {toolbar}

        {canReset && (
          <FiltersResult
            totalResults={dataFiltered.length}
            onReset={() => filters.setState({ query: '', status: 'all' })}
            sx={{ p: 2.5, pt: 0 }}
          >
            <FiltersBlock label="Search:" isShow={!!filters.state.query}>
              <Chip
                {...chipProps}
                label={filters.state.query}
                onDelete={() => {
                  table.onResetPage();
                  filters.setState({ query: '' });
                }}
              />
            </FiltersBlock>

            <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
              <Chip
                {...chipProps}
                label={filters.state.status}
                onDelete={() => {
                  table.onResetPage();
                  filters.setState({ status: 'all' });
                }}
              />
            </FiltersBlock>
          </FiltersResult>
        )}

        <Box sx={{ position: 'relative' }}>
          <TableSelectedAction
            dense={table.dense}
            numSelected={table.selected.length}
            rowCount={dataFiltered.length}
            onSelectAllRows={(checked) => table.onSelectAllRows(checked, dataFiltered.map(rowKey))}
            action={
              onDelete && (
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmMany.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              )
            }
          />

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={tableHead}
                rowCount={dataFiltered.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(checked, dataFiltered.map(rowKey))
                }
              />

              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row, index) => (
                    <TableRow
                      key={rowKey(row)}
                      hover
                      selected={table.selected.includes(rowKey(row))}
                      sx={statusOf(row) === STATUS.active ? undefined : { opacity: 0.6 }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          id={rowKey(row)}
                          checked={table.selected.includes(rowKey(row))}
                          onClick={() => table.onSelectRow(rowKey(row))}
                        />
                      </TableCell>

                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          sx={{ whiteSpace: column.nowrap ? 'nowrap' : undefined }}
                        >
                          {column.render ? column.render(row) : row[column.id]}
                        </TableCell>
                      ))}

                      {onToggleStatus && (
                        <TableCell>
                          <StatusSwitch
                            row={row}
                            cascades={cascades}
                            hiddenByParent={!!row.hiddenByParent}
                            onToggle={onToggleStatus}
                          />
                        </TableCell>
                      )}

                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {onMove && (
                            <>
                              <Tooltip title="Move up">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={index === 0 || table.page > 0 || canReset}
                                    onClick={() => handleMove(row, -1)}
                                  >
                                    <Iconify icon="eva:arrow-ios-upward-fill" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move down">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={index === dataFiltered.length - 1 || canReset}
                                    onClick={() => handleMove(row, 1)}
                                  >
                                    <Iconify icon="eva:arrow-ios-downward-fill" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}

                          {onUpdate && (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => setDialog({ mode: 'edit', row })}
                              >
                                <Iconify icon="solar:pen-bold" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {onDelete && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setConfirmRow(row)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {onOpen && (
                            <Button size="small" variant="contained" onClick={() => onOpen(row)}>
                              {openLabel}
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 56 + 20}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {!!fields && (
        <EntityDialog
          open={!!dialog}
          title={
            dialog?.mode === 'edit' ? editLabel ?? `Edit ${heading.toLowerCase()}` : createLabel
          }
          fields={typeof fields === 'function' ? fields(dialog?.mode === 'edit') : fields}
          initialValues={dialog?.mode === 'edit' ? toValues(dialog.row) : emptyValues}
          onClose={() => setDialog(null)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!confirmRow}
        onClose={() => setConfirmRow(null)}
        title="Delete"
        content={
          confirmRow ? (
            <>
              <strong>{describe(confirmRow)}</strong> will be removed.
              {!!deleteNote && (
                <Box component="span" sx={{ display: 'block', mt: 1 }}>
                  {deleteNote}
                </Box>
              )}
            </>
          ) : (
            ''
          )
        }
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmMany.value}
        onClose={confirmMany.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
            {!!deleteNote && (
              <Box component="span" sx={{ display: 'block', mt: 1 }}>
                {deleteNote}
              </Box>
            )}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRows}>
            Delete
          </Button>
        }
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

/** Flattened admin modules carry a composite `rowId`; catalog rows use `id`. */
function rowKey(row) {
  return row.rowId ?? row.id;
}

function applyFilter({ inputData, comparator, query, status, searchFields, statusOf }) {
  const stabilized = inputData.map((el, index) => [el, index]);

  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let data = stabilized.map((el) => el[0]);

  if (status !== 'all') {
    data = data.filter((row) =>
      status === STATUS.active ? statusOf(row) === STATUS.active : statusOf(row) !== STATUS.active
    );
  }

  if (query) {
    const needle = query.toLowerCase();

    data = data.filter((row) =>
      searchFields.some((field) =>
        String(row[field] ?? '')
          .toLowerCase()
          .includes(needle)
      )
    );
  }

  return data;
}
