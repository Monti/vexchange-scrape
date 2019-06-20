import React, { Component } from 'react'
import Alert from 'react-bootstrap/Alert'

export default class DismissableAlert extends Component {
  render() {
    return (
      <Alert variant={this.props.type} onClose={this.props.onClose} dismissible>
        <Alert.Heading>
          {this.props.type === 'danger'
            ? 'Oh snap! You got an error!'
            : 'Great! The transaction was successful!'}
        </Alert.Heading>
        <p>{this.props.message}</p>
      </Alert>
    )
  }
}
