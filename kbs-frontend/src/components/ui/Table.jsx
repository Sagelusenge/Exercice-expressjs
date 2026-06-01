import clsx from "clsx";

/**
 * Table admin KBS
 * Zebra striping, row height 56px min, spacieux
 */
const Table = ({ columns, data, loading, onRowClick, emptyMessage = "Aucune donnée" }) => {
  if (loading) {
    return (
      <div className="w-full">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-outline-variant animate-pulse">
            {columns.map((_, j) => (
              <div key={j} className="h-4 bg-surface-high rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-16 text-on-surface-variant">
        <p className="font-inter text-body-md">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "px-4 py-3 text-left text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider",
                  col.className
                )}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={clsx(
                "kbs-table-row min-h-[56px]",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className={clsx("px-4 py-3.5", col.cellClassName)}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;