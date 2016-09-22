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

    if($db->changes() == 0){
        return $db->changes();
        $db->close();
    }
    else{
        return $result;
        $db->close();
    }

}

function rm_result_by_id()
{
    $id = isset($_POST['id']) ? $_POST['id'] : '';

    $query = "DELETE FROM query_result WHERE id = '" . "$id" . "';";

    $result = sqlite_query_change($query);

    if ($result) {
        echo "result deleted successfully";
    } else {
        echo "result deleted fail";
    }

}

function get_result_by_id()
{
    $id = isset($_POST['id']) ? $_POST['id'] : '';

    $query = "SELECT * FROM query_result WHERE id = '" . "$id" . "' limit 1;";
    $result = sqlite_query_action($query);
    $res = '';

    if ($result) {
        while ($row = $result->fetchArray()) {
            $res = $row['result'];
        }
        return $res;
    } else {
        echo "result not found";
    }
}

function set_new_result($guid, $result)
{
    if ($result == '' && $guid != '') {
        $query = "INSERT INTO query_result (id,result) VALUES ('" . $guid . "','Query in process');";
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

function query_prepare($query, $args_array){

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

function query_run($connection_string, $args_array, $query_string, $format)
{
    global $tlc, $url, $slow;
    $dbconn = pg_pconnect($connection_string);

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
            $queries_from_cookie = isset($_COOKIE['QUERIES']) ? $_COOKIE['QUERIES'] : '';
            if ($queries_from_cookie != '') {
                $cookie_array = json_decode($queries_from_cookie);
                array_push($cookie_array, $guid);
            } else {
                $cookie_array[0] = $guid;
            }
            setcookie("QUERIES", json_encode($cookie_array), time() + $tlc, '/', '.' . $url);
            echo '{"fields":["Yor","query"],"rows":[["is very","long"]]}';
            set_new_result($guid, '');

            $arr_send = json_encode($args_array);
            exec("php ./large_query.php '" . "$connection_string" . "' '" . "$arr_send" . "' '" . "$query_string" . "' '" . "$format" . "' '" . "$guid" . "' 2>&1", $a);
            foreach ($a as $b) {
                echo $b . "#\n";
            }
            pg_cancel_query($dbconn);
            pg_flush($dbconn);
            pg_close($dbconn);
            exit;
        }
        $counter = $counter + 1;
    }
    query_fast($dbconn, $format);

}

function query_fast($dbconn, $format){

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
    pg_flush($dbconn);
    pg_free_result($result);
    pg_close($dbconn);
}

function query_slow($dbconn, $format, $guid)
{
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

        $final = json_encode($json_result, JSON_UNESCAPED_UNICODE);
        set_new_result($guid, $final);
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
        //echo $cur_dataset->SQL_Query."!!!!";
        query_run(get_connection_string($cur_dataset->DataStore), $json_params->args, $cur_dataset->SQL_Query, $format);

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