import React from 'react'
import { render } from 'react-dom'
import { FieldExtensionSDK, init } from 'contentful-ui-extensions-sdk'
import { App } from './App'

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
