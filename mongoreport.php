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
                $prepquery = preg_replace('/\$' . ($counter + 1) . '/', "'" . $args_array[$counter] . "'", $query);
                $query = $prepquery;
            }
            $counter = $counter + 1;
        }
    }
    return $query;
}


function mongo_query_background($connection_string, $query_string, $args_array, $guid)
{
    //$connection_string = '10.20.0.16:27017/test -u"mg" -p"serik-pk" --authenticationDatabase "admin"';
    //$query_string = 'ICAgICB2YXIgbWFwID0gZnVuY3Rpb24gKCkgew0KICAgICAJaWYgKHRoaXMuZW50cnkpIHsNCiAgICAgCQl2YXIgU3lzOw0KICAgICAJCXZhciBPcmc7DQogICAgIAkJdmFyIERScyA9IDA7DQogICAgIAkJdmFyIE9icyA9IDA7DQogICAgIAkJdGhpcy5lbnRyeS5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7DQogICAgIAkJCWlmIChlLnJlc291cmNlLnJlc291cmNlVHlwZSA9PSAiT3JkZXJSZXNwb25zZSIpIHsNCiAgICAgCQkJCU9yZyA9IGUucmVzb3VyY2Uud2hvLnJlZmVyZW5jZS5yZXBsYWNlKG5ldyBSZWdFeHAoJ09yZ2FuaXphdGlvbicsICdnaScpLCAnJykucmVwbGFjZShuZXcgUmVnRXhwKCcvJywgJ2cnKSwgJycpOw0KICAgICAJCQkJU3lzID0gZS5yZXNvdXJjZS5pZGVudGlmaWVyWzBdLnN5c3RlbS5yZXBsYWNlKCd1cm46b2lkOicsICcnKTsNCiAgICAgCQkJfSBlbHNlIGlmIChlLnJlc291cmNlLnJlc291cmNlVHlwZSA9PSAiRGlhZ25vc3RpY1JlcG9ydCIpIHsNCiAgICAgCQkJCURScyArPSAxOw0KICAgICAJCQl9IGVsc2UgaWYgKGUucmVzb3VyY2UucmVzb3VyY2VUeXBlID09ICJPYnNlcnZhdGlvbiIpDQogICAgIAkJCQlPYnMgKz0gMTsNCiAgICAgCQl9KQ0KICAgICAJfQ0KICAgICAJZW1pdCh7DQogICAgIAkJIk9yZyIgOiBPcmcsDQogICAgIAkJIlN5cyIgOiBTeXMNCiAgICAgCX0sIHsNCiAgICAgCQkiT1JzIiA6IDEsDQogICAgIAkJIkRScyIgOiBEUnMsDQogICAgIAkJIk9icyIgOiBPYnMNCiAgICAgCX0pDQogICAgIH0NCiAgICAgdmFyIHJlZHVjZSA9IGZ1bmN0aW9uIChrZXksIHZhbCkgew0KICAgICAJdmFyIE9ScyA9IDA7DQogICAgIAl2YXIgRFJzID0gMDsNCiAgICAgCXZhciBPYnMgPSAwOw0KICAgICAJZm9yICh2YXIgaSBpbiB2YWwpIHsNCiAgICAgCQlPUnMgKz0gdmFsW2ldLk9SczsNCiAgICAgCQlEUnMgKz0gdmFsW2ldLkRSczsNCiAgICAgCQlPYnMgKz0gdmFsW2ldLk9iczsNCiAgICAgCX0NCiAgICAgCXJldHVybiAoew0KICAgICAJCU9ScyA6IE9ScywNCiAgICAgCQlEUnMgOiBEUnMsDQogICAgIAkJT2JzIDogT2JzDQogICAgIAl9KTsNCiAgICAgfQ0KICAgICBkYi5UcmFuc2FjdGlvbkJ1bmRsZTAubWFwUmVkdWNlKG1hcCwgcmVkdWNlLCB7DQogICAgIAlvdXQgOiAidG1wQWdnIg0KICAgICB9KQ0KICAgICBwcmludGpzb24oZGIudG1wQWdnLmFnZ3JlZ2F0ZSh7DQogICAgIAkJJGdyb3VwIDogew0KICAgICAJCQknX2lkJyA6ICIkX2lkIiwNCiAgICAgCQkJY250T3JzIDogew0KICAgICAJCQkJJHN1bSA6ICIkdmFsdWUuT1JzIg0KICAgICAJCQl9LA0KICAgICAJCQljbnREUnMgOiB7DQogICAgIAkJCQkkc3VtIDogIiR2YWx1ZS5EUnMiDQogICAgIAkJCX0sDQogICAgIAkJCWNudE9icyA6IHsNCiAgICAgCQkJCSRzdW0gOiAiJHZhbHVlLk9icyINCiAgICAgCQkJfQ0KICAgICAJCX0NCiAgICAgCX0sIHsNCiAgICAgCQkkbG9va3VwIDogew0KICAgICAJCQlmcm9tIDogIkRpY3RNTyIsDQogICAgIAkJCWxvY2FsRmllbGQgOiAiX2lkLk9yZyIsDQogICAgIAkJCWZvcmVpZ25GaWVsZCA6ICJtb2d1aWQiLA0KICAgICAJCQlhcyA6ICJkaWN0X21vIg0KICAgICAJCX0NCiAgICAgCX0sIHsNCiAgICAgCQkkbG9va3VwIDogew0KICAgICAJCQlmcm9tIDogIkRpY3RNTyIsDQogICAgIAkJCWxvY2FsRmllbGQgOiAiX2lkLlN5cyIsDQogICAgIAkJCWZvcmVpZ25GaWVsZCA6ICJvaWQiLA0KICAgICAJCQlhcyA6ICJkaWN0X3N5cyINCiAgICAgCQl9DQogICAgIAl9LCB7DQogICAgIAkJJHByb2plY3QgOiB7DQogICAgIAkJCV9pZCA6IDAsDQogICAgIAkJCSJSZWdpb25fY29kZSIgOiB7DQogICAgIAkJCQkkYXJyYXlFbGVtQXQgOiBbIiRkaWN0X21vLnJjb2QiLCAwXQ0KICAgICAJCQl9LA0KICAgICAJCQkiT3JnYW5pemF0aW9uX2lkIiA6ICIkX2lkLk9yZyIsDQogICAgIAkJCSJOYW1lIiA6IHsNCiAgICAgCQkJCSRhcnJheUVsZW1BdCA6IFsiJGRpY3RfbW8ubmFtZSIsIDBdDQogICAgIAkJCX0sDQogICAgIAkJCSJNYWluIiA6IHsNCiAgICAgCQkJCSRhcnJheUVsZW1BdCA6IFsiJGRpY3RfbW8ubWFpbiIsIDBdDQogICAgIAkJCX0sDQogICAgIAkJCSJTeXN0ZW1faWQiIDogIiRfaWQuU3lzIiwNCiAgICAgCQkJIlN5c3RlbV9uYW1lIiA6IHsNCiAgICAgCQkJCSRhcnJheUVsZW1BdCA6IFsiJGRpY3Rfc3lzLnN5c25hbWUiLCAwXQ0KICAgICAJCQl9LA0KICAgICAJCQkiQnVuZGxlcyIgOiAiJGNudE9ycyIsDQogICAgIAkJCSJPYnNlcnZhdGlvbnMiIDogIiRjbnRPYnMiLA0KICAgICAJCX0NCg0KICAgICAJfSwgew0KICAgICAJCSRzb3J0IDogew0KICAgICAJCQkiUmVnaW9uX2NvZGUiIDogMQ0KICAgICAJCX0NCiAgICAgCX0pLnRvQXJyYXkoKSkNCiAgICAgZGIudG1wQWdnLmRyb3AoKQ==';
    //$query_string = 'MDlzZGZzZGYnc2RmMHNpZGZkc2RkZA==';
    $query = query_prepare_mongo(base64_decode("$query_string"), $args_array);
    $pre_query_string = str_replace('$', '\$', $query);
    global $query_id;
    $query_id = $guid;
    set_new_result($guid, '', getmypid());
    $r = exec("cat <<EOF > /tmp/" . $query_id . ".js &&  mongo --quiet " . $connection_string . " /tmp/" . $query_id . ".js 2>&1
" . $pre_query_string . "
EOF", $a);


//    $a = ['[        {
//                "Region_code" : "78",
//                "Organization_id" : "3b4b37cd-ef0f-4017-9eb4-2fe49142f682",
//                "Name" : "Санкт-Петербургское государственное бюджетное учреждение здравоохранения \"Городская Мариинская больница\"",
//                "Main" : "",
//                "System_name" : "РМИС РЕГИЗ Санкт-Петербург",
//                "Observations" : 252
//        },
//        {
//                "Region_code" : "78",
//                "Organization_id" : "460dd99b-7e84-4ad9-8057-3a1bb5df055e",
//                "Name" : "Клинико-диагностическая лаборатория",
//                "Main" : "Санкт-Петербургское государственное бюджетное учреждение здравоохранения \"Городская больница №33\"",
//                "System_id" : "1.2.643.2.69.1.2.2",
//                "System_name" : "РМИС РЕГИЗ Санкт-Петербург",
//                "Bundles" : 9,
//                "Observations" : 72
//        },
//        {
//                "Region_code" : "78",
//                "Organization_id" : "3d4d250b-573c-d536-1380-9aa4c0ff40cd",
//                "Name" : "Межрайонная Централизованная Клинико-диагностическая лаборатория",
//                "Main" : "Санкт-Петербургское государственное бюджетное учреждение здравоохранения \"Николаевская больница\"",
//                "System_id" : "1.2.643.2.69.1.2.2",
//                "System_name" : "РМИС РЕГИЗ Санкт-Петербург",
//                "Observations" : 40
//        }]'];

    $result_json = (object)[
        "status" => '',
        "body" => (object)[
            "fields" => [],
            "rows" => []
        ]
    ];


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
            if ($key > 0) {
                $result_json->status = "0";
            }
        }
        $final = json_encode($result_json, JSON_UNESCAPED_UNICODE);
    } else {
        $result_json->status = "2";
        $result_json->exception = $a;
        $final = json_encode($result_json, JSON_UNESCAPED_UNICODE);
    }
    //exec('rm /tmp/' . $query_id . '.js');

//    function sig_handler($signo)
//    {
//        global $query_id;
//        if($signo == SIGUSR1)
//            exec('rm /tmp/' . $query_id . '.js');
//            exit;
//    }
//    pcntl_signal(SIGUSR1, "sig_handler");

    set_new_result($guid, $final, ' ');
}

mongo_query_background($connection_string, $query_string, $args_array, $guid);

