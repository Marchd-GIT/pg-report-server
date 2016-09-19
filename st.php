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
    $sql_query = "";
    if ($query !== '') {
        $json_params = json_decode($query);
        $datasets = get_datasets(true);
        foreach ($datasets[$json_params->DataSet]->ParametersList as $val) {
            if ($val->id == $json_params->ID_Params)
                $sql_query = $val->query;
        }
        $empty = [];
        if ($sql_query != '')
            query_run(get_connection_string($datasets[$json_params->DataSet]->DataStore), $empty, $sql_query, "json");
    } else
        echo "Bed query!";
}

function get_connection_string($id_data_store)
{
    $path = "settings/datastore.json";
    $file = fopen($path, "r");
    $json_text = fread($file, filesize($path));
    $json = json_decode($json_text);

    foreach ($json as $value)
        if ($id_data_store == $value->id)
            return $value->connection_string;
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
        if ($flag)
            array_push($datasets, json_params_get($val, "1"));
        else
            array_push($datasets, json_params_get($val, "0"));
    }
    if ($flag) {
        return $datasets;
    } else {
        echo json_encode($datasets, JSON_UNESCAPED_UNICODE);
    }
    return 0;
}

function json_params_get($dataset_file, $type)
{
    $file = fopen("datasets/" . $dataset_file, "r");
    $json_text = fread($file, filesize("datasets/" . $dataset_file));
    $json = json_decode($json_text);
    if ($type == '0') {
        unset($json->SQL_Query);
        foreach ($json->ParametersList as $type)
            if ($type->type == "query")
                unset($type->query);
    }
    return ($json);
}

function query_run($connection_string, $args_array, $query_string, $format)
{

    $dbconn = pg_pconnect($connection_string);

    if (!$dbconn) {
        echo "An error occured connect to database.\n";
        exit;
    }
    $query = base64_decode($query_string);

    //echo  pg_prepare($dbconn, "my_query", '$args_array');
    $rrr = 0;
    $prepquery = '';
    //var_dump($args_array);
    while (count($args_array) > $rrr) {
        $prepquery = preg_replace('/\$' . ($rrr + 1) . '/', "'" . $args_array[$rrr] . "'", $query);
        $query = $prepquery;
        $rrr = $rrr + 1;
    }
    //echo $prepquery;


    //$result = pg_execute($dbconn, "my_query", $args_array);
    pg_send_query($dbconn, $prepquery);
    $result = pg_get_result($dbconn);
        if (!$result) {
            echo "An error occured.\n";
            exit;
        }


        if ($format == "json") {
            header('Content-Type: application/json');

            $json_result = new stdClass();
            $json_result->fields = [];
            $json_result->rows = [];
            $i = 0;
            while ($i < pg_num_fields($result)) {
                $fieldName = pg_field_name($result, $i);
                array_push($json_result->fields, $fieldName);
                $i = $i + 1;
            }
            while ($row = pg_fetch_row($result))
                array_push($json_result->rows, $row);

            echo json_encode($json_result, JSON_UNESCAPED_UNICODE);
        } elseif ($format == "xls") {
            header('Content-Type: text/html; charset=utf-8');
            header('P3P: CP="NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM"');
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('Cache-Control: post-check=0, pre-check=0', FALSE);
            header('Pragma: no-cache');
            header('Content-transfer-encoding: binary');
            header('Content-Disposition: attachment;');
            header('Content-Type: application/x-unknown');
            $i = 0;
            echo '<html><body><table height=auto width=auto border=\'1\' rules=\'rows\' ><tr>';
            while ($i < pg_num_fields($result)) {
                $fieldName = pg_field_name($result, $i);
                echo '<th bgcolor=\'#16a085\'>' . $fieldName . '</th>';
                $i = $i + 1;
            }
            echo '</tr>';
            $i = 0;

            while ($row = pg_fetch_row($result)) {
                echo '<tr>';
                $count = count($row);
                $y = 0;
                while ($y < $count) {
                    $c_row = current($row);
                    echo '<td>' . $c_row . '</td>';
                    next($row);
                    $y = $y + 1;
                }
                echo '</tr>';
                $i = $i + 1;
            }

        } elseif ($format == "csv") {
            header('Content-Type: text/html; charset=utf-8');
            header('P3P: CP="NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM"');
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('Cache-Control: post-check=0, pre-check=0', FALSE);
            header('Pragma: no-cache');
            header('Content-transfer-encoding: binary');
            header('Content-Disposition: attachment;');
            header('Content-Type: application/x-unknown');
            $i = 0;
            while ($i < pg_num_fields($result)) {
                if ($i > 0)
                    echo "\t";
                $fieldName = pg_field_name($result, $i);
                echo $fieldName;
                $i = $i + 1;
            }
            echo "\n";
            $i = 0;

            while ($row = pg_fetch_row($result)) {
                $count = count($row);
                $y = 0;
                while ($y < $count) {
                    if ($y > 0)
                        echo "\t";
                    $c_row = current($row);
                    echo $c_row;
                    next($row);
                    $y = $y + 1;
                }
                echo "\n";
                $i = $i + 1;
            }

        }
    pg_free_result($result);
    pg_close($dbconn);
}

function json_query_run($format)
{
    $query = isset($_POST['query']) ? $_POST['query'] : '';
    if ($query !== '') {
        $json_params = json_decode($query);
        //var_dump($json_params);

        $datasets = get_datasets(true);


        $cur_dataset = new StdClass();
        foreach ($datasets as $dataset) {
            if ($dataset->ID_Report == $json_params->DataSet)
                $cur_dataset = $dataset;
        }
        //var_dump($datasets);
        //echo get_connection_string($cur_dataset->DataStore);
        //var_dump($json_params->args);
        //echo $cur_dataset->SQL_Query;
        query_run(get_connection_string($cur_dataset->DataStore), $json_params->args, $cur_dataset->SQL_Query, $format);

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
        json_query_run("json");
        break;
    case "run_query_xls":
        json_query_run("xls");
        break;
    case "run_query_csv":
        json_query_run("csv");
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