var quotes; //Object for quote data
var canvas; //Canvas DOM object
var ctx;//Canvas context
var chartW=window.innerWidth; //Canvas width
var chartH=window.innerHeight; //Canvas height
var largestClosing, smallestClosing; //Variables for adjusting to the right viewscope
var startDate, endDate, timeSpan; //Timespan for chart
var startingFunds=100000, funds=startingFunds, stocks=0; //Inital variables for simulation
var trades=0;
var symbol="HMB";

window.onload=init();

//Onload function
function init(){
	loadJSON(function(response){
		quotes=JSON.parse(response);
		chart();
		simulate();
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
	startDate=new Date(quotes[symbol][0].date);
	endDate=new Date(quotes[symbol][Object.keys(quotes[symbol]).length-1].date);
	timeSpan=Math.ceil((endDate.getTime()-startDate.getTime())/(1000*3600*24));

	//Find largest and smallest value of closing
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(largestClosing==null || largestClosing<quotes[symbol][i].closing)
			largestClosing=quotes[symbol][i].closing;
		if(smallestClosing==null || smallestClosing>quotes[symbol][i].closing)
			smallestClosing=quotes[symbol][i].closing;
	}

	
	//Draw Buy/Sell-indicator
	drawBuySellIndicator();

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


	//Draw averages
	drawClosing();
	drawClosing("#00f", 5);
	//drawClosing("#f00", 14);
	
}

function drawClosing(color="#000", days=1){
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(i==0)
			ctx.moveTo(0, chartH-(chartH*((quotes[symbol][i].closing-smallestClosing)/(largestClosing-smallestClosing))));
		else{
			var avg=0;
			var numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg+=quotes[symbol][i-j].closing;
				numValues++;
			}
			avg=avg/numValues;

			var curDate=new Date(quotes[symbol][i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH-(chartH*((avg-smallestClosing)/(largestClosing-smallestClosing))));
		}
			
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}

function drawBuySellIndicator(days=28){
	//Scale variable for buy/sell-indicator
	var biggestIncrease=0;
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){
			var avg1=0;
			var numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg1+=quotes[symbol][i-j].closing;
				numValues++;
			}
			avg1=avg1/numValues;

			var avg2=0;
			numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg2+=quotes[symbol][i-j-1].closing;
				numValues++;
			}
			avg2=avg2/numValues;

			if((avg1-avg2)>biggestIncrease)
				biggestIncrease=avg1-avg2;
		}
	}
	console.log(biggestIncrease);
	//Buy/Sell-indicator
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){

			var avg1=0;
			var numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg1+=quotes[symbol][i-j].closing;
				numValues++;
			}
			avg1=avg1/numValues;
			var avg2=0;
			numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg2+=quotes[symbol][i-j-1].closing;
				numValues++;
			}
			avg2=avg2/numValues;

			//Color-scale
			if(avg1-avg2<0)
				ctx.fillStyle="#f00";
			else if(avg1-avg2>0)
				ctx.fillStyle="#"+(128-Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16)+(128+Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16)+"00";
			else
				ctx.fillStyle="#fff";

			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

			
			ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				0,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH);
		}
	}
}

//Function for simulating a strategy
function simulate(days=28){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){

			var avg1=0;
			var numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg1+=quotes[symbol][i-j].closing;
				numValues++;
			}
			avg1=avg1/numValues;
			var avg2=0;
			numValues=0;
			for(var j=0;i-j>=0 && j<days;j++){
				avg2+=quotes[symbol][i-j-1].closing;
				numValues++;
			}
			avg2=avg2/numValues;

			//Buy if we expect increase in value and funds are available
			if(avg1-avg2>0){
				var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
				if(stocksToBuy>=1){
					stocks+=stocksToBuy;
					funds-=stocksToBuy*quotes[symbol][i].closing;
					trades++;
				}
			}
			//Sell if we expect decrease in value
			else if(avg1-avg2<0){
				if(stocks>0){
					funds+=stocks*quotes[symbol][i].closing;
					stocks=0;
					trades++;
				}
			}
		}
	}
	console.log("Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][i].closing))+" Trades: "+trades);
}