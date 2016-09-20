// var DataTable = React.createClass({
//   render: function() {
//     return (
//
//     );
//   }
// });

var Interface = React.createClass({
    getInitialState: function () {
        return {
            dataSets: null,
            currDS: 'default',
            state: null,
            table: null
        }
    },
    componentDidMount: function () {
        this.getDatasets();
    },
    getDatasets: function () {
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_datasets'},
            success: function (data) {
                this.setState({dataSets: data});
            }.bind(this)
        });
    },
    setCurrDS: function (e) {
        this.setState({currDS: e.target.value});
    },
    getReportsList: function () {
        if (this.state.dataSets) {
            var options = this.state.dataSets.map(function (item, index) {
                return (
                    <option value={item.ID_Report} key={item.ID_Report}>
                        {item.NameReport}
                    </option>
                )
            });
        }
        return options;
    },
    getRequestParams(){
        var currentDS = this.state.currDS;
        var params = null;

        if (this.state.dataSets && this.state.currDS != 'default') {
            this.state.dataSets.forEach(function (item, i, arr) {
                if (item.ID_Report == currentDS) {
                    params = item.ParametersList;
                }
            });

            var dataField = params.map(function (item, index) {
                if (item.type == 'timestamp') {
                    return (
                        <div>
                            <p>{item.name}</p>
                            <input className="datetime" id={item.id} type="text"/>
                        </div>
                    );
                } else if (item.type == 'int') {
                    return (
                        <div>
                            <p>{item.name}</p>
                            <input id={item.id} type="text"/>
                        </div>
                    );
                } else if (item.type == 'string') {
                    return (
                        <div>
                            <p>{item.name}</p>
                            <input id={item.id} type="text"/>
                        </div>
                    );
                }
            });
            return dataField;
        }
    },
    prepareData: function () {
        var currentDS = this.state.currDS;
        var params = null;

        if (this.state.dataSets && this.state.currDS != 'default') {
            this.state.dataSets.forEach(function (item, i, arr) {
                if (item.ID_Report == currentDS) {
                    params = item.ParametersList;
                }
            });

            var paramsArray = params.map(function (item, index) {
                var element = document.getElementById(item.id);
                if (element) {
                    return element.value;
                }
            });
            var query = {DataSet: this.state.currDS, args: paramsArray};
            return JSON.stringify(query);

        }
    },
    dataRequest: function () {
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            beforeSend: function(){
                console.log("LOAD!");
                this.drawLoad();
            }.bind(this),
            data: {action: 'run_query', query: data},
            success: function (data) {
                console.log(data);
                this.drawTable(data);
            }.bind(this)
        })
    },
    dataRequestXLS: function () {
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'run_query_xls', query: data},
            success: function (data) {
                console.log(this.state);
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);

                link.download = this.state.dataSets[this.state.currDS].NameReport + ".xls";
                link.click();
            }.bind(this)
        })
    },
    dataRequestCSV: function () {
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'run_query_csv', query: data},
            success: function (data) {
                console.log(this.state);
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = this.state.dataSets[this.state.currDS].NameReport + ".csv";
                link.click();
            }.bind(this)
        })
    },

    componentDidUpdate: function () {
        $('.datetime').mask('0000-00-00 00:00:00',{placeholder: "____-__ __:__:__"});
    },
    drawTable: function (data) {
        var table = null;
        var header = null;
        var body = null;
        if (data.fields) {
            header = data.fields.map(function (item, index) {
                return (
                    <th>{item}</th>
                )
            });
            body = data.rows.map(function (row, index) {
                return (
                    <tr>
                        {
                            (function () {
                                var items = row.map(function (item, index) {
                                    return (
                                        <td>{item}</td>
                                    )
                                });
                                return items;
                            })()
                        }
                    </tr>
                )
            });
            console.log(body);
        }
        table = <table>
            <tr>{header}</tr>
            {body}</table>;
        this.setState({table: table});
        console.log(header);
    },
    drawLoad: function () {
        this.setState({table: <div>Loading....</div>});
    },
    render: function () {

        return (
            <div className="wrapper">
                <div className="ui">
                    <div className="logo">
                        Postgres Report Server
                    </div>
                    <div>
                        <select onChange={this.setCurrDS} value={this.state.currDS}>
                            <option value='default' key='default'>Выберите отчет</option>
                            {this.getReportsList()}
                        </select>
                    </div>
                    <div>
                        {this.getRequestParams()}
                    </div>
                    <div>
                        <button style={{display: this.state.currDS == 'default' ? 'none' : ''}}
                                onClick={this.dataRequest}>
                            Сформировать
                        </button><br/>
                        <button style={{display: this.state.currDS == 'default' ? 'none' : ''}}
                                onClick={this.dataRequestCSV}>
                             CSV
                        </button>
                            <button style={{display: this.state.currDS == 'default' ? 'none' : ''}}
                                onClick={this.dataRequestXLS}>
                            XLS
                        </button>
                    </div>
                </div>
                <div className="dataTable">
                    {this.state.table}
                </div>
            </div>
        );
    }
});

var App = React.createClass({
    render: function () {
        return (
            <Interface />
        );
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('container')
);