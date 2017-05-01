/**
 * Created by Tom.Ridd on 28/04/2017.
 */

function drawTrelloActivityChart(categories, data) {
    return Highcharts.chart('container', {
        chart: {
            type: 'bar'
        },
        title: {
            text: 'Measure progress'
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Measures in play'
            }
        },
        legend: {
            reversed: true
        },
        plotOptions: {
            series: {
                stacking: 'normal'
            }
        },
        series: data
    });
}


var boardId = '58e75ebe43df25c997b03055'

var departments = {'[DWP':0,'[BEIS':1,'[DCMS':2,'[DEFRA':3, '[HO':4,
                    '[MoJ':5, '[CO':6, '[DH':7, '[DfE':8, '[DCLG':9};
var departmentNames = ['DWP', 'BEIS', 'DCMS', 'DEFRA', 'Home Office', 'MoJ', 'Cabinet Office', 'Health', 'Education', 'DCLG'];
var chart = null;

function authorise(success, failure) {
    Trello.authorize({
        type: 'popup',
        name: 'Getting Started Application',
        scope: {
            read: 'true',
            write: 'true' },
        expiration: 'never',
        success: success,
        error: failure
    });
}

function emptySeries(length) {
    var series = [];
    for(s in departmentNames){
        var name = departmentNames[s];
        var data = Array.apply(null, Array(length)).map(Number.prototype.valueOf,0);
        series.push({'name':name, 'data':data});
    }
    return series;
}

function buildActivityChart() {
    getDataFromApi(function(lists, cards) {

        var listDict = {};
        var listNames = []
        for(l in lists) {
            listDict[lists[l].id] = l;
            listNames.push(lists[l].name);
        }


        var data = emptySeries(lists.length);

        for(c in cards) {
            var card = cards[c];
            var listNumber = listDict[card.idList];
            var deptNumber = getDepartment(card);

            if(!(deptNumber === undefined)) {
                data[deptNumber].data[listNumber] += 1;
            }
        }

        if(chart) {
            chart.data = data;
        } else {
            chart = drawTrelloActivityChart(listNames, data);
        }
    });
}



function getDataFromApi(success) {
    Trello.get("boards/" + boardId + '/lists', function(lists) {
        Trello.get("boards/" + boardId + '/cards', function(cards) {
            success(lists, cards);
        });
    });
}

function getDepartment(card) {
    var name = card.name;
    var firstWord = name.split(' ')[0];
    return departments[firstWord];
}

function setupTrelloActivityChart(settings) {
    authorise(function success() {
            // On successful auth draw the chart
            buildActivityChart();
        }, function failure() {
            // On failure go again
            setupTrelloActivityChart(settings);
    });
}