// var DataTable = React.createClass({
//   render: function() {
//     return (
//
//     );
//   }
// });

var Query = React.createClass({
    getInitialState: function(){
      return {
          options: null
      }
    },
    componentDidMount: function(){
        this.getQueryParams(this.props.item.params.id);
    },
    getQueryParams:function(id){
        var data = JSON.stringify({'DataSet': this.props.currDS.ds, 'ID_Params': id});
        console.log(data);
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_select_row',query: data},
            success: function (data) {
                console.log(data);
                this.prepareQuery(data);
            }.bind(this)
        });
    },
    prepareQuery: function(data){
        var options = data.rows.map(function(item, index){
            return(
                <option value={item}>{item}</option>
            )
        });
        console.log(options);
        this.setState({options:options});
    },
    render: function() {

    return (
        <div>
            <p>{this.props.item.params.name}</p>
            <select id={this.props.item.params.id}>{this.state.options}</select>
        </div>
    );
  }
});

var Interface = React.createClass({
    getInitialState: function () {
        return {
            dataSets: null,
            currDS: 'default',
            state: null,
            table: null,
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
    drawText: function(item){
        return (
            <div>
                <p>{item.name}</p>
                <input id={item.id} type="text"/>
            </div>
        );
    },
    drawInt: function(item){
        return (
            <div>
                <p>{item.name}</p>
                <input id={item.id} type="text"/>
            </div>
        );
    },
    drawDateTime: function(item){
        return (
            <div>
                <p>{item.name}</p>
                <input className="datetime" id={item.id} type="text"/>
            </div>
        );
    },
    drawSelect: function(item){
        return(
            <Query item={{params: item}} currDS={{ds:this.state.currDS}}/>
        )
    },
    getRequestParams:function(){
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
                } else if (item.type == 'int') {
                    return self.drawInt(item);
                } else if (item.type == 'string') {
                    return self.drawText(item);
                }else if(item.type == 'query'){
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
    dataRequest: function () {
        this.setState(
            {status: 'loading'}
        )
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'run_query', query: data},
            success: function (data) {
                console.log(data);
                if(data.rows.length){
                    this.drawTable(data);
                }else{
                    this.setState({error:'Data not found!'});
                }
                this.setState({
                    status: 'ready'
                })
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
        $('.datetime').mask('0000-00-00 00:00:00', {placeholder: "____-__ __:__:__"});
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
                </div>
                <div className="dataTable">
                    {this.state.status == 'loading' ? 'loading...' : this.state.error ? this.state.error : this.state.table}
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