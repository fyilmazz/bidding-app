import React, { Component } from "react";
import { render } from "react-dom";
import './App.css';
import Modal from "./Modal";
import axios from "axios";
import {Button, Form, FormGroup, Input, Label} from "reactstrap";
import TitlebarGridList from "./Gallery";
import Pagination from "@material-ui/lab/Pagination";


function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      //const cookie = jQuery.trim(cookies[i]);
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
var csrftoken = getCookie('csrftoken');
var axiosInstance = axios.create({
  validateStatus: function (status) {
    return status < 500;
  }
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      modal: false,
      activeItem: {
        id: 0,
        name: "",
        description: "",
        bid: "",
        closeDate: "",
        autobid: false,
        photo: ""
      },
      profile: {
        id: 0,
        max_bid_amount: 0,
      },
      page: 1,
      search: "",
      sortDesc: true,
    };
  }

  componentDidMount() {
    this.refreshPage();
  }

  itemToActiveItem = (item) => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      bid: item.bid + 1,
      closeDate: item.close_date,
      autobid: false,
      photo: item.photo
    };
  };

  refreshPage = () => {
    this.refreshProfile();
    this.refreshList();
  };

  refreshList = () => {
    fetch("/api/item/")
      .then(response => {
        if (response.status !== 200) {
          console.log("Error");
        }
        return response.json();
      })
      .then(data => {
        this.setState({ data: data });
      });
  };

  refreshProfile = () => {
    fetch("/api/profile/" + window.django.profile.id  + "/")
      .then(response => {
        if (response.status !== 200) {
          console.log("Error");
        }
        return response.json();
      })
      .then(data => {
        this.setState({ profile: data });
      });
  };

  refreshItem = (id, caller) => {
    fetch("/api/item/?id=" + id)
      .then(response => {
        return response.json();
      })
      .then(data => {
        caller.refreshHistory();
        caller.setState({ activeItem: this.itemToActiveItem(data[0]) });
        this.refreshPage();
      });
  };

  toggle = () => {
    this.setState({ modal: !this.state.modal });
  };

  onChangeSearch = (e) => {
    const search = e.target.value;

    this.setState({
      search: search,
    });
  };

  onSort = (e) => {
    this.setState({
      sortDesc: !this.state.sortDesc,
    });
  };

  handlePageChange = (event, value) => {
    this.setState(
      {
        page: value,
      }
    );
  };

  handleSubmit = (item, caller) => {
    const config = {
      headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json'
      },
    };
    const data = {
      item: item.id,
      bid: item.bid,
      auto_bid: item.autobid
    };

    axiosInstance.post("/api/bidding/", data, config)
      .then(response => {
        if (response.status !== 201) {
          if ("bid" in response.data) {
            alert(response.data.bid);
          }
          if ("item" in response.data) {
            alert(response.data.item);
          }
          if ("non_field_errors" in response.data) {
            alert(response.data.non_field_errors[0]);
          }
        }

        this.refreshItem(item.id, caller);
      });
  };

  handleChange = (e) => {
    let { name, value } = e.target;

    this.setState({ profile: {...this.state.profile, max_bid_amount: value} });
  };

  updateProfile = (profile) => {
    const config = {
      headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json'
      },
    };

    axiosInstance.patch("/api/profile/" + profile.id + "/", profile, config)
      .then(response => {
        if (response.status !== 200) {
          alert(response.data);
        }

        this.refreshPage();
      });
  };

  bidItem = (item) => {
    this.setState({ activeItem: this.itemToActiveItem(item), modal: !this.state.modal });
  };

  renderItems = (newItems) => {
    return <TitlebarGridList tileData={newItems} onClick={this.bidItem} onSort={this.onSort} />;
  };

  render() {
    let newItems = this.state.data;
    const pageStart = (this.state.page - 1) * 10;
    const sortDesc = this.state.sortDesc;

    if (this.state.search) {
      newItems = newItems.filter(
        (item) => item.name.includes(this.state.search) || item.description.includes(this.state.search)
      );
    }

    newItems.sort(function(first, second) {
      if (sortDesc) {
        return second.bid - first.bid;
      }
      return first.bid - second.bid;
    });

    const count = Math.ceil(newItems.length / 10);
    newItems = newItems.slice(pageStart, pageStart + 10);

    return (
      <main className="container">
        <h1 className="text-white text-uppercase text-center my-4">Bidding App</h1>
        <div className="row">
          <Button
            color="secondary"
            onClick={() => window.location.href = "accounts/login/"}
          >
            Change User
          </Button>
        </div>
        <div className="row">
          <div className="col-md-6 col-sm-10 mx-auto p-0">
            <Form>
              <FormGroup>
                <Label for="profile-max-bid-amount">Max Bid Amount</Label>
                <FormGroup className="flex">
                  <Input
                    type="number"
                    id="profile-max-bid-amount"
                    name="max-bid-amount"
                    min="0"
                    value={this.state.profile.max_bid_amount}
                    onChange={this.handleChange}
                    placeholder="Enter your max bid amount"
                  />
                  <Button
                    color="success"
                    onClick={() => this.updateProfile(this.state.profile)}
                  >
                    Save
                  </Button>
                </FormGroup>
              </FormGroup>
              <FormGroup>
                <FormGroup className="flex">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search"
                    value={this.state.search}
                    onChange={this.onChangeSearch}
                  />
                </FormGroup>
              </FormGroup>
            </Form>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 col-sm-10 mx-auto p-0">
            <div className="card p-3">
              <ul className="list-group list-group-flush border-top-0">
                {this.renderItems(newItems)}
              </ul>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 col-sm-10 mx-auto p-0">
            <Pagination
              className="my-3"
              count={count}
              page={this.state.page}
              siblingCount={1}
              boundaryCount={1}
              variant="outlined"
              shape="rounded"
              onChange={this.handlePageChange}
            />
          </div>
        </div>

        {this.state.modal ? (
          <Modal
            activeItem={this.state.activeItem}
            toggle={this.toggle}
            onSave={this.handleSubmit}
            profile={this.state.profile}
          />
        ) : null}
      </main>
    );
  }
}

export default App;

const container = document.getElementById("app");
render(<App />, container);