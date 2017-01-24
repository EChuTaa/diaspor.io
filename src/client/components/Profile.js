import React from 'react';
import axios from "axios";

export default class Login extends React.Component {
  // constructor(props) {
  //   super(props)
  //   this.state = {
  //     auth: this.props.auth,
  //   }
  // }

  render() {
    if (this.props.auth.validToken) {
      return (
        <div className="profile">
          <h1>Profile</h1>
          <button>Edit account details</button>
          <div>
            <div>
              <h4>Linked accounts</h4>
              <ul>
                <li>Reddit: {this.props.auth.user.linkedAccounts.reddit ? 'linked' : 'not linked'}</li>
                <li>YouTube: {this.props.auth.user.linkedAccounts.youtube ? 'linked' : 'not linked'}</li>
              </ul>
              <button>Link an account</button>
            </div>

            <div>
              <h4>Jobs</h4>
              <button>Create a job</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="profile"></div>
    );
  }
}
