import React from 'react';
import axios from "axios";

import './Login.css';

export default class Login extends React.Component {
  constructor(props) {
    super(props)
    if (this.props.auth.user.username) {
      this.state = {
        auth: this.props.auth,
        username: this.props.auth.user.username,
        password: '',
        email: '',
        register: false,
        login: false,
        message: '',
        messageStyle: { display: 'none', },
      }
    }
    else {
      this.state = {
        auth: this.props.auth,
        username: '',
        password: '',
        email: '',
        register: false,
        login: false,
        message: '',
        messageStyle: { display: 'none', },
      }
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.userLogin = this.userLogin.bind(this);
    this.userRegister = this.userRegister.bind(this);
    this.back = this.back.bind(this);
  }

  handleInputChange(event) {
    this.setState( { [event.target.id]: event.target.value } );
  }
  userLogin() {
    if(this.state.login){
      const self = this

      axios.post('/api/user/login', {
        username: this.state.username,
        password: this.state.password
      })
      .then(function (response) {
        console.log(response);

        self.setState({password: ''})
        self.setState( { message: response.data.message, messageStyle: { display: 'block', } } )
        sessionStorage.setItem( 'token', response.data.token )
        localStorage.setItem( 'username', response.data.username )

        if (!response.data.err){
          location.reload();
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    else {
      this.setState({login: true, register: false})
    }
  }
  userRegister() {
    console.log('register');
    console.log(this.state.register);
    if(this.state.register){
      const self = this

      axios.post('/api/user/register', {
        username: this.state.username,
        password: this.state.password,
        email: this.state.email,
      })
      .then(function (response) {
        console.log(response);

        self.setState({password: ''})
        self.setState( { message: response.data.message, messageStyle: { display: 'block', } } )
        sessionStorage.setItem( 'token', response.data.token )
        localStorage.setItem( 'username', response.data.username )

        if (!response.data.err){
          location.reload();
        }
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    else {
      this.setState({login: false, register: true})
    }
  }
  back() {
    this.setState({login: false, register: false})
  }
  userLogout() {
    sessionStorage.removeItem( 'token' )
    location.reload();
  }

  render() {
    console.log(this.state);
    // console.log(this.state.login);
    // console.log(this.state.register);

    if (this.props.auth.validatingToken) {
      return (
        <div className="login">
          <img alt="spinner"></img>
        </div>
      )
    }

    if (this.props.auth.validToken) {
      return (
        <div className="login">
          <p>Hi {this.props.auth.user.username}!</p>
          <button onClick={this.userLogout.bind(this)}>Logout</button>
        </div>
      )
    }

    if (this.state.login) {
      return (
        <div className="login">
          <input value={this.state.username} onChange={this.handleInputChange} id='username' placeholder='username' type='text' />
          <input value={this.state.password} onChange={this.handleInputChange} id='password' placeholder='password' type='password' />
          <button onClick={this.userLogin.bind(this)}>Login</button>
          <button onClick={this.back.bind(this)}>Back</button>
        </div>
      )
    }

    if (this.state.register) {
      return (
        <div className="login">
          <input value={this.state.username} onChange={this.handleInputChange} id='username' placeholder='username' type='text' />
          <input value={this.state.password} onChange={this.handleInputChange} id='password' placeholder='password' type='password' />
          <input value={this.state.email}    onChange={this.handleInputChange} id='email'    placeholder='email'    type='text' />
          <button onClick={this.userRegister.bind(this)}>Register</button>
          <button onClick={this.back.bind(this)}>Back</button>
        </div>
      )
    }

    return (
      <div className="login">
        <div className='form'>
          <button onClick={this.userLogin.bind(this)}>Login</button>
          <button onClick={this.userRegister.bind(this)}>Register</button>
        </div>
        <div className='message' style={this.state.messageStyle}>
          <p>{this.state.message}</p>
        </div>
      </div>
    );
  }
}
