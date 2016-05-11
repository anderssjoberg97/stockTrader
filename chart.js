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
var buyPeriodMargin=0;//The number of days that the stock to wait before investing. Prevents trade overflow

window.onload=init();

//Onload function
function init(){
	loadJSON(function(response){
		quotes=JSON.parse(response);
		chart();
		simulateDerivative(28);
		simulateMovAvg(5, 28);
		simulateDerivativeDiff(5,50);
		simulateReal();
		simulateKeep();
		simulateComb();
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
	//drawBuySellIndicatorDerivative(28);
	//drawBuySellIndicatorDerivativeDiff(5, 28);
	//drawBuySellIndicatorDerivativeDiff2(5, 28);
	//drawBuySellIndicatorReal(3);
	//drawBuySellIndicatorMovAvg(5, 28);
	drawBuySellIndicatorComb(5,28);
	drawPeakFinder(28, 28);

	

	//Draw horizontal rulers
	/*var rulerY=chartH-chartH*(((Math.ceil(smallestClosing/10)*10)-smallestClosing)/(largestClosing-smallestClosing));
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
	}*/


	//Draw averages
	drawClosing();
	/*drawClosing("#00f", 5);
	drawClosing("#09f", 14);
	drawClosing("#0ff", 28);
	drawClosing("#fff", 56);*/
	//drawDerivative("#fff", 5);
	//drawDerivative("#f00", 5);
	//drawDerivative("#0cf", 14);
	//drawDerivative("#00f", 28);
	//drawDerivativeDerivative("#000", 14, 14);
	//drawDerivativeDiff("#0ff", 5, 28);

	//drawClosing("#f00", 14);
	
}

function drawClosing(color="#000", days=1){
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		var curDate=new Date(quotes[symbol][i].date);
		ctx.lineTo(
			chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
			chartH-(chartH*((movAvg(quotes[symbol], i, days)-smallestClosing)/(largestClosing-smallestClosing))));
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}
function drawDerivative(color="#000", days=28, avgDerivative=1){
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(i==0){
			ctx.moveTo(0, chartH/2);
		}else{
			var curDate=new Date(quotes[symbol][i].date);
			/*var sum=0;
			var numValues=0;
			for(var j=0;j<avgDerivative && i-j>=0;j++){
				sum+=movAvgDerivative(quotes[symbol], i-j, days);
				numValues++;
			}*/
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/2)-(movAvgDerivative(quotes[symbol], i, 28))*100);
		}
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}
function drawDerivativeDerivative(color="#000",firstDays=28, secondDays=28){
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(i==0){
			ctx.moveTo(0, chartH/2);
		}else{
			var curDate=new Date(quotes[symbol][i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/2)-(movAvgDerivativeDerivative(quotes[symbol], i, firstDays, secondDays))*500);
		}
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}
function drawDerivativeDiff(color="#000", shortDays=5, longDays=28){
	ctx.beginPath();
	//Scale variable for buy/sell-indicator
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i==0){
			ctx.moveTo(0, chartH/2);
		}else if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/2)-(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays))*100);


		}
	}
	ctx.strokeStyle=color;
	ctx.stroke();
}
function drawBuySellIndicatorComb(shortDays=5, longDays=28){
	var startDerivativeDiff=0, endDerivativeDiff=1;
	var startDerivative=0, endDerivative=1;
	var startDerivativeAvg=0, endDerivativeAvg=1;
	var buySignal=0, sellSignal=1;

	//Loop through time!
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){

			if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>movAvgDerivative(quotes[symbol], i, 28) && 
				startDerivativeDiff<endDerivativeDiff){
				startDerivativeDiff=i;
			}else if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)<movAvgDerivative(quotes[symbol], i, 28) && 
				startDerivativeDiff>endDerivativeDiff){
				endDerivativeDiff=i;
			}
			if(movAvg(quotes[symbol], i, 28)-movAvg(quotes[symbol], i-1, 28)>0 && 
				startDerivative<endDerivative){
				startDerivative=i;
			}else if(movAvg(quotes[symbol], i, 28)-movAvg(quotes[symbol], i-1, 28)<0 && 
				startDerivative>endDerivative){
				endDerivative=i;
			}
			if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 14)>0 &&
				startDerivativeAvg<endDerivativeAvg){
				startDerivativeAvg=i;
			}else if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 14)<0 &&
				startDerivativeAvg>endDerivativeAvg){
				endDerivativeAvg=i;
			}
			if(startDerivative>endDerivative &&
				startDerivativeAvg>endDerivativeAvg && 
				startDerivativeDiff>endDerivativeDiff &&
				buySignal<sellSignal){
				buySignal=i;
			}
			if((startDerivative<endDerivative ||
				startDerivativeAvg<endDerivativeAvg) && 
				buySignal>sellSignal){
				sellSignal=i;
			}
			curDate=new Date(quotes[symbol][buySignal].date);
			nextDate=new Date(quotes[symbol][sellSignal].date);
			if(buySignal<sellSignal){
				ctx.fillStyle="#0f0";
				ctx.fillRect(
					chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
					(chartH*2)/3,
					Math.ceil(chartW*((nextDate.getTime()-curDate.getTime())/(1000*3600*24*timeSpan))),
					(chartH/6));
			}
		}
	}
}
function drawPeakFinder(derivativeDays=28, derivativeAvgDays=5){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>derivativeDays){
			curDate=new Date(quotes[symbol][i].date);
			nextDate=new Date(quotes[symbol][i+1].date);
			if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 5)>0)
				ctx.fillStyle="#0ff";
			else
				ctx.fillStyle="#f00";
			ctx.fillRect(
				Math.ceil(chartW*((curDate.getTime()-startDate.getTime())/(1000*3600*24*timeSpan))),
				(chartH/3)*1,
				Math.ceil(chartW*((nextDate.getTime()-curDate.getTime())/(1000*3600*24*timeSpan))),
				(chartH/6));

		}
	}
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>derivativeDays){
			curDate=new Date(quotes[symbol][i].date);
			nextDate=new Date(quotes[symbol][i+1].date);
			if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 14)>0)
				ctx.fillStyle="#0ff";
			else
				ctx.fillStyle="#f00";
			ctx.fillRect(
				Math.ceil(chartW*((curDate.getTime()-startDate.getTime())/(1000*3600*24*timeSpan))),
				(chartH/6)*5,
				Math.ceil(chartW*((nextDate.getTime()-curDate.getTime())/(1000*3600*24*timeSpan))),
				(chartH/6));

		}
	}
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(i==0){
			ctx.moveTo(0, chartH/2);
		}else{
			var curDate=new Date(quotes[symbol][i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/2)-(movAvgDerivativeAvg(quotes[symbol], i, 28, 14)*100));
		}
	}
	ctx.strokeStyle="#ff0";
	ctx.stroke();
	ctx.beginPath();
	for(var i=0;i<Object.keys(quotes[symbol]).length;i++){
		if(i==0){
			ctx.moveTo(0, chartH/2);
		}else{
			var curDate=new Date(quotes[symbol][i].date);
			ctx.lineTo(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/2)-(movAvgDerivativeAvg(quotes[symbol], i, 28, 5)*100));
		}
	}
	ctx.strokeStyle="#f90";
	ctx.stroke();
}
function drawBuySellIndicatorDerivativeDiff(shortDays=5, longDays=28){
	var biggestDiff=0;
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays && movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>biggestDiff){
			//Derivate difference color coding
			biggestDiff=movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays);
		}
	}
	console.log(biggestDiff);
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);
			
			//Derivate difference color coding
			if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>movAvgDerivative(quotes[symbol], i, 28)){
				ctx.fillStyle="#"+(128-Math.ceil(((movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays))/biggestDiff)*128)).toString(16)+(128+Math.ceil(((movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays))/biggestDiff)*128)).toString(16)+"00";
			}else if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)<movAvgDerivative(quotes[symbol], i, 28)){
				ctx.fillStyle="#f00";
			}else{
				ctx.fillStyle="#fff";
			}
			
			
			ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH/3,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/6));
		}
	}
}
function drawBuySellIndicatorDerivativeDiff2(shortDays=5, longDays=28){
	biggestDiff=0;
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays && movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>biggestDiff){
			//Derivate difference color coding
			biggestDiff=movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays);
		}
	}
	console.log(biggestDiff);
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);
			
			//Derivate difference color coding
			if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>0){
				if(movAvg)
				ctx.fillStyle="#"+(128-Math.ceil(((movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays))/biggestDiff)*128)).toString(16)+(128+Math.ceil(((movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays))/biggestDiff)*128)).toString(16)+"00";
			}else if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)<0){
				ctx.fillStyle="#f00";
			}else{
				ctx.fillStyle="#fff";
			}
			
			
			ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/6)*3,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/6));
		}
	}
}
function drawBuySellIndicatorDerivative(days=28){
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
	//Buy/Sell-indicator
	var buyPeriodStart, buyPeriodEnd;//Variables for tracking buy period length
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

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
			if(avg1-avg2==biggestIncrease){
				if(buyPeriodStart==null || (buyPeriodStart.getTime()<curDate.getTime() && buyPeriodEnd>buyPeriodStart))
					buyPeriodStart=curDate;
				if(buyPeriodStart.getTime()+(1000*3600*24*buyPeriodMargin)<=curDate.getTime())
					ctx.fillStyle="#0f0";
				else
					ctx.fillStyle="#00f";
			}	
			else if(avg1-avg2<0){
				ctx.fillStyle="#f00";
				if(buyPeriodEnd==null || (buyPeriodEnd.getTime()<curDate.getTime() && buyPeriodEnd<buyPeriodStart))
					buyPeriodEnd=curDate;
			}
			else if(avg1-avg2>0){
				if(buyPeriodStart==null || (buyPeriodStart.getTime()<curDate.getTime() && buyPeriodEnd>buyPeriodStart))
					buyPeriodStart=curDate;
				if(buyPeriodStart.getTime()+(1000*3600*24*buyPeriodMargin)<=curDate.getTime())
					ctx.fillStyle="#"+(128-Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16)+(128+Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16)+"00";
				else
					ctx.fillStyle="#"+(128-Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16)+"00"+(128+Math.ceil(((avg1-avg2)/biggestIncrease)*128)).toString(16);
			}
			else{
				ctx.fillStyle="#fff";
			}
			
			
			ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				0,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH/6);
		}
	}
}
function drawBuySellIndicatorDerivativeDerivative(days=28){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);


		}
	}
}
function drawBuySellIndicatorMovAvg(shortDays=5, longDays=14){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

			//Calculate moving averages
			var shortAvg=0, longAvg=0, numValues=0;
			for(var j=0;i-j>=0 && j<shortDays;j++){
				shortAvg+=quotes[symbol][i-j].closing;
				numValues++;
			}
			shortAvg=shortAvg/numValues;
			numValues=0;
			for(var j=0;i-j>=0 && j<longDays;j++){
				longAvg+=quotes[symbol][i-j].closing;
				numValues++;
			}
			longAvg=longAvg/numValues;
			
			//Drawing colors
			if(shortAvg-longAvg>0){
				ctx.fillStyle="#0f0";
			}else if(shortAvg-longAvg<0){
				ctx.fillStyle="#f00";
			}else{
				ctx.fillStyle="#fff";
			}			
			ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH/6,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH/6);
		}
	}
}

function drawBuySellIndicatorReal(days=5){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		//The date of current day and the day after
		var curDate=new Date(quotes[symbol][i].date);
		var nextDate=new Date(quotes[symbol][i+1].date);
		if(quotes[symbol][i+1].closing-movAvg(quotes[symbol], i, 5)>0){
			ctx.fillStyle="#0f0";
		}else if(quotes[symbol][i+1].closing-quotes[symbol][i].closing<0){
			ctx.fillStyle="#f00";
		}else{
			ctx.fillStyle="#fff";
		}
		ctx.fillRect(
				chartW*(Math.ceil((curDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				(chartH/3)*2,
				chartW*(Math.ceil((nextDate.getTime()-startDate.getTime())/(1000*3600*24))/timeSpan),
				chartH/3);
	}
}

function simulateMovAvg(shortDays=5, longDays=14){
	var timeInvested=0;
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

			//Calculate moving averages
			var shortAvg=0, longAvg=0, numValues=0;
			for(var j=0;i-j>=0 && j<shortDays;j++){
				shortAvg+=quotes[symbol][i-j].closing;
				numValues++;
			}
			shortAvg=shortAvg/numValues;
			numValues=0;
			for(var j=0;i-j>=0 && j<longDays;j++){
				longAvg+=quotes[symbol][i-j].closing;
				numValues++;
			}
			longAvg=longAvg/numValues;
			
			//Buy if we expect increase in value and funds are available
			if(shortAvg-longAvg>0){
				var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
				if(stocksToBuy>=1){
					stocks+=stocksToBuy;
					funds-=stocksToBuy*quotes[symbol][i].closing;
					trades++;
				}
			}else if(shortAvg-longAvg<0){
				if(stocks>0){
					funds+=stocks*quotes[symbol][i].closing;
					stocks=0;
					trades++;
				}
			}
			if(stocks>0)
				timeInvested++;

		}
	}
	console.log("Moving average | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][i].closing))+" Trades: "+trades+" Time: "+timeInvested);
	funds=startingFunds;
	stocks=0;
	trades=0;
}

//Function for simulating derivative strategy
function simulateDerivative(days=28){
	var timeInvested=0;
	var buyPeriodStart, buyPeriodEnd;//Variables for tracking buy period length
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>days){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);

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


			if(avg1-avg2<0){
				if(stocks>0){
					funds+=stocks*quotes[symbol][i].closing;
					stocks=0;
					trades++;
				}
				if(buyPeriodEnd==null || (buyPeriodEnd.getTime()<curDate.getTime() && buyPeriodEnd<buyPeriodStart))
					buyPeriodEnd=curDate;
			}
			else if(avg1-avg2>0){
				if(buyPeriodStart==null || (buyPeriodStart.getTime()<curDate.getTime() && buyPeriodEnd>buyPeriodStart))
					buyPeriodStart=curDate;
				if(buyPeriodStart.getTime()+(1000*3600*24*buyPeriodMargin)<=curDate.getTime()){
					var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
					if(stocksToBuy>=1){
						stocks+=stocksToBuy;
						funds-=stocksToBuy*quotes[symbol][i].closing;
						trades++;
					}
				}
				else{
					if(stocks>0){
						funds+=stocks*quotes[symbol][i].closing;
						stocks=0;
						trades++;
					}
				}
			}
			else{
				ctx.fillStyle="#fff";
			}
			if(stocks>0)
				timeInvested++;
		}
	}
	console.log("Derivative | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][i].closing))+" Trades: "+trades+" Time: "+timeInvested);
	funds=startingFunds;
	stocks=0;
	trades=0;
}
function simulateDerivativeDiff(shortDays=5, longDays=28){
	var timeInvested=0;
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){
			//The date of current day and the day after
			var curDate=new Date(quotes[symbol][i].date);
			var nextDate=new Date(quotes[symbol][i+1].date);
			
			//Derivate difference color coding
			if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>movAvgDerivative(quotes[symbol], i, 28)){
				var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
				if(stocksToBuy>=1){
					stocks+=stocksToBuy;
					funds-=stocksToBuy*quotes[symbol][i].closing;
					trades++;
				}
			}else if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)<movAvgDerivative(quotes[symbol], i, 28)){
				if(stocks>0){
					funds+=stocks*quotes[symbol][i].closing;
					stocks=0;
					trades++;
				}
			}
			if(stocks>0)
				timeInvested++;
		}
	}
	console.log("DerivativeDiff | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][i].closing))+" Trades: "+trades+" Time: "+timeInvested);
	funds=startingFunds;
	stocks=0;
	trades=0;
}
function simulateReal(){
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		//The date of current day and the day after
		var curDate=new Date(quotes[symbol][i].date);
		var nextDate=new Date(quotes[symbol][i+1].date);
		if(quotes[symbol][i+1].closing-movAvg(quotes[symbol], i, 5)>0){
			var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
			if(stocksToBuy>=1){
				stocks+=stocksToBuy;
				funds-=stocksToBuy*quotes[symbol][i].closing;
				trades++;
			}
		}else if(quotes[symbol][i+1].closing-quotes[symbol][i].closing<0){
			if(stocks>0){
				funds+=stocks*quotes[symbol][i].closing;
				stocks=0;
				trades++;
			}
		}
	}
	console.log("Real | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][i].closing))+" Trades: "+trades);
	funds=startingFunds;
	stocks=0;
	trades=0;
}
function simulateKeep(){
	var stocksToBuy=Math.floor(funds/quotes[symbol][0].closing);
	if(stocksToBuy>=1){
		stocks+=stocksToBuy;
		funds-=stocksToBuy*quotes[symbol][0].closing;
		trades++;
	}
	
	console.log("Keep | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][Object.keys(quotes[symbol]).length-1].closing))+" Trades: "+trades);
	funds=startingFunds;
	stocks=0;
	trades=0;
}
function simulateComb(shortDays=5, longDays=28){
	var startDerivativeDiff=0, endDerivativeDiff=1;
	var startDerivative=0, endDerivative=1;
	var startDerivativeAvg=0, endDerivativeAvg=1;
	var buySignal=0, sellSignal=1;
	var timeInvested=0;

	//Loop through time!
	for(var i=0;i<Object.keys(quotes[symbol]).length-1;i++){
		if(i>longDays){

			if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)>movAvgDerivative(quotes[symbol], i, 28) && 
				startDerivativeDiff<endDerivativeDiff){
				startDerivativeDiff=i;
			}else if(movAvgDerivative(quotes[symbol], i, shortDays)-movAvgDerivative(quotes[symbol], i, longDays)<movAvgDerivative(quotes[symbol], i, 28) && 
				startDerivativeDiff>endDerivativeDiff){
				endDerivativeDiff=i;
			}
			if(movAvg(quotes[symbol], i, 28)-movAvg(quotes[symbol], i-1, 28)>0 && 
				startDerivative<endDerivative){
				startDerivative=i;
			}else if(movAvg(quotes[symbol], i, 28)-movAvg(quotes[symbol], i-1, 28)<0 && 
				startDerivative>endDerivative){
				endDerivative=i;
			}
			if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 14)>0 &&
				startDerivativeAvg<endDerivativeAvg){
				startDerivativeAvg=i;
			}else if(movAvgDerivative(quotes[symbol], i, 28)-movAvgDerivativeAvg(quotes[symbol], i, 28, 14)<0 &&
				startDerivativeAvg>endDerivativeAvg){
				endDerivativeAvg=i;
			}
			if(startDerivative>endDerivative &&
				startDerivativeAvg>endDerivativeAvg && 
				startDerivativeDiff>endDerivativeDiff &&
				buySignal<sellSignal){
				buySignal=i;
			}
			if((startDerivative<endDerivative ||
				startDerivativeAvg<endDerivativeAvg) && 
				buySignal>sellSignal){
				sellSignal=i;
			}
			curDate=new Date(quotes[symbol][buySignal].date);
			nextDate=new Date(quotes[symbol][sellSignal].date);
			if(buySignal>sellSignal){
				var stocksToBuy=Math.floor(funds/quotes[symbol][i].closing);
				if(stocksToBuy>=1){
					stocks+=stocksToBuy;
					funds-=stocksToBuy*quotes[symbol][i].closing;
					trades++;
				}
			}else{
				if(stocks>0){
					funds+=stocks*quotes[symbol][i].closing;
					stocks=0;
					trades++;
				}
			}
			if(stocks>0)
				timeInvested++;
		}
	}
	console.log("Comb | Starting funds: "+startingFunds+" Value: "+(funds+(stocks*quotes[symbol][Object.keys(quotes[symbol]).length-1].closing))+" Trades: "+trades+" Time: "+timeInvested);
	funds=startingFunds;
	stocks=0;
	trades=0;
}