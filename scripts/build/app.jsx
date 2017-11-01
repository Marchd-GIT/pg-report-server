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
    getInitialState: function () {
        return {
            state: 'ready',
            requests: false
        }
    },
    rmData: function (e) {
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        window.history.pushState("", "", "/");
        if (dataRequest["is_owner"]) {
            $.ajax({
                type: "POST",
                url: 'st.php',
                data: {action: 'rm_result', id: id},
                success: function (data) {
                    this.getDReportsInfo();
                    this.setState({state: 'ready'});
                }.bind(this)
            });
        }
        else {
            //emove queries[position];
            queries.splice(position, 1);
            var nowdatetime = new Date();
            nowdatetime.setDate(nowdatetime.getDate() + 365);
            var date = nowdatetime.toUTCString();
            document.cookie = "QUERIES=" + JSON.stringify(queries) + ";" + "path=/; expires=" + date + "; domain=."+document.location.host;
            this.getDReportsInfo();
            this.setState({state: 'ready'});
        }
    },
    findGetParameter: function (parameterName) {
        var result = null,
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    },
    getCookie: function (name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },
    getDReportsInfo: function () {
        var self = this;
        var GetReport = JSON.parse(this.findGetParameter('Report'));
            if (GetReport) {
                var co = this.getCookie('QUERIES') ? JSON.parse(this.getCookie('QUERIES')) : [];

                function ifind(item) {
                    if (item.id == GetReport.id)
                        return item.id;
                }
                if( co.find(ifind) == null){
                    for (var key in co) {
                        if (co[key] == GetReport) {
                            GetReport = false;
                        }
                    }
                    co.push(GetReport);
                    var nowdatetime = new Date();
                    nowdatetime.setDate(nowdatetime.getDate() + 365);
                    var date = nowdatetime.toUTCString();
                    document.cookie = 'QUERIES=' + JSON.stringify(co) + ";" + "path=/; expires=" + date + "; domain=."+document.location.host;
                }
            }

        if (this.getCookie('QUERIES')) {
            var queries = JSON.parse(this.getCookie('QUERIES'));
            if (queries.length > 0) {
                var DReportsList = queries.map(function (item, index) {
                    var value = {
                        item: item,
                        index: index,
                        interface: self.props.interface.interface,
                        father: self
                    };
                    return (
                        <SingleDeferredReport key={item.id} data={value}/>
                    )
                });
                this.state.requests = true;
                return DReportsList;
            }
            else {
                this.state.requests = false;
            }
        }
    },

    render: function () {
        return (
            <div>
                <p>{this.state.requests ? 'Запросы в ожидании:' : 'Нет запросов в ожидании'}</p>
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
            url: 'st.php',
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
                <center>
                <input type="search" id="brand-filter" placeholder="Rechercher..." name="brands" data-list="brands-list" autocomplete="off" required />
                <label for="brand-filter" data-icon="🔍"></label>
                <datalist id="brands-list">
                <select id={this.props.item.params.id}>{this.state.options}</select>
                </datalist>
                </center>
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
            url: 'st.php',
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
                    <option value={item.ID_Report} key={index}>
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
                this.setState({error: ''});
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
            url: 'st.php',
            data: {action: 'run_query', query: data},
            success: function (data) {
                this.setState({status: 'ready'});
                //this.dataHandler(data);
            }.bind(this)
        })
    },
    drawTable: function () {
        return <DataTable data={{tableData: this.state.tableData}}/>
    },

    render: function () {

        return (
            <div className="wrapper" id="wrapper">
                <div className="ui" id="ui">
                    <div className="logo">
                        Database Reports
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
                    </div>
                    <div>
                        <DeferredReports interface={{interface: this}}/>
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
    getCookie: function (name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    },

    getData: function (e) {
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        delete dataRequest["is_owner"];
        window.history.pushState("","", "?Report="+JSON.stringify(dataRequest));
        $.ajax({
            type: "POST",
            url: 'st.php',
            data: {action: 'get_result', id: id, format: "json"},
            success: function (data) {
                if (data.status == '0') {
                    this.props.data.interface.setState({error: null});
                    this.props.data.interface.setState({tableData: data.body});
                    this.setState({statusQueryString: "Готов"});
                } else if (data.status == '1') {
                    this.setState({statusQueryString: "Выполняется"});
                }
                this.setState({state: 'ready'});
            }.bind(this)
        });
    },
    getStatus: function () {
        var position = this.props.data.index;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        if (typeof dataRequest != "undefined") {
            var id = dataRequest.id;
            var name = dataRequest.name;
            var date = dataRequest.creation_date;
            $.ajax({
                type: "POST",
                url: 'st.php',
                data: {action: 'get_result', id: id, format: "json"},
                success: function (data) {
                    switch (data.status) {
                        case '0':
                            notice(('Отчет ' + name + ' готов!').replace(/\+/g, ' '), ('Время старта: ' + date).replace(/\+/g, ' '));
                            this.setState({statusQueryString: "Готов"});
                            break;
                        case '1':
                            setTimeout(this.getStatus, 1000);
                            break;
                        case '2':
                            notice(('Отчет ' + name + ' не содержит данных!').replace(/\+/g, ' '), ('Время старта: ' + date).replace(/\+/g, ' '));
                            this.setState({statusQueryString: "Нет данных"});
                            break;
                        case '3':
                            notice(('Отчет ' + name + ' получил ошибку!').replace(/\+/g, ' '), ('Время старта: ' + date).replace(/\+/g, ' '));
                            this.setState({statusQueryString: "Ошибка"});
                            break;
                    }
                }.bind(this)
            });
        }
    },

    getDataCSV: function (e) {
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        var name = dataRequest.name;
        $.ajax({
            type: "POST",
            url: 'st.php',
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

    getDataXLS: function (e) {
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        var name = dataRequest.name;

        $.ajax({
            type: "POST",
            url: 'st.php',
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
    sendToEmail: function (e) {
        this.setState({state: 'loading'});
        var position = e.target.name;
        var queries = JSON.parse(this.getCookie('QUERIES'));
        var dataRequest = queries[position];
        var id = dataRequest.id;
        var name = dataRequest.name.replace(/\+/g, ' ') + ' ' + dataRequest.arguments.join(' ');
        var Email = document.getElementById(id).value;

        $.ajax({
            type: "POST",
            url: 'st.php',
            data: {email: Email,action: 'get_result', id: id, format: "email",name: name},
            success: function (data) {
                document.getElementById(id).value = 'Письмо отправлено.';
            }.bind(this)
        });
    },
    render: function () {
        var item = this.props.data.item;
        var index = this.props.data.index;
        var father = this.props.data.father;
        return (
            <div className="repUI" id={index}>
                <p className="short_text">Имя: {item.name.replace(/\+/g, ' ')}</p>
                <p>Состояние: {this.state.statusQueryString}</p>
                <p>Дата создания: <br/>{item.creation_date.replace(/\+/g, ' ')}</p>
                <p>Параметры запроса: <br/>{item.arguments.length > 0 ? item.arguments.map(function (itim, index) {
                    return (<p className="short_text">№{index}:{itim.replace(/\+/g, ' ')}</p>
                    )
                }) : <p>Нет параметров</p>}
                </p>
                <button name={index} onClick={this.getData}>Получить</button>
                <button name={index} onClick={father.rmData}>Удалить</button>
                <br/>
                <button name={index} onClick={this.getDataCSV}>
                    CSV
                </button>
                <button name={index} onClick={this.getDataXLS}>
                    XLS
                </button>
                <button name={index} onClick={this.sendToEmail}>
                    Oтправить на почту
                </button>
                <input name={index} id={this.props.data.item.id} placeholder="E-Mail" type="email" className="emailInput"></input>
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
$('input[data-list]').each(function () {
    var availableTags = $('#' + $(this).attr("data-list")).find('option').map(function () {
        return this.value;
    }).get();

    $(this).autocomplete({
        source: availableTags
    }).on('focus', function () {
        $(this).autocomplete('search', ' ');
    }).on('search', function () {
        if ($(this).val() === '') {
            $(this).autocomplete('search', ' ');
        }
    });
});