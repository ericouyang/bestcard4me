import React from 'react';
import Chart from 'chart.js';

var SpendingForm = function(props) {
  var getFormRow = function(elem) {
    var advanced, key;

    if (Array.isArray(elem)) {
      key = elem.shift();
      advanced = elem;
    }
    else {
      key = elem;
    }

    var value = props.categorySpends[key];

    var iconClass = (Array.isArray(value.icon) ? value.icon.join(' ') : `fa fa-${value.icon}`) + " fa-fw";

    return (
      <div className="form-group" key={key}>
        <div className="row">
          <label htmlFor={key} className="col-5 col-form-label col-form-label">
            <i className={iconClass} aria-hidden="true"></i>
            {value.description}
            {
              advanced && 
              <small>
                &nbsp;<a href={"#" + key + "-collapse"} data-toggle="collapse">(Expand)</a>
              </small>
            }
          </label>
          {/* <div className="input-group col-7">
            <span className="input-group-addon">$</span>
            <input
              type="text"
              className="form-control form-control"
              name={key}
              value={props.categorySpends[key].amount}
              onChange={props.handleChange}
              onBlur={props.handleBlur}
              />
          </div> */}
          <div className="col-7">
            <div className="range">
              <input
                type="range"
                name={key}
                min="0"
                max="1000"
                step="10"
                value={props.categorySpends[key].amount}
                onChange={props.handleChange}
                onBlur={props.handleBlur}
                />
              <output htmlFor={key} id={`${key}-output`}>${props.categorySpends[key].amount}</output>
            </div>
          </div>
        </div>
        {
          advanced && 
          <div className="spending-form-advanced collapse" id={key + "-collapse"}>
            {advanced.map((key) => getFormRow(key))}
          </div>
        }
      </div>
    );
  };

  return (
    <div className="card">
      <h3 className="card-header">Your monthly spend</h3>
      <div className="card-body">
        <p><em>Drag the blue slider to your estimated category spend!</em></p>
        <form onSubmit={props.handleSubmit} id="spending-form">
          {
            props.display.map((elem) => {
              return getFormRow(elem);
            })
          }
        </form>
      </div>
    </div>
  )
};

var ResultsRow = function(props) {
  var cols = props.display.map((k) => {
    var v = props.results[k].amount;
    var tooltip = `$${props.results[k].monthlyAmount} * 12 * ${props.results[k].multiplier} * ${props.redemptionBonus} + ${props.results[k].redeemedCredit}`;
    return <td key={k} data-toggle="tooltip" data-original-title={tooltip}>${v.toFixed(2)}</td>;
  });

  return (
    <tr>
      <th scope="row">{props.description} (${props.annualFee})</th>
      {cols}
      {/* <td>${props.total.toFixed(2)}</td>
      <td>${props.redemptionTotal.toFixed(2)}</td> */}
      <td className="lastColumn">{props.netValueString}</td>
    </tr>
  )
};

var ResultsTable = function(props) {
  return (
    <table className="table table-responsive table-hover">
      <thead>
        <tr>
          <th scope="col">Card (Annual Fee)</th>
          {
            props.display.map((key) => {
              var value = props.categorySpends[key];
              return <th scope="col" key={key}>{value.description}</th>
            })
          }
          {/* <th scope="col">Value Accrued</th>
          <th scope="col">Value Redeemable</th> */}
          <th scope="col">Annual benefit*</th>
        </tr>
      </thead>
      <tbody>
        {props.cards.map((card) => {
          return <ResultsRow {...card} key={card.name} display={props.display} />
        })}
      </tbody>
    </table>
  )
}

class BestCardResult extends React.Component {
  
  constructor(props) {
    super(props);

    this.state = {
      chart: null
    };
  }

  componentWillReceiveProps(nextProps) {
    this.updateChart(nextProps.cards);
  }

  updateChart(cards) {
    var len = cards.length;

    var greenHue = 142;
    var redHue = 3;

    var colors = cards.map((card, i) => {
      var hue = (greenHue - redHue) * (len - i) / len + redHue;
      return `hsl(${hue}, 80%, 50%)`
    }); 

    var c = this.state.chart;
    
    c.data = {
      labels: cards.map(card => card.description),
      datasets: [{
        label: "Value",
        data: cards.map(card => card.netValue),
        backgroundColor: colors,
        hoverBackgroundColor: colors
      }]
    }
    
    this.state.chart.update(0);
  }

  componentDidMount() {
    var ctx = document.getElementById('best-card-result-chart').getContext('2d');

    this.setState({
      chart: new Chart(ctx, {
        type: 'horizontalBar',
        data: [],
        options: {
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          tooltips: {
            fontFamily: "'Barlow', sans-serif",
            callbacks: {
              label: function(tooltipItem, data) {
                if (tooltipItem.xLabel < 0) 
                  return '-$' + Math.abs(tooltipItem.xLabel).toFixed(2)
                return '$' + tooltipItem.xLabel.toFixed(2);
              }
            }
          },
          scales: {
            yAxes: [{
              ticks: {
                fontFamily: "Barlow, sans-serif",
                fontSize: 14
              }
            }],
            xAxes: [{
              ticks: {
                autoSkip: false,
                suggestedMax: 1000,    
                min: -600,
                stepSize: 200,
                callback: function(value, index, values) {
                  if (value < 0) 
                    return '-$' + Math.abs(value)
                  return '$' + value;
                },
                fontFamily: "Barlow, sans-serif",
                fontSize: 14
              },
            }],          
          }
        }
      })
    },
    // callback
    () => this.updateChart(this.props.cards)
    );
  }

  render() {
    return (
      <div className="card" id="best-card-result">
        <h3 className="card-header">Your annual benefit*</h3>
        <div className="card-body">
          <canvas id="best-card-result-chart" height="400"></canvas>
        </div>
      </div>
    )
  }
}

export {SpendingForm, ResultsTable, BestCardResult};