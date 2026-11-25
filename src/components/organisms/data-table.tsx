import type { ReactNode } from 'react';

export type Column<T> = { key: string; header: string; cell: (row: T) => ReactNode };

type Props<T> = {
  /** Accessible name of the table (visually hidden). */
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Shown instead of the table when there are no rows. */
  empty: ReactNode;
};

// Figma: Data table. Receives rows by props: it never fetches.
export const DataTable = <T,>({ caption, columns, empty, rowKey, rows }: Props<T>) =>
  rows.length === 0 ? (
    <p className="rounded-card border border-line bg-surface p-6 text-center text-fg-muted">
      {empty}
    </p>
  ) : (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-muted text-caption text-fg-muted uppercase">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-semibold" key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-line" key={rowKey(row)}>
              {columns.map((column) => (
                <td className="px-4 py-3" key={column.key}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
