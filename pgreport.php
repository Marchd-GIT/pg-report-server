<?php
require "settings/settings.php";

class MyDB extends SQLite3
{
    function __construct()
    {
        $this->open('/tmp/dbmain');
    }
}

function sqlite_query_action($query)
{

    $db = new MyDB();
    $sql = <<<EOF
    $query;
EOF;

    if (!$result = $db->query($sql)) {
        $db->exec('CREATE TABLE query_result (id,result)');
        $result = $db->query($sql);
    }

    return $result;

    $db->close();
    //$db->exec("DROP TABLE foo");
    // $db->exec('CREATE TABLE query_result (id,result)');
    //$db->exec("INSERT INTO query_result (id,result) VALUES ('2873618273618726318726318337','test etete')");
    //$result = $db->query('SELECT * FROM query_result');
    //$db->query("delete from query_result where  id like '28736%'");
    //while($row = $result->fetchArray() ){
    //     echo $row['id']."\n";
    //     echo $row['result']."\n";
    // }
    // exit;
}

function sqlite_query_change($query)
{

    $db = new MyDB();
    $sql = <<<EOF
    $query;
EOF;

    if (!$result = $db->query($sql)) {
        $db->exec('CREATE TABLE query_result (id,result)');
        $result = $db->query($sql);
    }

    if ($db->changes() == 0) {
        return $db->changes();
    } else {
        return $result;
    }

}

function rm_result_by_id()
{
    $id = isset($_POST['id']) ? $_POST['id'] : '';

    $query = "DELETE FROM query_result WHERE id = '" . "$id" . "';";

    $result = sqlite_query_change($query);

    if ($result) {
        echo "{\"status\" : \"0\"}";
    } else {
        echo "{\"status\" : \"2\"}";
    }

    rm_cookie($id);

}

function get_result_by_id()
{
    $format = isset($_POST['format']) ? $_POST['format'] : '';
    $id = isset($_POST['id']) ? $_POST['id'] : '';

    $query = "SELECT * FROM query_result WHERE id = '" . "$id" . "' limit 1;";
    $result = sqlite_query_action($query);
    $res = '';

    if ($result) {
        while ($row = $result->fetchArray()) {
            $res = $row['result'];
        }
        if ($res != '') {
            switch ($format) {
                case "json":
                    header('Content-Type: application/json');
                    echo $res;
                    break;
                case "xls":
                    json_to_xls($res);
                    break;
                case "csv":
                    json_to_csv($res);
                    break;
                default:
                    echo "{\"status\" : \"2\"}";
                    break;
            }
        } else {
            echo "{\"status\" : \"2\"}";
        }
    } else {
        echo "{\"status\" : \"3\"}";
    }
}

function set_new_result($guid, $result)
{
    if ($result == '' && $guid != '') {
        $query = "INSERT INTO query_result (id,result) VALUES ('" . $guid . "','{\"status\" : \"1\"}');";
        sqlite_query_change($query);
    } elseif ($result != '' && $guid != '') {
        $query = "UPDATE query_result set result='" . $result . "' where id= '" . $guid . "'";
        sqlite_query_change($query);
    }

}

function get_select_row()
{
    $query = isset($_POST['query']) ? $_POST['query'] : '';
    $sql_query = "";
    if ($query !== '') {
        $json_params = json_decode($query);
        $datasets = get_datasets(true);
        //var_dump($datasets);
        foreach ($datasets as $key=>$value){
            if($value->ID_Report == $json_params->DataSet){
                $datasetid=$key;
            }
        }
        foreach ($datasets[$datasetid]->ParametersList as $val) {
            if ($val->id == $json_params->ID_Params)
                $sql_query = $val->query;
        }
        $empty = [];
        if ($sql_query != ''){
            query_run(get_connection_string($datasets[$json_params->DataSet]->DataStore), $empty, $sql_query, "json", '');
        }
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

function query_prepare($query, $args_array)
{

    $counter = 0;
    if ($args_array != []) {
        while (count($args_array) > $counter) {
            $prepquery = preg_replace('/\$' . ($counter + 1) . '/', "'" . $args_array[$counter] . "'", $query);
            $query = $prepquery;
            $counter = $counter + 1;
        }
    }
    return $query;
}

function query_run($connection_string, $args_array, $query_string, $format, $name)
{
    global $slow;
    $dbconn = pg_connect($connection_string);

    if (!$dbconn) {
        echo "An error occured connect to database.\n";
        exit;
    }

    $query = query_prepare(base64_decode("$query_string"), $args_array);

    if (!pg_connection_busy($dbconn)) {
        pg_send_query($dbconn, $query);
    }

    $counter = 0;
    while (pg_connection_busy($dbconn)) {
        sleep(1);
        if ($counter == $slow) {
            $guid = getGUID();
            return_cookie($guid, $name, $args_array);
            header('Content-Type: application/json');
            echo '{"status" : "1"}';
            set_new_result($guid, '');
            $arr_send = json_encode($args_array);
            exec("php ./large_query.php '" . "$connection_string" . "' '" . "$arr_send" . "' '" . "$query_string" . "' '" . "$format" . "' '" . "$guid" . "' >/dev/null 2>/dev/null &");
            /*            foreach ($a as $b) {
                            echo $b . "#\n";
                        }*/
            pg_cancel_query($dbconn);
            pg_flush($dbconn);
            exit;
        }
        $counter++;
    }
    query_fast($dbconn, $format);

}

function return_cookie($guid, $name, $args_array)
{
    global $tlc, $url;
    $report = [
        "id" => $guid,
        "name" => $name,
        "creation_date" => date("Y-m-d H:i:s"),
        "arguments" => $args_array
    ];

    $queries_from_cookie = isset($_COOKIE['QUERIES']) ? $_COOKIE['QUERIES'] : '';
    if ($queries_from_cookie != '') {
        $cookie_array = json_decode($queries_from_cookie);
        array_push($cookie_array, $report);
    } else {
        $cookie_array[0] = $report;
    }
    setcookie("QUERIES", json_encode($cookie_array), time() + $tlc, '/', '.' . $url);
}

function rm_cookie($guid)
{
    global $tlc, $url;
    $i = 0;
    $queries_from_cookie = isset($_COOKIE['QUERIES']) ? $_COOKIE['QUERIES'] : '';
    $cookie_array = json_decode($queries_from_cookie);
    foreach ($cookie_array as $item) {
        if ($item->id == $guid) {
            unset($cookie_array[$i]);
        }
        $i++;
    }
    sort($cookie_array);


    setcookie("QUERIES", json_encode($cookie_array), time() + $tlc, '/', '.' . $url);
}

function result_to_json($result)
{
    $json_result = (object)[
        "status" => '',
        "body" => (object)[
            "fields" => [],
            "rows" => []
        ]
    ];
    $i = 0;
    while ($i < pg_num_fields($result)) {
        $fieldName = pg_field_name($result, $i);
        array_push($json_result->body->fields, $fieldName);
        $i = $i + 1;
    }
    $k = 0;
    while ($row = pg_fetch_row($result)) {
        array_push($json_result->body->rows, $row);
        $k = $k + 1;
    }
    if ($k > 0) {
        $json_result->status = "0";
    } else {
        $json_result->status = "2";
    }
    return $json_result;
}

function json_to_xls($result_json)
{

    header('Content-Type: text/html; charset=utf-8');
    header('P3P: CP="NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM"');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Cache-Control: post-check=0, pre-check=0', FALSE);
    header('Pragma: no-cache');
    header('Content-transfer-encoding: binary');
    header('Content-Disposition: attachment;');
    header('Content-Type: application/x-unknown');
    //header('Content-Disposition: attachment; filename='..'xls');

    $result = json_decode($result_json);
    echo '<html><body><table height=auto width=auto border=\'1\' rules=\'rows\' ><tr>';

    foreach ($result->body->fields as $fieldName) {
        echo '<th bgcolor=\'#16a085\'>' . $fieldName . '</th>';
    }
    echo "</tr>";
    foreach ($result->body->rows as $row) {
        echo "<tr>";
        foreach ($row as $item) {
            echo "<td>" . $item . "</td>";
        }
        echo "</tr>";

    }
}

function json_to_csv($result_json)
{

    header('Content-Type: text/html; charset=utf-8');
    header('P3P: CP="NOI ADM DEV PSAi COM NAV OUR OTRo STP IND DEM"');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Cache-Control: post-check=0, pre-check=0', FALSE);
    header('Pragma: no-cache');
    header('Content-transfer-encoding: binary');
    header('Content-Disposition: attachment;');
    header('Content-Type: application/x-unknown');

    $result = json_decode($result_json);

    foreach ($result->body->fields as $fieldName) {
        echo $fieldName . "\t";
    }
    echo "\n";
    foreach ($result->body->rows as $row) {
        foreach ($row as $item) {
            echo $item . "\t";
        }
        echo "\n";
    }
}

function query_fast($dbconn, $format)
{
    $res = (object)[];
    while ($res) {
        $result = $res;
        $res = pg_get_result($dbconn);
    }

    if (!$result) {
        echo "An error occured.\n";
        exit;
    }

    if ($format == "json") {
        header('Content-Type: application/json');
        echo json_encode(result_to_json($result), JSON_UNESCAPED_UNICODE);
    } elseif ($format == "xls") {
        json_to_xls(json_encode(result_to_json($result)));
    } elseif ($format == "csv") {
        json_to_csv(json_encode(result_to_json($result)));
    }

    pg_free_result($result);
    pg_flush($dbconn);
    pg_close($dbconn);
}

function query_slow($dbconn, $guid){

    $res= (object)[];
    while ($res) {
        $result = $res;
        $res = pg_get_result($dbconn);
    }

    if (!$result) {
        echo "An error occured.\n";
        exit;
    }
    $final = json_encode(result_to_json($result));

    set_new_result($guid, $final);
    pg_free_result($result);
}

function json_query_run($format)
{

    $query = isset($_POST['query']) ? $_POST['query'] : '';
    if ($query !== '') {
        $json_params = json_decode($query);
        //var_dump($json_params);

        $datasets = get_datasets(true);


        $cur_dataset = (object)[];
        foreach ($datasets as $dataset) {
            if ($dataset->ID_Report == $json_params->DataSet)
                $cur_dataset = $dataset;
        }
        //var_dump($datasets);
        //echo get_connection_string($cur_dataset->DataStore);
        //var_dump($json_params->args);
        //echo $cur_dataset->SQL_Query."!!!!";
        query_run(get_connection_string($cur_dataset->DataStore), $json_params->args, $cur_dataset->SQL_Query, $format, $cur_dataset->NameReport);

    } else {
        echo "Bad query!";
    }

}

function getGUID()
{
    if (function_exists('com_create_guid')) {
        return com_create_guid();
    } else {
        mt_srand((double)microtime() * 10000);//optional for php 4.2.0 and up.
        $charid = strtoupper(md5(uniqid(rand(), true)));
        $hyphen = chr(45);// "-"
        $uuid =
            //chr(123)// "{"
            substr($charid, 0, 8) . $hyphen
            . substr($charid, 8, 4) . $hyphen
            . substr($charid, 12, 4) . $hyphen
            . substr($charid, 16, 4) . $hyphen
            . substr($charid, 20, 12);
        //.chr(125);// "}"
        return $uuid;
    }
}

?>