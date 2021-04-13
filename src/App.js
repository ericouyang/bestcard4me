import React, { Component } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import {SpendingForm, ResultsTable, BestCardResult} from './components';

const data = require('./data.json');

class App extends Component {
  constructor(props) {
    super(props);

    var categorySpends = {};

    data.display.forEach((key) => {
      var value = data.categories[key];
      value.amount = 0;
      categorySpends[key] = value;
    });

    var cards = data.cards.map((card) => {
      card.results = {};
      data.display.forEach((key) => {
        var value = Object.create(data.categories[key]);
        var multiplier = card.categories.hasOwnProperty(key) ? card.categories[key] : card.categories.other;
        value.multiplier = multiplier;        
        value.amount = 0;
        value.monthlyAmount = 0;
        value.redeemedCredit = 0;
        card.results[key] = value;
      });
      card.total = 0;
      card.redemptionTotal = 0;
      card.netValue = - card.annualFee;
      card.netValueString =
        (card.netValue < 0) ?
          '-$' + Math.abs(card.netValue).toFixed(2)
          : '$' + card.netValue.toFixed(2);
      return card;
    });

    cards.sort((a, b) => {
      var diff = b.netValue - a.netValue;
      return (diff === 0) ? (a.description.length - b.description.length) : diff;
    });

    this.state = {
      categorySpends: categorySpends,
      cards: cards,
      bestCard: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.updateCategorySpend = this.updateCategorySpend.bind(this);
  }

  updateCategorySpend(name, value) {
    this.setState((state) => {
      var categorySpend = state.categorySpends[name];

      categorySpend.amount = value;
      
      var annualSpend = value * 12;

      state.cards.forEach((card) => {
        card.results[name].monthlyAmount = value;
        card.results[name].amount = annualSpend * card.results[name].multiplier * card.redemptionBonus;

        if (card.hasOwnProperty("credits")) {

          card.credits.forEach((credit) => {

            // if the category being updated is subject to a credit
            if (credit.categories.indexOf(name) >= 0) {

              // fully recalculate credits 
              var creditRemaining = credit.maxAmount;
              
              for (const key in card.results) {
                if (credit.categories.indexOf(key) >= 0) {
                  card.results[key].redeemedCredit = Math.min(
                    card.results[key].monthlyAmount * 12,
                    creditRemaining
                  );
                  creditRemaining = creditRemaining - card.results[key].redeemedCredit;
                }
              }

              card.results[name].amount = card.results[name].amount + card.results[name].redeemedCredit;
            }
          });
        }

        var total = 0;
        Object.keys(card.results).forEach((k) => {
          var v = card.results[k].amount;
          total += v;
        });

        card.total = total;
        card.netValue = card.total - card.annualFee;
        card.netValueToFixed = card.netValue.toFixed(2);
        card.netValueString =
          (card.netValue < 0) ?
            '-$' + Math.abs(card.netValueToFixed)
            : '$' + card.netValueToFixed;

      });

      var bestCard = this.state.cards.sort((a, b) => b.netValue - a.netValue)[0];
      
      state.bestCard = bestCard.total === 0 ? null : bestCard;

      return state;
    });
  }

  handleChange(event) {
    const target = event.target;
    const name = target.name;
    const value = 
      target.type === 'checkbox'
      ? target.checked
      : target.value;
    
    this.updateCategorySpend(name, value);
  }

  handleSubmit(event) {
    event.preventDefault();
  }

  render() {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6">
            <SpendingForm
              handleSubmit={this.handleSubmit}
              handleChange={this.handleChange}
              categorySpends={this.state.categorySpends} 
              display={data.display} />
            <p />
            <p className="text-right"><small>Last Updated: December 27, 2020</small></p>
          </div>
          <div className="col-md-6">
            <BestCardResult {...this.state} />
            <div className="alert alert-warning" role="alert">
              *Notes:
                <ul>
                  <li>Annual benefit may be negative as annual fee is factored into calculations</li>
                  <li>Reward value calculations assume the best possible redemption rate</li>
                  <li>Signing/new card/annual bonuses are not included</li>
                  <li>Discover card returns are approximated based on rotating 5% cashback categories (assumes one quarter annually for grocery, gas, Amazon, restaurants)</li>
                  <li>Chase Sapphire cards' grocery rates only apply through April 2021, up to $1,000 monthly spend amount; through June 2021, the $300 annual travel credit also applies to gas and groceries (note that gas is not normally considered travel); several other perks such as Dashpass not included in this calculator</li>
                  <li>Amex Gold includes restaurant credit of $10/mo. at eligible locations</li>
                  <li>Marriot Bonvoy Brilliant calculations assume only stays at Bonvoy hotels; assumes TPG redemption rate of 0.8 cents per Bonvoy point</li>
                </ul>
            </div>
          </div>
        </div>
        <br />
        <div className="row">
          <div className="col-12">
            <p className="text-center">
              <a className="btn btn-info" data-toggle="collapse" href="#results-table" aria-expanded="false" aria-controls="results-table">
                Show/hide calculations
              </a>
            </p>
            
            <div className="collapse" id="results-table">
              <div className="card">
                <h3 className="card-header">Your annual rewards (by category)</h3>
                <div className="card-body">
                  <p><em>Hover over each number to see how they are calculated (monthly spend * 12 months/year * rewards/dollar * redemption bonus + spending credit)</em></p>
                  <ResultsTable {...this.state} display={data.display} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
