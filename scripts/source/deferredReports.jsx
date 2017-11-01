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
