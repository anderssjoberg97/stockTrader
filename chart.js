var quotes; //Object for quote data
var canvas; //Canvas DOM object
var ctx;//Canvas context
var chartW=window.innerWidth; //Canvas width
var chartH=window.innerHeight; //Canvas height
var largestClosing, smallestClosing; //Variables for adjusting to the right viewscope
var startDate, endDate, timeSpan; //Timespan for chart


window.onload=init();

//Onload function
function init(){
	loadJSON(function(response){
		quotes=JSON.parse(response);
		chart();
	})
}

//Function for loading JSON object
function loadJSON(callback){
	var http=new XMLHttpRequest();
	http.overrideMimeType("application/json");
	http.open("GET", "quotes.php", true);
	http.onreadystatechange=function(){
		if(http.readyState==4 && http.status=="200")
			callback(http.responseText);
	}
	http.send(null);
}

//Main chart-rendering function
function chart(){
	//Set up canvas
	canvas=document.getElementById('chart');
	ctx=canvas.getContext("2d");
	canvas.width=chartW;
	canvas.height=chartH;

	//Get the timespan in days
	startDate=new Date(quotes.HMB[0].date);
	endDate=new Date(quotes.HMB[Object.keys(quotes.HMB).length-1].date);
	timeSpan=Math.ceil((endDate.getTime()-startDate.getTime())/(1000*3600*24));

	//Find largest and smallest value of closing
	for(var i=0;i<Object.keys(quotes.HMB).length;i++){
		if(largestClosing==null || largestClosing<quotes.HMB[i].closing)
			largestClosing=quotes.HMB[i].closing;
		if(smallestClosing==null || smallestClosing>quotes.HMB[i].closing)
			smallestClosing=quotes.HMB[i].closing;
	}



	//Draw horizontal rulers
	var rulerY=chartH-chartH*(((Math.ceil(smallestClosing/10)*10)-smallestClosing)/(largestClosing-smallestClosing));
	while(rulerY>0){
		ctx.beginPath();
		ctx.moveTo(0,rulerY);
		ctx.lineTo(chartW,rulerY);
		//On every 50th mark draw thicker ruler
		if(Math.floor(((1-(rulerY/chartH))*(largestClosing-smallestClosing))+smallestClosing)%50==0)
			ctx.strokeStyle="#ccc";
		else
			ctx.strokeStyle="#eee";
		ctx.stroke();
		rulerY-=(10*chartH)/(largestClosing-smallestClosing);
	}


	//Draw lines for closing prices
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes.HMB).length;i++){
		if(i==0)
			ctx.moveTo(0, chartH-(chartH*((quotes.HMB[i].closing-smallestClosing)/(largestClosing-smallestClosing))));
		else{
			var curDate=new Date(quotes.HMB[i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH-(chartH*((quotes.HMB[i].closing-smallestClosing)/(largestClosing-smallestClosing))));
		}
			
	}
	ctx.strokeStyle="#000";
	ctx.stroke();

	//Draw averages
	drawClosing();
	drawClosing("#00f", 5);
	drawClosing("#f00", 14);
	
}

function drawClosing(color="#000", days=1){
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes.HMB).length;i++){
		if(i==0)
			ctx.moveTo(0, chartH-(chartH*((quotes.HMB[i].closing-smallestClosing)/(largestClosing-smallestClosing))));
		else{
			var avg=0;
			var numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg+=quotes.HMB[i-j].closing;
				numValues++;
			}
			avg=avg/numValues;

			var curDate=new Date(quotes.HMB[i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH-(chartH*((avg-smallestClosing)/(largestClosing-smallestClosing))));
		}
			
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}