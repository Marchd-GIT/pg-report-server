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