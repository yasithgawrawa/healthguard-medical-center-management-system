export const DataTable = ({ columns = [], rows = [], rowKey = "_id", emptyText = "No records found" }) => (
  <div className="data-table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length ? (
          rows.map((row, rowIndex) => (
            <tr key={row[rowKey] || rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row, rowIndex) : row[column.key]}</td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td className="data-table-empty" colSpan={columns.length}>
              {emptyText}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
