import React, { useLayoutEffect, useCallback, useReducer, useEffect } from 'react'
import { render } from 'react-dom'
import { Picker } from './components/Picker/Picker'
import ids from 'shortid'
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button
} from '@contentful/forma-36-react-components'
import { init, FieldExtensionSDK } from 'contentful-ui-extensions-sdk'
import '@contentful/forma-36-react-components/dist/styles.css'
import './index.css'

interface EventDate {
  id: string
  startDate: Date
  endDate: Date
}

interface AppProps {
  sdk: FieldExtensionSDK
}

function addOneDay(date: Date): Date {
  const tomorrow = new Date()
  tomorrow.setTime(date.getTime())
  tomorrow.setDate(date.getDate() + 1)
  return tomorrow
}

type Action =
  | { type: 'CREATE' }
  | { type: 'UPDATE'; payload: Partial<EventDate> }
  | { type: 'DELETE'; payload: Partial<EventDate> }
  | { type: 'SET'; payload: AppState }

type AppState = EventDate[]

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE':
      return [
        ...state,
        {
          id: ids.generate(),
          startDate: addOneDay(state[state.length - 1].startDate),
          endDate: addOneDay(state[state.length - 1].endDate)
        }
      ].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    case 'UPDATE':
      return state
        .map(event => {
          if (action.payload && event.id === action.payload.id) {
            return { ...event, ...action.payload }
          }
          return event
        })
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    case 'DELETE':
      return state
        .filter(event => {
          if (action.payload) {
            return event.id !== action.payload.id
          }
          return true
        })
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    case 'SET':
      return action.payload
    default:
      return state
  }
}

function convertToJson(state: AppState): string {
  return JSON.stringify(
    state.map(date => ({
      id: date.id,
      startDate: date.startDate.toISOString(),
      endDate: date.endDate.toISOString()
    }))
  )
}

interface JsonEventDate {
  id: string
  startDate: string
  endDate: string
}

function convertToJs(state: string): AppState {
  return JSON.parse(state).map((date: JsonEventDate) => ({
    id: date.id,
    startDate: new Date(date.startDate),
    endDate: new Date(date.endDate)
  }))
}

const initialState: AppState = [{ id: ids.generate(), startDate: new Date(), endDate: new Date() }]

export const App: React.FC<AppProps> = ({ sdk }) => {
  const [state, dispatch] = useReducer(
    reducer,
    sdk.field.getValue() ? convertToJs(sdk.field.getValue()) : initialState
  )

  useEffect(() => {
    async function onChange() {
      if (state) {
        await sdk.field.setValue(convertToJson(state))
      } else {
        await sdk.field.removeValue()
      }
    }
    onChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const onExternalChange = useCallback(
    (value: string) => dispatch({ type: 'SET', payload: convertToJs(JSON.parse(value)) }),
    []
  )

  // Handler for external field value changes (e.g. when multiple authors are working on the same entry).
  const detachExternalChangeHandler = useCallback(
    () => sdk.field.onValueChanged(onExternalChange),
    [onExternalChange, sdk.field]
  )

  useLayoutEffect(() => {
    sdk.window.startAutoResizer()
    return () => {
      if (detachExternalChangeHandler) {
        detachExternalChangeHandler()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Start Date/Time</TableCell>
            <TableCell>End Date/Time</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {state.map((date: EventDate) => (
            <TableRow key={date.id}>
              <TableCell>
                <Picker
                  onDateChange={(startDate, id) =>
                    dispatch({ type: 'UPDATE', payload: { id, startDate } })
                  }
                  date={date.startDate}
                  id={date.id}
                />
              </TableCell>
              <TableCell>
                <Picker
                  onDateChange={(endDate, id) =>
                    dispatch({ type: 'UPDATE', payload: { id, endDate } })
                  }
                  date={date.endDate}
                  id={date.id}
                />
              </TableCell>
              <TableCell>
                <Button
                  disabled={state.length <= 1}
                  onClick={() => {
                    if (state.length > 1) {
                      dispatch({ type: 'DELETE', payload: { id: date.id } })
                    }
                  }}>
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        onClick={() => {
          dispatch({ type: 'CREATE' })
        }}>
        Add another date
      </Button>
    </>
  )
}

init(sdk => {
  render(<App sdk={sdk as FieldExtensionSDK} />, document.getElementById('root'))
})

/**
 * By default, iframe of the extension is fully reloaded on every save of a source file.
 * If you want to use HMR (hot module reload) instead of full reload, uncomment the following lines
 */
// if (module.hot) {
//   module.hot.accept();
// }
