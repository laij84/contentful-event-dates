import React, { useLayoutEffect, useReducer, useEffect, useMemo, useCallback } from 'react'
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
import isEqual from 'lodash.isequal'

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

type AppState = {
  dates: EventDate[]
}

function dateComparator(a: EventDate, b: EventDate) {
  return a.startDate.getTime() - b.startDate.getTime()
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'CREATE':
      return {
        dates: [
          ...state.dates,
          {
            id: ids.generate(),
            startDate: addOneDay(state.dates[state.dates.length - 1].startDate),
            endDate: addOneDay(state.dates[state.dates.length - 1].endDate)
          }
        ].sort(dateComparator)
      }
    case 'UPDATE':
      return {
        dates: state.dates
          .map(event => {
            if (action.payload && event.id === action.payload.id) {
              return { ...event, ...action.payload }
            }
            return event
          })
          .sort(dateComparator)
      }
    case 'DELETE':
      return {
        dates: state.dates
          .filter(event => {
            if (action.payload) {
              return event.id !== action.payload.id
            }
            return true
          })
          .sort(dateComparator)
      }
    case 'SET':
      if (isEqual(state, action.payload)) {
        return state
      } 
      return action.payload
    default:
      return state
  }
}

interface SerializedEventDate {
  id: string
  startDate: string
  endDate: string
}

function parseDates({ id, startDate, endDate }: SerializedEventDate): EventDate {
  return {
    id,
    startDate: new Date(startDate),
    endDate: new Date(endDate)
  }
}

function serializeDates({ id, startDate, endDate }: EventDate): SerializedEventDate {
  return {
    id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  }
}

type ContentfulAppState = { dates: SerializedEventDate[] } | null

function parseContentfulAppState(state: ContentfulAppState) {
  if (!state) {
    return { dates: [{ id: ids.generate(), startDate: new Date(), endDate: new Date() }] }
  }

  return {
    dates: state.dates.map(parseDates)
  }
}

export const App: React.FC<AppProps> = ({ sdk }) => {
  const initialState = useMemo((): AppState => parseContentfulAppState(sdk.field.getValue()), [
    sdk.field
  ])

  const [state, dispatch] = useReducer(reducer, initialState)

  const onChange = useCallback(
    async (state: AppState) => {
      if (state) {
        await sdk.field.setValue({ dates: state.dates.map(serializeDates) })
      } else {
        await sdk.field.removeValue()
      }
    },
    [sdk.field]
  )

  useEffect(() => {
    onChange(state)
  }, [onChange, state])

  useEffect(() => {
    const detachExternalChangeHandler = sdk.field.onValueChanged((value: ContentfulAppState) => {
      dispatch({ type: 'SET', payload: parseContentfulAppState(value) })
    })

    return () => {
      detachExternalChangeHandler()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    sdk.window.startAutoResizer()
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
          {state.dates.map((date: EventDate) => (
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
                  disabled={state.dates.length <= 1}
                  onClick={() => {
                    if (state.dates.length > 1) {
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
