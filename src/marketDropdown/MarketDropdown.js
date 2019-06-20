import React, { Component } from 'react'
import Dropdown from 'react-bootstrap/Dropdown'

import MarketToggle from './MarketToggle'
import MarketMenu from './MarketMenu'

class DropDownItem extends Component {
  handleClick = e => {
    this.props.onClick(this.props.value || this.props.displayValue, e)
  }

  render() {
    return (
      <Dropdown.Item active={this.props.active} onClick={this.handleClick}>
        {this.props.displayValue}
      </Dropdown.Item>
    )
  }
}

export default class MarketDropdown extends Component {
  constructor(props, context) {
    super(props, context)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(value, e) {
    e.preventDefault()

    this.props.onClick(value)
  }

  render() {
    return (
      <Dropdown>
        <Dropdown.Toggle as={MarketToggle} id="dropdown-custom-components">
          Toggle
        </Dropdown.Toggle>

        <Dropdown.Menu as={MarketMenu}>
          {this.props.menuItems.map((menuItem, i) => (
            <DropDownItem
              active={menuItem === this.props.activeElement}
              key={`${menuItem.id}${i}`}
              onClick={this.handleClick}
              displayValue={menuItem}
              value={this.props.values ? this.props.values[i] : null}
            />
          ))}
        </Dropdown.Menu>
      </Dropdown>
    )
  }
}
