#!/bin/php
<?php
require "pgreport.php";
/*exec("echo '#####' `date` '#####'  >> ./123.test");
foreach ($argv as $arr) {
    exec("echo " . $arr . " >> ./123.test");
11231231
}*/

$connection_string = $argv[1];
$args_array = json_decode($argv[2]);
$query_string = $argv[3];
$format = $argv[4];
$guid = $argv[5];


function query_background($connection_string, $args_array, $query_string, $format, $guid)
{
    $dbconn = pg_connect($connection_string);

    if (!$dbconn) {
        echo "An error occured connect to database.\n";
        exit;
    }
    $query = query_prepare(base64_decode("$query_string"), $args_array);
    pg_trace('/tmp/trace.log', 'w', $dbconn);


    if (!pg_connection_busy($dbconn)) {
        pg_send_prepare($dbconn,"main",$query);
        while (pg_get_result($dbconn));

        pg_send_execute($dbconn,"main",[]);
    }

    query_slow($dbconn,$guid);
}

query_background($connection_string, $args_array, $query_string, $format, $guid);

?>