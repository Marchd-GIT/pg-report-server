<?php
/*
Запросы:
POST
Получение списка датасетов без sql запросов
action=get_datasets
Выполнение основного запроса
action=run_query
query=
{
	"DataSet" : "1",
	"args" : [
			"2015-11-19 20:15:43",
			"2015-11-19 20:20:43",
			"24"
		
	]
}
Выполнения запроса для заполнения select-а
action=get_select_row
query=
{
	"DataSet" : "1",
	"ID_Params" : "4"
}
*/
function get_select_row()
{
    $query = isset($_POST['query']) ? $_POST['query'] : '';
    if ($query !== '') {
        $json_params = json_decode($query);
        $datasets = get_datasets(true);
        foreach( $datasets[$json_params->DataSet]->ParametersList as $val){
           if ($val->id == $json_params->ID_Params)
               $sql_query = $val->query;
        }
        $empty=[];
        query_run(get_connection_string($datasets[$json_params->DataSet]->DataStore),$empty, $sql_query);
    }
    else
        echo "Bed query!";
}

function get_connection_string($id_data_store)
{
    $path="settings/datastore.json";
    $file = fopen($path, "r");
    $json_text = fread($file, filesize($path));
    //echo $json_text;
    $json = json_decode($json_text);
    //echo $json[$id_data_store]->"connection_string";
    //var_dump($json);
    return $json[$id_data_store]->connection_string;
}

function get_datasets($flag)
{
    header('Content-Type: application/json');
    $dsetdir = dir("datasets");
    $files = array();
    while (false !== ($entry = $dsetdir->read())) {
        if (preg_match('/.*.json/', $entry))
            array_push($files, $entry);
    }
    $datasets = array();
    foreach ($files as $val) {
        if($flag)
            array_push($datasets, json_params_get($val,"1"));
        else
            array_push($datasets, json_params_get($val,"0"));
    }
    if($flag) {
        return $datasets;
    }
    else {
        echo json_encode($datasets, JSON_UNESCAPED_UNICODE);
    }
    return 0;
}

function json_params_get($dataset_file,$type)
{
    $file = fopen("datasets/" . $dataset_file, "r");
    $json_text = fread($file, filesize("datasets/" . $dataset_file));
    $json = json_decode($json_text);
    if($type == '0') {
        unset($json->SQL_Query);
        foreach ($json->ParametersList as $type)
            if ($type->type == "query")
                unset($type->query);
    }
    return ($json);
}

function query_run($connection_string, $args_array, $query_string)
{

    $dbconn = pg_pconnect($connection_string);

    if (!$dbconn) {
        echo "An error occured connect to database.\n";
        exit;
    }

    $result = pg_query_params($dbconn, $query_string, $args_array);
    if (!$result) {
        echo "An error occured.\n";
        exit;
    }

    header('Content-Type: application/json');

    $json_result =  new stdClass();
    $json_result->fields = [];
    $json_result->rows = [];
    $i = 0;
    while ($i < pg_num_fields($result)) {
        $fieldName = pg_field_name($result, $i);
        array_push($json_result->fields,$fieldName);
        $i = $i + 1;
    }
    while ($row = pg_fetch_row($result))
           array_push($json_result->rows,$row);

    echo json_encode($json_result, JSON_UNESCAPED_UNICODE);
    pg_free_result($result);
    pg_close($dbconn);
}

function json_query_run()
{
    $query = isset($_POST['query']) ? $_POST['query'] : '';
    if ($query !== '') {
        $json_params = json_decode($query);
        $datasets=get_datasets(true);
        //debug
        //echo get_connection_string($datasets[$json_params->DataSet]->DataStore); //constr
        //var_dump($json_params->args); //params array
       //echo $datasets[$json_params->DataSet]->SQL_Query; //sql query

        query_run(get_connection_string($datasets[$json_params->DataSet]->DataStore), $json_params->args, $datasets[$json_params->DataSet]->SQL_Query);
    } else {
        echo "Bed query!";
    }

}

$action = isset($_POST['action']) ? $_POST['action'] : '';
switch ($action) {
    case "get_datasets":
        get_datasets(false);
        break;
    case "run_query":
        json_query_run();
        break;
    case "get_select_row":
        get_select_row();
        break;
    default:
        echo "Bed parameters!";
}

//debug
//get_connection_string("1");
//get_datasets();
//json_params_get("test.json");
//query_run($connection_string, $args_array, $query_string);
?>