import React, { Component } from 'react'

export default class MarketToggle extends Component {
  constructor(props, context) {
    super(props, context)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(e) {
    e.preventDefault()

    this.props.onClick(e)
  }

  render() {
    const hrefLink = '#'

    return (
      <a href={hrefLink} onClick={this.handleClick}>
        {this.props.children}
      </a>
    )
  }
}
