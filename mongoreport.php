<?php
require "pgreport.php";
declare(ticks = 1);

$connection_string = $argv[1];
$args_array = json_decode($argv[2]);
$query_string = $argv[3];
$guid = $argv[4];


function is_Date($str)
{

    $str = str_replace('/', '-', $str);
    $stamp = strtotime($str);
    if (is_numeric($stamp)) {

        $month = date('m', $stamp);
        $day = date('d', $stamp);
        $year = date('Y', $stamp);

        return checkdate($month, $day, $year);

    }
    return false;
}


function query_prepare_mongo($query, $args_array)
{

    $counter = 0;
    if ($args_array != []) {
        while (count($args_array) > $counter) {
            if (is_Date($args_array[$counter])) {
                $date = new DateTime($args_array[$counter]);
                $date -> setTimezone("UTC");
                $prepquery = preg_replace('/\$' . ($counter + 1) . '/',  $date -> getTimestamp() .'000' , $query);
                $query = $prepquery;

            } else {
                $prepquery = preg_replace('/\$' . ($counter + 1) . '/',$args_array[$counter], $query);
                $query = $prepquery;
            }
            $counter = $counter + 1;
        }
    }
    return $query;
}


function mongo_query_background($connection_string, $query_string, $args_array, $guid)
{
    $query = query_prepare_mongo(base64_decode("$query_string"), $args_array);
    $pre_query_string = str_replace('$', '\$', $query);
    global $query_id,$debug;
    $query_id = $guid;
    set_new_result($guid, '', getmypid());
    $r = exec("cat <<EOF > ./" . $query_id . ".js &&  mongo --quiet " . $connection_string . " ./" . $query_id . ".js 2>&1
" . $pre_query_string . "
EOF", $a);

    $result_json = (object)[
        "status" => '',
        "debug" => '',
        "body" => (object)[
            "fields" => [],
            "rows" => []
        ]
    ];
    if(@$debug > 1)
    {
        $result_json->debug = base64_encode($pre_query_string);
    }

    if (@ $json_obj = json_decode(implode($a))) {
        foreach ($json_obj as $key => $value) {
            if ($key > 0 && count((array)$json_obj[$key]) > count((array)$json_obj[$key - 1])) {
                $result_json->body->fields = array();
                foreach ($value as $key1 => $value1) {
                    array_push($result_json->body->fields, $key1);
                }
            }
            if ($key == 0) {
                foreach ($value as $key1 => $value1) {
                    array_push($result_json->body->fields, $key1);
                }
            }
            $i = 0;
            foreach ($value as $key1 => $value1) {
                $result_json->body->rows[$key][$i] = $value1;
                $i++;
            }
            if ($key >= 0) {
                $result_json->status = "0";
            }
        }
        $final = json_encode($result_json, JSON_UNESCAPED_UNICODE);
    } else {
        $result_json->status = "2";
        $result_json->exception = $a;
        $final = json_encode($result_json, JSON_UNESCAPED_UNICODE);
    }

    set_new_result($guid, $final, ' ');
    exec("rm ./" . $query_id . ".js");
}

mongo_query_background($connection_string, $query_string, $args_array, $guid);

