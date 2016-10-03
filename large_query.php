#!/bin/php
<?php
require "pgreport.php";
declare(ticks = 1);

$connection_string = $argv[1];
$args_array = json_decode($argv[2]);
$query_string = $argv[3];
$format = $argv[4];
$guid = $argv[5];
$dbconn = '';

function query_background($connection_string, $args_array, $query_string, $format, $guid)
{
    global $dbconn;
    set_new_result($guid, '', getmypid());
    $dbconn = pg_connect($connection_string);
    if (!$dbconn) {
        echo "An error occured connect to database.\n";
        exit;
    }
    $query = query_prepare(base64_decode("$query_string"), $args_array);
    //pg_trace('/tmp/trace.log', 'w', $dbconn);


    if (!pg_connection_busy($dbconn)) {
        pg_send_query($dbconn,$query);
    }

    function sig_handler($signo)
    {
        if($signo == SIGUSR1)
            global $dbconn;
            pg_cancel_query($dbconn);
    }
    pcntl_signal(SIGUSR1, "sig_handler");
    $i=0;
    while(pg_connection_busy($dbconn)){
        $i++;
        exec("echo ".$i." >> /tmp/testlog");
        sleep(1);
    }

    query_slow($dbconn,$guid);
}

query_background($connection_string, $args_array, $query_string, $format, $guid);

?>