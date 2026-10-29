import React from 'react';
import { cx } from '../utils/cx';

export function DataTable({
  columns = [],
  data = [],
  rowKey = (row, index) => row.id ?? index,
  empty = 'No records to display.',
  dense = false,
  className = '',
  onRowClick,
}) {
  return (
    <div className={cx('ui-table-wrap', className)}>
      <table className={cx('ui-table', dense && 'ui-table--dense')}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width, textAlign: column.align }}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td className="ui-table__empty" colSpan={columns.length || 1}>
                {empty}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{ textAlign: column.align }}
                    className={cx(column.numeric && 'ui-table__num')}
                  >
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
