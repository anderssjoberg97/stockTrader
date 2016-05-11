//Moving average function
function movAvg(quotes, day, days=28, column="closing"){
	var sum=0;
	var numValues=0;
	for(var i=0;day-i>=0 && i<days;i++){
		sum+=quotes[day-i][column];
		numValues++;
	}
	return sum/numValues;
}

//Moving average derivative
function movAvgDerivative(quotes, day, days=28, column="closing"){
	if(day!=0){
		var sum=0;
		var numValues=0;
		var avg1, avg2;
		for(var i=0;day-i>=0 && i<days;i++){
			sum+=quotes[day-i][column];
			numValues++;
		}
		avg1=sum/numValues;
		sum=0;
		numValues=0;
		for(var i=0;day-i-1>=0 && i<days;i++){
			sum+=quotes[day-i-1][column];
			numValues++;
		}
		avg2=sum/numValues;
		return avg1-avg2;
	}else{
		return 0;
	}
}
function movAvgDerivativeAvg(quotes, day, derivativeDays=28, avgDays=5){
	if(day!=0){
		var sum=0;
		var numValues=0;
		for(var i=0;day-i>=0 && i<avgDays;i++){
			sum+=movAvgDerivative(quotes, day-i, derivativeDays);
			numValues++;
		}
		return sum/numValues;
	}else{
		return 0;
	}

}
function movAvgDerivativeDerivative(quotes, day, firstDays=28, secondDays=28, column="closing"){
	if(day!=0){
		var sum=0;
		var numValues=0;
		var avg1, avg2;
		for(var i=0;day-i>=0 && i<secondDays;i++){
			sum+=movAvgDerivative(quotes, day, firstDays);
			numValues++;
		}
		avg1=sum/numValues;
		sum=0;
		numValues=0;
		for(var i=0;day-i-1>=0 && i<secondDays;i++){
			sum+=movAvgDerivative(quotes, day-1, firstDays);
			numValues++;
		}
		avg2=sum/numValues;
		console.log(avg1);
		return avg1-avg2;
	}else{
		return 0;
	}
}