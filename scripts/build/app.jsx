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
var DeferredReports = React.createClass({
    getInitialState: function(){
        return{
            state: 'ready',
            requests: false
        }
    },
/*    componentWillMount(){
        !this.state.requests ? this.setState({requests:true}) : null;
    },*/
    getCookie: function(name){
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },
    getDReportsInfo: function() {
        var self = this;
        if(this.getCookie('QUERIES')){
            var queries = JSON.parse(this.getCookie('QUERIES'));
            if(queries.length > 0 ){
                 var DReportsList = queries.map(function(item, index){
                    var value = {
                        item : item,
                        index : index,
                        interface : self.props.interface.interface,
                        phaser: self};
                    return(
                        <SingleDeferredReport key={item.id} data={value}/>
                    )
                });

                this.state.requests=true;
                return DReportsList;
            }
            else{
                this.state.requests=false;
            }
        }
    },

    render: function () {
        return (
            <div>
                <p>{this.state.requests ? 'Запросы в ожидании:' : 'Нет запросов'}</p>
                <ReactCSSTransitionGroup
                    transitionName="slide"
                    transitionEnterTimeout={500}
                    transitionLeaveTimeout={300}>
                    {this.getDReportsInfo()}
                </ReactCSSTransitionGroup>

            </div>
        );
    }
});
var TextInput = React.createClass({
    render: function () {
        return (
            <div>
                <p>{this.props.data.item.name}</p>
                <input id={this.props.data.item.id} type="text"/>
            </div>
        );
    }
});

var IntInput = React.createClass({
    render: function () {
        return (
            <div>
                <p>{this.props.data.item.name}</p>
                <input id={this.props.data.item.id} type="text"/>
            </div>
        );
    }
});

var DateTimeInput = React.createClass({
    componentDidMount: function () {
        $('#' + this.props.data.item.id).mask('0000-00-00 00:00:00', {placeholder: "____-__ __:__:__"});
    },
    render: function () {
        return (
            <div>
                <p>{this.props.data.item.name}</p>
                <input className="datetime" id={this.props.data.item.id} type="text"/>
            </div>
        );
    }
});

var DateInput = React.createClass({
    componentDidMount: function () {
        $('#' + this.props.data.item.id).mask('0000-00-00', {placeholder: "____-__-__"});
    },
    render: function () {
        return (
            <div>
                <p>{this.props.data.item.name}</p>
                <input className="date" id={this.props.data.item.id} type="text"/>
            </div>
        );
    }
});

var QuerySelect = React.createClass({
    getInitialState: function () {
        return {
            options: null
        }
    },
    componentDidMount: function () {
        this.getQueryParams(this.props.item.params.id);
    },
    getQueryParams: function (id) {
        var data = JSON.stringify({'DataSet': this.props.currDS.ds, 'ID_Params': id});
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_select_row', query: data},
            success: function (data) {
                this.prepareQuery(data);
            }.bind(this)
        });
    },
    prepareQuery: function (data) {
        if(data){
            var options = data.body.rows.map(function (item, index) {
                return (
                    <option value={item}>{item}</option>
                )
            });
            this.setState({options: options});
        }
    },
    render: function () {

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
var SingleDeferredReport = React.createClass({
    getInitialState: function () {
        return {
            state: 'ready',
            statusQueryString: 'Выполняется'
        }
    },
    componentDidMount: function () {
        this.getStatus();
    },
    componentWillUnmount () {
        clearTimeout(this.state.timeout);
    },
    getCookie: function(name){
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },

    getData: function(e){
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_result', id: id, format: "json"},
            success: function (data) {
                if(data.status == '0'){
                    this.props.data.interface.setState({error: null});
                    this.props.data.interface.setState({tableData: data.body});
                    this.setState({statusQueryString : "Готов"});

                }else if(data.status  == '1'){
                    this.setState({statusQueryString : "Выполняется"});
                }
                this.setState({state: 'ready'});
            }.bind(this)
        });
    },
    getStatus: function(){
        var position = this.props.data.index;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        if (typeof dataRequest != "undefined") {
            var id = dataRequest.id;
            var name = dataRequest.name;
            var date = dataRequest.creation_date;
            $.ajax({
                type: "POST",
                url: '/',
                data: {action: 'get_result', id: id, format: "json"},
                success: function (data) {
                    if (data.status == '0') {
                        notice(('Отчет ' + name + ' готов!').replace(/\+/g, ' '), ('Время старта: ' + date).replace(/\+/g, ' '));
                        this.setState({statusQueryString: "Готов"});
                        //clearTimeout(this.state.timeout);
                    } else if (data.status == '1') {
                        //this.setState({statusQueryString : "Выполняется"});
                        setTimeout(this.getStatus, 1000);
                    }

                }.bind(this)
            });
        }
    },

    getDataCSV: function(e){
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        var name = dataRequest.name;
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_result', id: id, format: "csv"},
            success: function (data) {
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = (name + ".csv").replace(/\+/g, ' ');
                link.click();
            }.bind(this)
        });
    },

    getDataXLS: function(e){
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        var name = dataRequest.name;

        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'get_result', id: id, format: "xls"},
            success: function (data) {
                var blob = new Blob([data]);
                var link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = (name + ".xls").replace(/\+/g, ' ');
                link.click();
            }.bind(this)
        });
    },

    rmData: function(e){
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        $.ajax({
            type: "POST",
            url: '/',
            data: {action: 'rm_result', id: id},
            success: function (data) {
                this.props.data.phaser.getDReportsInfo();
                this.props.data.phaser.setState({state: 'ready' });
            }.bind(this)
        });
    },

    render: function() {
        var item = this.props.data.item;
        var index = this.props.data.index;
        return (
            <div className="repUI" id={index}>
                <p>Имя: {item.name.replace(/\+/g, ' ')}</p>
                <p>Состояние: {this.state.statusQueryString}</p>
                <p>Дата создания: <br/>{item.creation_date.replace('+', ' ')}</p>
                <p>Параметры запроса: <br/>{item.arguments.map(function (etim, endex) {
                    return (<p>{etim.replace('+', ' ')}</p>)
                })}
                </p>
                <button name={index} onClick={this.getData}>Получить</button>
                <button name={index} onClick={this.rmData}>Удалить</button>
                <br/>
                <button name={index} onClick={this.getDataCSV}>
                    CSV
                </button>
                <button name={index} onClick={this.getDataXLS}>
                    XLS
                </button>
            </div>
        )
    }
});

var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;



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


var focustab=true;

window.onfocus = function(){
  focustab=true;
};
window.onblur = function(){
  focustab=false;
};

Notification.requestPermission( newMessage );

function newMessage(permission) {
  if( permission != "granted" ) return false;
  //var notify = new Notification("Привет, я оповещатель и я включен! ");
};

function notice(name,body){

  if( !focustab  ){
    var MessNotification = new Notification(
        name, {
          tag : name,
          body : body,
          icon : "",
          iconUrl: ""
        });

    MessNotification.onclick= function(){
      MessNotification.close();
      return window.focus();
    }
  }
}