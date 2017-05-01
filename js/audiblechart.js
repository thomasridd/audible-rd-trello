/**
 * Created by Tom.Ridd on 15/04/2017.
 */
//
// (function() {
var ac;
if('webkitAudioContext' in window) {
    ac = new webkitAudioContext();
} else {
    ac = new AudioContext();
}

var tempo = 120;
var activePoint = 0;
var activeSeries = 0;

const ENTER_KEY = 13;
const UP_KEY = 38;
const DOWN_KEY = 40;
const LEFT_KEY = 37;
const RIGHT_KEY = 39;
const SPACE_KEY = 32;

const PITCH_MIN = 300;
const PITCH_MAX = 600;

function playTune(tune) {
    var sequence = new AcMusic.Sequence( ac, tempo );

    for(note in tune) {
        frequency = 300.00 + tune[note];
        sequence.push(new AcMusic.Note(frequency + ' q'))
    }
    sequence.loop = false;
    sequence.smoothing = 0.25;
    sequence.gain.gain.value = 0.1;
    sequence.play();
}

function playNote(chart, note) {
    frequency = frequencyChartValue(chart, note);
    var sequence = new AcMusic.Sequence( ac, tempo );
    sequence.push(new AcMusic.Note(frequency + ' q'));
    sequence.loop = false;
    sequence.gain.gain.value = 0.1;
    sequence.play();
}

function playSeries(chart, series) {
    var msg = new SpeechSynthesisUtterance(
        'Series ... ' +
        chart.series[series].name + ' ... '
    );
    msg.volume = 1;
    msg.onend = function (event) {
        // When message is finished play the sequence
        var sequence = new AcMusic.Sequence( ac, tempo );

        for(point in chart.series[series].points) {
            frequency = frequencyChartValue(chart, chart.series[series].points[point].y);
            sequence.push(new AcMusic.Note(frequency + ' q'))
        }
        sequence.loop = false;
        sequence.smoothing = 0.5;
        sequence.gain.gain.value = 0.1;
        sequence.play();
    };

    window.speechSynthesis.speak(msg);
}

function frequencyChartValue(chart, value) {

    min = chart.yAxis[0].min;
    max = chart.yAxis[0].max;
    return PITCH_MIN + (PITCH_MAX - PITCH_MIN) * (value - min)/(max-min);
}

function speakPoint(chart, series, point) {
    var msg = new SpeechSynthesisUtterance(
        chart.series[series].data[point].category + ' ... ' +
        chart.series[series].name + ' ... ' +
        chart.series[series].data[point].y
    );
    msg.volume = 1;
    window.speechSynthesis.speak(msg);
}

function speakSeries(chart, series) {
    var msg = new SpeechSynthesisUtterance(
        chart.series[series].name
    );
    msg.volume = 1;
    window.speechSynthesis.speak(msg);
}



function checkPoint(chart, series, point) {
    chart.tooltip.refresh(chart.series[series].data[point]);
    playNote(chart, chart.series[series].data[point].y);
}

function drawAudibleTimeseries(data) {
    return Highcharts.chart('container', {
        title: {
            text: data.title
        },
        xAxis: {
            categories: data.categories,
            title: {
                text: data.x_label
            }
        },
        yAxis: {
            title: {
                text: data.y_label
            }
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function () {
                            activePoint = this.index;
                            activeSeries = this.series.index;
                            playNote(this.series.chart, this.y);
                        }
                    }
                }
            }
        },

        series: data.series

    }, function(chart){

        $(document).keydown(function(e){
            console.log(e.which);
            switch(e.which) {
                case ENTER_KEY:
                    // ENTER
                    playSeries(chart, activeSeries);
                    break;

                case SPACE_KEY:
                    // SPACE
                    speakPoint(chart, activeSeries, activePoint);
                    break;

                case LEFT_KEY:
                    // LEFT
                    if(activePoint>0)
                        activePoint--;
                    checkPoint(chart, activeSeries, activePoint)
                    break;

                case UP_KEY:
                    // UP
                    activeSeries = activeSeries - 1;
                    if(activeSeries < 0 ) { activeSeries = chart.series.length - 1; }

                    checkPoint(chart, activeSeries, activePoint);
                    break;

                case RIGHT_KEY:
                    // RIGHT
                    if(activePoint+1 < chart.series[activeSeries].data.length)
                        activePoint++;

                    checkPoint(chart, activeSeries, activePoint);
                    break;

                case DOWN_KEY:
                    // DOWN
                    activeSeries = activeSeries + 1;
                    if(activeSeries >= chart.series.length) { activeSeries = 0; }

                    checkPoint(chart, activeSeries, activePoint);
                    break;

            }

        })


    });
}

function setupAudibleChart(data, settings) {

    var chart = drawAudibleTimeseries(data);
    tempo = settings.tempo;

    playDescription(chart);
}

function playDescription(chart) {

    var title = chart.title.textStr;
    var xaxis = chart.xAxis[0].axisTitle.textStr;
    var yaxis = chart.yAxis[0].axisTitle.textStr;
    var start = chart.xAxis[0].categories[0];

    var str = 'You are in a line graph. Title: ' + title + ', x-axis: ' + xaxis + '; y-axis: ' + yaxis + '.\n';
    str = str + 'Starting at ' + start + '.\n';
    str = str + 'Press enter to hear the line played as a sound. \n';
    str = str + 'Press space to speak the year and value of a point';

    var msg = new SpeechSynthesisUtterance(str);
    msg.volume = 1;
    window.speechSynthesis.speak(msg);
}