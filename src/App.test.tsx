import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { App } from './App'

beforeEach(() => {
  jest.resetAllMocks()
})

const sdk: any = {
  field: {
    getValue: jest.fn(),
    onValueChanged: jest.fn(),
    setValue: jest.fn(),
    removeValue: jest.fn()
  },
  window: {
    startAutoResizer: jest.fn()
  }
}

const contentfulAppState = {
  dates: [{ id: 'test123', startDate: new Date().toISOString(), endDate: new Date().toISOString() }]
}

it('should read a value from field.getValue() and subscribe for external changes', () => {
  sdk.field.getValue.mockImplementation(() => contentfulAppState)
  render(<App sdk={sdk} />)

  expect(sdk.field.getValue).toHaveBeenCalled()
  expect(sdk.field.onValueChanged).toHaveBeenCalled()
})

it('should call starstartAutoResizer', () => {
  render(<App sdk={sdk} />)
  expect(sdk.window.startAutoResizer).toHaveBeenCalled()
})

it('should call setValue when adding a new event date', () => {
  const { getByTestId } = render(<App sdk={sdk} />)

  fireEvent.click(getByTestId('same-day'))

  expect(sdk.field.setValue).toHaveBeenCalled()
})

it('should add another event for the same day', () => {
  const { getAllByTestId, getByTestId } = render(<App sdk={sdk} />)

  fireEvent.click(getByTestId('same-day'))

  expect(getAllByTestId('event-row')).toHaveLength(2)
  expect(getAllByTestId('start-picker')[0].querySelector('input')!.value).toEqual(
    getAllByTestId('start-picker')[1].querySelector('input')!.value
  )
  expect(getAllByTestId('end-picker')[0].querySelector('input')!.value).toEqual(
    getAllByTestId('end-picker')[1].querySelector('input')!.value
  )
})
