<?php
/*/*
Запросы:
POST
Получение списка датасетов без sql запросов
action=get_datasets
Выполнение основного запроса:
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
Ответ:
{
	"status" : "0",
	body : {
		"fields" : ["timestamp"],
		"rows" : [["2015-11-23 07:35:47"]]
	}
}
Статусы
"0" - Данные
"1" - Ожидание
"2" - Нет данных
"3" - Ошибка запроса

Выполнения запроса для заполнения select-а
action=get_select_row
query=
{
	"DataSet" : "1",
	"ID_Params" : "4"
}


Подучить готовый отчет по id
action=get_result
id=D26D0990-89A1-65C4-2BF3-1A96CF68DB4E
Удалить отчет
action=rm_result
id=D26D0990-89A1-65C4-2BF3-1A96CF68DB4E
*/

require "pgreport.php";

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
    case "get_result":
        get_result_by_id();
        break;
    case "rm_result":
        rm_result_by_id();
        break;
    default:
        echo "Bad parameters!";
}
//debug
//get_connection_string("1");
//get_datasets();
//json_params_get("test.json");
//query_run($connection_string, $args_array, $query_string);*/
