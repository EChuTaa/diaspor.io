import React, { Component } from 'react';
import axios from "axios";

import Login from './components/Login'
import Profile from './components/Profile'

//import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    if (localStorage.username !== undefined) {
      if (sessionStorage.token !== undefined) {
        this.state = {
          auth: {
            token: sessionStorage.token,
            validToken: false,
            validatingToken: true,
            user: {
              username: localStorage.username,
            },
          },
        }

        const self = this
        axios.post('/api/user/info', {
          token: sessionStorage.token
        })
        .then(function (response) {
          if (response.data.success === true) {
            self.setState ({
              auth: {
                token: sessionStorage.token,
                validToken: true,
                validatingToken: false,
                user: response.data.user,
              },
            })
          }
          else {
            self.setState ({
              auth: {
                token: sessionStorage.token,
                validToken: false,
                validatingToken: false,
                user: {
                  username: localStorage.username,
                },
              },
            })
          }
        })
        .catch(function (error) {
          console.log(error);
          self.state = {
            auth: {
              token: sessionStorage.token,
              validToken: false,
              validatingToken: false,
              user: {
                username: localStorage.username,
              },
            },
          }
        });
      }
      else {
        this.state = {
          auth: {
            token: '',
            validToken: false,
            validatingToken: false,
            user: {
              username: localStorage.username,
            },
          },
        }
      }
    }
    else{
      this.state = {
        auth: {
          token: '',
          validToken: false,
          validatingToken: false,
          user: {},
        },
      }
    }
  }

  render() {
    console.log(this.state);

    return (
      <div className="App">
        <Login auth={this.state.auth} />
        <Profile auth={this.state.auth} />
      </div>
    );
  }
}

export default App;
