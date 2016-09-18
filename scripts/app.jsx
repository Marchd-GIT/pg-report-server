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
                            <input className="datetime" id={item.id} type="text" />
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
    prepareData:function(){
        var currentDS = this.state.currDS;
        var params = null;

        if (this.state.dataSets && this.state.currDS != 'default') {
            this.state.dataSets.forEach(function (item, i, arr) {
                if (item.ID_Report == currentDS) {
                    params = item.ParametersList;
                }
            });

            var paramsArray = params.map(function(item, index){
                var element = document.getElementById(item.id);
                if(element){
                    return element.value;
                }
            });
            var query = {DataSet:this.state.currDS,args:paramsArray};
            return JSON.stringify(query);

        }
    },
    dataRequest: function () {
        var data = this.prepareData();
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'run_query',query: data},
            success: function (data) {
                console.log(data);
                this.drawTable(data);
            }.bind(this)
        })
    },
    componentDidUpdate:function(){
        $('.datetime').mask('0000-00-00 00:00:00');
    },
    drawTable:function(data){
        var table = null;
        var header = null;
        var body = null;
        if(data.fields){
            header = data.fields.map(function(item, index){
               return (
                   <th>{item}</th>
               )
            });
            body = data.rows.map(function(row, index){
               return(
               <tr>
                {
                (function(){
                  var items = row.map(function(item, index){
                      return(
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
        table = <table><tr>{header}</tr>{body}</table>;
        this.setState({table:table});
        console.log(header);
    },
    render: function () {

        return (
            <div>
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
                    <button style={{display: this.state.currDS == 'default' ? 'none' : ''}} onClick={this.dataRequest}>
                        Поехали
                    </button>
                </div>
                <div>
                    {this.state.table}
                </div>
            </div>
        );
    }
});

var App = React.createClass({
    render: function () {
        return (
            <div>
                <Interface />
                {/*<DataTable />*/}
            </div>
        );
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('container')
);