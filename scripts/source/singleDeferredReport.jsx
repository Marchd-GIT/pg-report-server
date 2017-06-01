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
            </div>
        )
    }
});
