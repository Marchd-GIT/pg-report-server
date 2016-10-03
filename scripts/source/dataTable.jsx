var DataTable = React.createClass({
    prepareTable: function (data) {
        var header = null;
        var body = null;
        if (data && data.fields) {
            header = data.fields.map(function (item, index) {
                return (
                    <th key={index}>{item}</th>
                )
            });
            body = data.rows.map(function (row, index) {
                return (
                    <tr key={index}>
                        {
                            (function () {
                                var items = row.map(function (item, index) {
                                    return (
                                        <td key={index}>{item}</td>
                                    )
                                });
                                return items;
                            })()
                        }
                    </tr>
                )
            });
        }
        var table = <table><tbody>
            <tr>{header}</tr>
            {body}</tbody></table>;
        return table;
    },

    render: function () {
        return (
            <div>
                {this.prepareTable(this.props.data.tableData)}
            </div>
        );
    }
});

