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
