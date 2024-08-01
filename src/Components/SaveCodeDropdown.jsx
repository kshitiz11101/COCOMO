import React from 'react'
import Select from 'react-select'
import { CustomStyles } from '../Constants/CustomStyles'
const SaveCodeDropdown = ({onSelectChange}) => {
    const options = [
        { value: '', label: 'Select Format' },
        { value: '.docx', label: '.DOCX' },
        { value: '.pdf', label: '.PDF' }
      ];
  return (
    <Select
    placeholder='Select format'
    options={options}
    styles={CustomStyles}
    onChange={(selectedOption) => onSelectChange(selectedOption.value)}
    />
  )
}

export default SaveCodeDropdown
