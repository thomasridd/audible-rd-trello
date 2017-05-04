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

function drawTrelloActivityFlow(categories, series) {
    Highcharts.chart('container', {
        chart: {
            type: 'area'
        },
        title: {
            text: 'Cumulative Flow'
        },
        xAxis: {
            categories: categories,
            tickmarkPlacement: 'on',
            title: {
                enabled: false
            }
        },
        yAxis: {
            title: {
                text: 'Measures'
            }
        },
        tooltip: {
            split: true,
            valueSuffix: ' measures'
        },
        plotOptions: {
            area: {
                stacking: 'normal',
                lineColor: '#666666',
                lineWidth: 1,
                marker: {
                    lineWidth: 1,
                    lineColor: '#666666'
                }
            }
        },
        series: series
    });
}

var boardId = '58e75ebe43df25c997b03055'

var departments = {'[DWP':0,'[BEIS':1,'[DCMS':2,'[DEFRA':3, '[HO':4,
                    '[MoJ':5, '[MOJ':5, '[CO':6, '[DH':7, '[DfE':8, '[DCLG':9};
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
        var listNames = [];
        for(l in lists) {
            listDict[lists[l].id] = l;
            if(l > 0) { listNames.push(lists[l].name); }
        }

        var currentActivities = getActivities(lists, listDict, cards);

        if(chart) {
            chart.data = currentActivities;
        } else {
            chart = drawTrelloActivityChart(listNames, currentActivities);
        }
    });
}

function buildActivityFlow() {
    getDataFromApi(function(lists, cards) {

        var flow_data = buildEmptyFlowData();
        addCurrentCards(flow_data, cards, lists);
        setExistingData(flow_data);

        if(chart) {
            chart.data = flow_data;
        } else {
            chart = drawTrelloActivityFlow(cumulative_flow_data.x_axis, flow_data);
        }
    });
}

function buildEmptyFlowData() {
    var serieses = [];
    for(s in cumulative_flow_data.series) {
        var series_name = cumulative_flow_data.series[s];
        var series_data = [];
        for(i in cumulative_flow_data.x_axis) {
            series_data.push(0);
        }
        serieses.push({name:series_name, data:series_data});
    }
    return serieses;
}

function addCurrentCards(flow_data, cards, lists) {
    var time_index = cumulative_flow_data.x_axis.indexOf(cumulative_flow_data.today);

    var listDict = {};
    for(l in lists) {
        listDict[lists[l].name] = lists[l].id;
    }
    console.log(listDict);

    for(s in flow_data) {
        var list_id = listDict[flow_data[s].name];
        var count = 0;
        for(c in cards) {
            if(cards[c].idList === list_id) { count += 1; }
        }
        flow_data[s].data[time_index] = count;
    }
}

function setExistingData(flow_data) {
    for(i in cumulative_flow_data.x_axis) {
        var month = cumulative_flow_data.x_axis[i];
        var data_item = cumulative_flow_data[month];
        if(data_item) { setExistingDataItem(flow_data, month, data_item);}
    }
}
function setExistingDataItem(flow_data, month, data_item) {
    var month_index = cumulative_flow_data.x_axis.indexOf(month);
    for(s in flow_data) {
        var series = flow_data[s].name;
        var value = data_item[series];
        flow_data[s].data[month_index] = value;
    }
}

function getActivities(lists, listDict, cards) {
    var activities = emptySeries(lists.length - 1);
    for(c in cards) {
        var card = cards[c];
        var listNumber = listDict[card.idList] - 1;
        var deptNumber = getDepartment(card);

        if(!(deptNumber === undefined)) {
            activities[deptNumber].data[listNumber] += 1;
        }
    }
    return activities;
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

function setupTrelloActivityFlowGraph(settings) {
    authorise(function success() {
        // On successful auth draw the chart
        buildActivityFlow();
    }, function failure() {
        // On failure go again
        setupTrelloActivityFlowGraph(settings);
    });
}