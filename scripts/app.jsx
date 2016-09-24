var DataTable = React.createClass({
  prepareTable: function (data) {
    console.log(data);
    var header = null;
    var body = null;
    if (data && data.fields) {
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
    var table = <table>
      <tr>{header}</tr>
      {body}</table>;
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
    console.log(data);
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
      console.log(options);
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

var DeferredReports = React.createClass({
  getInitialState: function(){
    return{
      requests: null
    }
  },
  getCookie: function(name){
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  },
  getData: function(e){
    var position = e.target.name;
    var queries = JSON.parse(this.getCookie('QUERIES'));
    var id = queries[position];

    $.ajax({
      type: "POST",
      url: '/',
      data: {action: 'get_result', id: id},
      success: function (data) {
        console.log(data);
      }.bind(this)
    });
  },
  rmData: function(e){
    var position = e.target.name;
    var queries = JSON.parse(this.getCookie('QUERIES'));
    var id = queries[position];

    $.ajax({
      type: "POST",
      url: '/',
      data: {action: 'rm_result', id: id},
      success: function (data) {
        console.log(data);
      }.bind(this)
    });
  },
  getDReportsInfo: function() {
    var self = this;
    if(this.getCookie('QUERIES')){
      var queries = JSON.parse(this.getCookie('QUERIES'));
      if(queries){
        var DReportsList = queries.map(function(item, index){
          return(
              <div>
                <p>Имя: тест</p>
                <p>Статус: неизвестен</p>
                <button name={index} onClick={self.getData}>Получить</button>
                <button name={index} onClick={self.rmData}>Удалить</button>
              </div>
          )
        });

        !this.state.requests ? this.setState({requests:true}) : null;
        return DReportsList;
      }
    }

  },

  render: function () {
    return (
        <div>
          <p>Отложенные запросы.</p>
          <p>{this.state.requests ? 'Запросы в ожидании:' : 'Нет запросов'}</p>
          {this.getDReportsInfo()}
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
    console.log(typeof data.status);
    switch (data.status) {
      case '0':
        console.log('good');
        this.setState({error: null});
        this.setState({tableData: data.body});
        break;
      case '1':
        this.setState({error: 'Долгий запрос!'});
        break;
      case '2':
        this.setState({error: 'Data not found!'});
        break;
      case '3':
        this.setState({error: 'Error while make a db request!'});
    }
    this.setState({status: 'ready'});
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
              <DeferredReports />
            </div>
          </div>
          <div className="dataTable">
            {this.state.status == 'loading' ? 'loading...' : this.state.error ? this.state.error : this.drawTable()}
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