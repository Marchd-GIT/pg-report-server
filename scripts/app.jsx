
// var DataTable = React.createClass({
//   render: function() {
//     return (
//
//     );
//   }
// });

var Interface = React.createClass({
  getInitialState:function(){
    return {
      dataSets: null,
      currDS: 'default',
      state: null
    }
  },
  componentDidMount: function() {
    this.getDatasets();
  },
  getDatasets:function(){
    $.ajax({
      type: "POST",
      url: '/',
      data: {action:'get_datasets'},
      success: function(data){
        console.log(data);
        this.setState({dataSets:data});
      }.bind(this)
    });
  },
  setCurrDS:function(e){
    this.setState({currDS: e.target.value});
  },
  getReportsList:function(){
    if(this.state.dataSets){
      var options = this.state.dataSets.map(function(item,index){
        return (
            <option value={item.DataStore} key={item.DataStore}>
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

    if(this.state.dataSets && this.state.currDS != 'default'){
      this.state.dataSets.forEach(function(item, i, arr) {
        if(item.DataStore == currentDS){
          params = item.ParametersList;
        }
      });

      var dataField = params.map(function(item,index){
        if(item.type == 'timestamp'){
          return (
              <div>
                <p>{item.name}</p>
                <input type="text" />
                <p>Время</p>
                <input type="text" />
              </div>
          );
        }else if(item.type == 'int'){
          return(
              <div>
                <p>{item.name}</p>
                <input type="text" />
              </div>
          );
        }else if(item.type == 'string'){
          return(
              <div>
                <p>{item.name}</p>
                <input type="text" />
              </div>
          );
        }
      });

      console.log(dataField);
      return dataField;
    }
  },
  dataRequest:function(){

  },

  render: function() {

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
            <button style={{display:this.state.currDS == 'default' ? 'none' : ''}} onclick={this.dataRequest}>Поехали</button>
          </div>
        </div>
    );
  }
});

var App = React.createClass({
  render: function() {
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