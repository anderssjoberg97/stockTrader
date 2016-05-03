<?php 
require_once("mysqliConnect.php");

$sq=mysqli_query($con, "select id, date, closing, symbol from quotes where symbol='HMB' && date between '2010-01-01' and '2016-04-01' order by date ASC");
echo '{"HMB": [';

$curRow=1;
while($sd=mysqli_fetch_array($sq)){
	echo '{"date":"'.$sd["date"].'","closing":'.$sd["closing"].'}';
	if(mysqli_num_rows($sq)!=$curRow)
		echo ",";
	$curRow++;
}
echo "]}";
?>