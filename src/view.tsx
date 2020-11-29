import React, {useEffect, useState} from 'react'
import {combine} from 'effector'
import {createComponent, useStore} from 'effector-react'
import debounce from 'lodash.debounce'

import 'codemirror/lib/codemirror.css'
import './styles.css'
import './main.css'
import Panel from './components/CodeMirrorPanel'
import Errors from './components/Errors'
import SecondaryTabs from './components/SecondaryTabs'
import Outline from './components/Outline'
import {TypeHintView} from './flow/view'
import {isDesktopChanges, tab} from './tabs/domain'
import {DesktopScreens, SmallScreens, TabsView} from './tabs/view'
import {mode} from './mode/domain'
import {
  changeSources,
  codeCursorActivity,
  codeMarkLine,
  codeSetCursor,
  performLint,
} from './editor'
import {codeError, sourceCode} from './editor/state'

import {stats} from './realm/state'
import Sizer from './components/Sizer'
import {GitHubAuth} from './github/GitHubAuthLink'

export const OutlineView = createComponent({stats}, ({}, {stats}) => (
  <Outline {...stats} />
))

const ErrorsView = createComponent(
  codeError,
  ({}, {isError, error, stackFrames}) => (
    <Errors isError={isError} error={error} stackFrames={stackFrames} />
  ),
)

const $displayOutline = combine(
  tab,
  isDesktopChanges,
  (tab, isDesktop) => isDesktop || tab === 'editor',
)

const changeSourcesDebounced = debounce(changeSources, 500)

const CodeView = createComponent(
  {
    displayEditor: $displayOutline,
    sourceCode,
    mode,
  },
  ({}, {displayEditor, mode, sourceCode}) => {
    const [outlineSidebar, setOutlineSidebar] = useState(null)
    const [consolePanel, setConsolePanel] = useState(null)

    useEffect(() => {
      setOutlineSidebar(document.getElementById('outline-sidebar'))
      setConsolePanel(document.getElementById('console-panel'))
    }, [])

    return (
      <div
        className="sources"
        style={{
          visibility: displayEditor ? 'visible' : 'hidden',
          display: 'flex',
        }}>
        <DesktopScreens>
          <Sizer
            direction="vertical"
            container={outlineSidebar}
            cssVar="--outline-width"
            sign={1}
          />
        </DesktopScreens>

        <div className="sources" style={{flex: '1 0 auto'}}>
          <Panel
            markLine={codeMarkLine}
            setCursor={codeSetCursor}
            performLint={performLint}
            onCursorActivity={codeCursorActivity}
            value={sourceCode}
            mode={mode}
            onChange={changeSourcesDebounced}
            lineWrapping
            passive
          />
          <TypeHintView />
        </div>

        <DesktopScreens>
          <Sizer
            direction="vertical"
            container={consolePanel}
            cssVar="--right-panel-width"
            sign={-1}
          />
        </DesktopScreens>
      </div>
    )
  },
)

export default () => {
  const displayOutline = useStore($displayOutline)
  const _tab = useStore(tab)
  return (
    <>
      {displayOutline && <OutlineView />}
      <CodeView />
      <TabsView />
      <SmallScreens>
        {_tab !== 'share' && _tab !== 'settings' && (
          <>
            <SecondaryTabs />
            <ErrorsView />
          </>
        )}
      </SmallScreens>
      <DesktopScreens>
        <SecondaryTabs />
        <ErrorsView />
      </DesktopScreens>
      <GitHubAuth />
    </>
  )
}
