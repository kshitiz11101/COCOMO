import React from 'react'
import { LanguageOption } from '../Constants/LanguageOption'
import Select from 'react-select';
import {CustomStyles} from '../Constants/CustomStyles'

const LanguageDropdown = ({OnSelectChange}) => {

  return (
  <Select
  placeholder={'Filter by Category'}
  options={LanguageOption}
  styles={CustomStyles}
  defaultValue={LanguageOption[0]}
  onChange={(selectedOption)=>OnSelectChange(selectedOption)}/>
  )
}

export default LanguageDropdown
