//= dataTable.jsx
//= deferredReports.jsx
//= inputs.jsx
//= interface.jsx
//= singleDeferredReport.jsx

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
