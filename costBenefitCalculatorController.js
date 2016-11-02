angular.module('expenseCalculator').controller("costBenefitCalculatorController", function () {

    var self = this;


    /************************************** view *********************************************/

    self.onChangeLocation = function() {
        if(self.inputsProvided.location && self.internalConstraints.monthlyUnitsProduced && self.inputsProvided.monthlyUnitsConsumed) {
            calculateElectricityTariffParameters();
        }
        else {
            self.outputs.monthlyBillSavings = '';
        }
    };

    self.onChangeUnitsConsumedOrRoofSize = function() {
        if(self.inputsProvided.roofSize && self.inputsProvided.monthlyUnitsConsumed) {
            calculateSystemOutputParameters();
            if(self.inputsProvided.location) {
                calculateElectricityTariffParameters();
            }
        }
        else {
            self.outputs.systemCost = '';
            self.outputs.systemSize = '';
            self.internalConstraints.monthlyUnitsProduced = '';
            self.maxLoanAllowed = '';
            self.outputs.monthlyBillSavings = '';
            self.inputsProvided.loanTenure = '';
            self.inputsProvided.loanAmount = '';
            self.outputs.monthlyEMI = '';
            self.chart.data = [];
        }
    };

    self.onChangeLoanParameters = function() {
        if(self.inputsProvided.loanAmount && self.inputsProvided.loanAmount > 0.85*self.outputs.systemCost) {
            self.errorMessage = "Loan amount can't be more than 85% of the system cost" ;
        }
        else {
            self.errorMessage = '';
        }
        if(self.inputsProvided.loanTenure && self.inputsProvided.loanAmount && !self.errorMessage) {
            calculateLoanOutputParameters();
        }
        else {
            self.outputs.monthlyEMI = '';
            self.chart.data.splice(2,1);
        }
    };

    /************************************** model *********************************************/

    var inputsCalculated =
    {
        "currentElectricBill" : "",
        "reducedUnits": "",
        "reducedElectricityBill":""
    };

    var chartDataPoints = {};

    self.inputsProvided =
    {
        "location": "MUMBAI",
        "roofSize": "",
        "monthlyUnitsConsumed": "",
        "loanTenure":'',
        "loanAmount":""
    };

    self.internalConstraints =
    {
        "unitSystemCost" : 75000,
        "monthlyUnitsProduced" : "",
        "interestRate":11,
        "electricityTariff":{
            "BANGALORE":5,
            "MUMBAI":7,
            "PUNE":9
        }
    };
    self.outputs =
    {
        'systemSize':'',
        'systemCost':'',
        'monthlyEMI':'',
        'monthlyBillSavings': ''
    };
    self.maxLoanAllowed = '';
    self.chart = {};
    self.chart.labels = [0,1,2,3,4,5,6,7,8,9,10];
    self.chart.series = ['No solar system','Solar without loan','Solar with loan'];
    self.chart.data = [];
    self.chart.onClick = function (points, evt) {
        console.log(points, evt);
    };
    self.chart.datasetOverride = [{ yAxisID: 'y-axis-1' }];
    self.chart.options = {
        scales: {
            yAxes: [
                {
                    id: 'y-axis-1',
                    type: 'linear',
                    display: true,
                    position: 'left',
                    scaleLabel: {
                        display: true,
                        labelString: 'Cost (in INR)'
                    }
                }
            ],
            xAxes: [
                {
                    scaleLabel: {
                        display: true,
                        labelString: 'Time (in years)'
                    }
                }
            ]
        },
        legend: {display: true}
    };
    // self.chart.colors = ['red','blue','green'];

/************************************** controller *********************************************/

    function initController() {

    }

    function calculateSystemOutputParameters() {
        self.outputs.systemSize = Math.round(Math.min((self.inputsProvided.roofSize/100),(self.inputsProvided.monthlyUnitsConsumed/120))*100)/100;
        self.outputs.systemCost = Math.round(self.internalConstraints.unitSystemCost * self.outputs.systemSize *100)/100;
        self.internalConstraints.monthlyUnitsProduced = Math.round(self.outputs.systemSize * 4 * 30 * 100)/100;
        self.maxLoanAllowed = Math.round(0.85*self.outputs.systemCost*100)/100;
    }

    function calculateLoanOutputParameters(){
        self.outputs.monthlyEMI = Math.round(((self.inputsProvided.loanAmount + (self.inputsProvided.loanAmount * self.internalConstraints.interestRate * self.inputsProvided.loanTenure)/100)/(self.inputsProvided.loanTenure*12))*100)/100;
        prepareDataForChart();
    }

    function calculateElectricityTariffParameters() {
        inputsCalculated.currentElectricBill = self.inputsProvided.monthlyUnitsConsumed * self.internalConstraints.electricityTariff[self.inputsProvided.location];
        inputsCalculated.reducedUnits = self.inputsProvided.monthlyUnitsConsumed-self.internalConstraints.monthlyUnitsProduced > 0 ? (self.inputsProvided.monthlyUnitsConsumed-self.internalConstraints.monthlyUnitsProduced) : 0;
        inputsCalculated.reducedElectricityBill = inputsCalculated.reducedUnits*self.internalConstraints.electricityTariff[self.inputsProvided.location];
        self.outputs.monthlyBillSavings = Math.round((inputsCalculated.currentElectricBill - inputsCalculated.reducedElectricityBill - self.outputs.monthlyEMI)*100)/100;
        prepareDataForChart();
    }

    function prepareDataForChart() {
        chartDataPoints.noSolar = [];
        chartDataPoints.solarWithoutLoan = [];
        delete chartDataPoints.solarWithLoan;
        for(var i=0; i<=10; i++) {
            chartDataPoints.noSolar.push(inputsCalculated.currentElectricBill*i*12);
            chartDataPoints.solarWithoutLoan.push(Math.round((inputsCalculated.reducedElectricityBill*i*12 + self.outputs.systemCost)*100)/100);
        }
        self.chart.data = [chartDataPoints.noSolar, chartDataPoints.solarWithoutLoan];
        if(self.inputsProvided.loanTenure && self.inputsProvided.loanAmount) {
            chartDataPoints.solarWithLoan = [];
            for (var j = 0; j <= self.inputsProvided.loanTenure; j++) {
                chartDataPoints.solarWithLoan.push(Math.round(((inputsCalculated.reducedElectricityBill + self.outputs.monthlyEMI) * j * 12 + self.outputs.systemCost-self.inputsProvided.loanAmount)*100)/100);
            }
            for (var k = Number(self.inputsProvided.loanTenure) + 1; k <= 10; k++) {
                chartDataPoints.solarWithLoan.push(Math.round(((inputsCalculated.reducedElectricityBill) * k * 12 + self.outputs.systemCost-self.inputsProvided.loanAmount + self.outputs.monthlyEMI*self.inputsProvided.loanTenure*12)*100)/100);
            }
            self.chart.data.push(chartDataPoints.solarWithLoan);
        }

        console.log(self.chart.data);
    }

    initController();
});