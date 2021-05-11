import React, { Component } from "react";
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Input,
  Label,
} from "reactstrap";

export default class CustomModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeItem: this.props.activeItem,
      profile: this.props.profile,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      viewHistory: false,
      history: [],
    };
  }

  componentDidMount() {
    this.refreshHistory();

    // update every second
    this.interval = setInterval(() => {
      const date = this.calculateCountdown(this.state.activeItem.closeDate);
      date ? this.setState(date) : this.stop();
    }, 1000);
  }

  componentWillUnmount() {
    this.stop();
  }

  calculateCountdown(endDate) {
    let diff = (Date.parse(new Date(endDate)) - Date.parse(new Date())) / 1000;

    // clear countdown when date is reached
    if (diff <= 0) return false;

    const timeLeft = {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      sec: 0,
      millisec: 0,
    };

    // calculate time difference between now and expected date
    if (diff >= (365.25 * 86400)) { // 365.25 * 24 * 60 * 60
      timeLeft.years = Math.floor(diff / (365.25 * 86400));
      diff -= timeLeft.years * 365.25 * 86400;
    }
    if (diff >= 86400) { // 24 * 60 * 60
      timeLeft.days = Math.floor(diff / 86400);
      diff -= timeLeft.days * 86400;
    }
    if (diff >= 3600) { // 60 * 60
      timeLeft.hours = Math.floor(diff / 3600);
      diff -= timeLeft.hours * 3600;
    }
    if (diff >= 60) {
      timeLeft.min = Math.floor(diff / 60);
      diff -= timeLeft.min * 60;
    }
    timeLeft.sec = diff;

    return timeLeft;
  }

  stop() {
    clearInterval(this.interval);
  }

  addLeadingZeros(value) {
    value = String(value);
    while (value.length < 2) {
      value = '0' + value;
    }
    return value;
  }

  handleChange = (e) => {
    let { name, value } = e.target;

    if (e.target.type === "checkbox") {
      value = e.target.checked;
    }

    const activeItem = { ...this.state.activeItem, [name]: value };

    this.setState({ activeItem });
  };

  refreshHistory = () => {
    fetch("/api/bidding/?item=" + this.state.activeItem.id)
      .then(response => {
        if (response.status !== 200) {
          alert("Error");
        }
        return response.json();
      })
      .then(data => {
        this.setState({ history: data });
      });
  };

  renderHistory = () => {
    return this.state.history.map((item) => (
      <li
        key={item.id}
        className="list-group-item d-flex justify-content-between align-items-center"
      >
        <span
          className={`mr-2`}
        >
          Bid: {item.bid} - Date: { new Date(item.created_at).toLocaleString() }
        </span>

      </li>
    ));
  };

  renderContent = () => {
    const countDown = this.state;

    return (
      <Form>
        <FormGroup>
          <div className="Countdown">
                <span className="Countdown-col">
                  <span className="Countdown-col-element">
                      <strong>{this.addLeadingZeros(countDown.days)}</strong>
                      <span>{countDown.days === 1 ? ' Day ' : ' Days '}</span>
                  </span>
                </span>

            <span className="Countdown-col">
                  <span className="Countdown-col-element">
                    <strong>{this.addLeadingZeros(countDown.hours)}</strong>
                    <span>&nbsp;Hours&nbsp;</span>
                  </span>
                </span>


            <span className="Countdown-col">
                  <span className="Countdown-col-element">
                    <strong>{this.addLeadingZeros(countDown.min)}</strong>
                    <span>&nbsp;Min&nbsp;</span>
                  </span>
                </span>

            <span className="Countdown-col">
                  <span className="Countdown-col-element">
                    <strong>{this.addLeadingZeros(countDown.sec)}</strong>
                    <span>&nbsp;Sec</span>
                  </span>
                </span>
          </div>
        </FormGroup>
        <FormGroup>
          <p
            id="item-description"
          >
            {this.state.activeItem.description}
          </p>
        </FormGroup>
        <FormGroup>
          <Label for="item-bid">Bid</Label>
          <Input
            type="number"
            id="item-bid"
            name="bid"
            min={this.state.activeItem.bid}
            value={this.state.activeItem.bid}
            onChange={this.handleChange}
            placeholder="Enter your bid"
          />
        </FormGroup>
        <FormGroup check>
          <Label check>
            <Input
              type="checkbox"
              name="autobid"
              checked={this.state.activeItem.autobid}
              onChange={this.handleChange}
            />
            Auto-bidding
          </Label>
        </FormGroup>
      </Form>
    );
  };

  renderTabList = () => {
    return (
      <div className="nav nav-tabs">
        <span
          className={this.state.viewHistory ? "nav-link pointer active" : "nav-link pointer"}
          onClick={() => this.setState({viewHistory: true})}
        >
          History
        </span>
        <span
          className={this.state.viewHistory ? "nav-link pointer" : "nav-link pointer active"}
          onClick={() => this.setState({viewHistory: false})}
        >
          Item
        </span>
      </div>
    );
  };

  render() {
    const { toggle, onSave } = this.props;

    return (
      <Modal isOpen={true} toggle={toggle}>
        <ModalHeader toggle={toggle}>{this.state.activeItem.name}</ModalHeader>
        <ModalBody>
          <div className="row">
            <div className="col-md-12 col-sm-12 mx-auto p-0">
              <div className="card p-3">
                {this.renderTabList()}
                <ul className="list-group list-group-flush border-top-0">
                  {this.state.viewHistory ?
                    this.renderHistory() : ""
                  }
                </ul>
              </div>
            </div>
          </div>
          {this.state.viewHistory ?
            "" : this.renderContent()
          }
        </ModalBody>
        <ModalFooter>
          {this.state.viewHistory ?
            ""
            :
            <Button
              color="success"
              onClick={() => onSave(this.state.activeItem, this)}
            >
              Submit Bid
            </Button>
          }
        </ModalFooter>
      </Modal>
    );
  }
}