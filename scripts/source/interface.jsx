var Interface = React.createClass({
    getInitialState: function () {
        return {
            dataSets: null,
            currDS: 'default',
            state: null,
            tableData: null,
            status: null,
            error: null
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
    drawText: function (item) {
        return (
            <TextInput data={{item: item}}/>
        );
    },
    drawInt: function (item) {
        return (
            <IntInput data={{item: item}}/>
        );
    },
    drawDateTime: function (item) {
        return (
            <DateTimeInput data={{item: item}}/>
        );
    },
    drawDate: function (item) {
        return (
            <DateInput data={{item: item}}/>
        );
    },
    drawSelect: function (item) {
        return (
            <QuerySelect item={{params: item}} currDS={{ds: this.state.currDS}}/>
        )
    },
    getRequestParams: function () {
        var self = this;
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
                    return self.drawDateTime(item);
                } else if (item.type == 'date') {
                    return self.drawDate(item);
                } else if (item.type == 'int') {
                    return self.drawInt(item);
                } else if (item.type == 'string') {
                    return self.drawText(item);
                } else if (item.type == 'query') {
                    return self.drawSelect(item);
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
    dataHandler: function (data) {
        switch (data.status) {
            case '0':
                this.setState({tableData: data.body, error: null});
                break;
            case '1':
                this.setState({error: 'Долгий запрос'});
                break;
            case '2':
                this.setState({error: 'Нет данных'});
                break;
            case '3':
                this.setState({error: 'Ошибка запроса'});
        }
        // this.setState({status: 'ready'});
    },
    dataRequest: function () {
        this.setState({status: 'loading'});
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'run_query', query: data},
            success: function (data) {
                this.setState({status: 'ready'});
                this.dataHandler(data);
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
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = (this.state.dataSets[this.state.currDS].NameReport + ".xls").replace(/\+/g, ' ');
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
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = (this.state.dataSets[this.state.currDS].NameReport + ".csv").replace(/\+/g, ' ');
                link.click();
            }.bind(this)
        })
    },
    drawTable: function () {
        return <DataTable data={{tableData: this.state.tableData}}/>
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
                        </button>
                        <br/>
                        <button style={{display: this.state.currDS == 'default' ? 'none' : ''}}
                                onClick={this.dataRequestCSV}>
                            CSV
                        </button>
                        <button style={{display: this.state.currDS == 'default' ? 'none' : ''}}
                                onClick={this.dataRequestXLS}>
                            XLS
                        </button>
                    </div>
                    <div>
                        <DeferredReports interface={{interface:this}} />
                    </div>
                </div>
                <div className="dataTable">
                    {this.state.status == 'loading' ? 'loading...' : this.state.error ? this.state.error : this.drawTable()}
                </div>
            </div>
        );
    }
});