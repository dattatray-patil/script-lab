import React from 'react'
import { withTheme } from 'styled-components'
import moment from 'moment'

import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox'

import {
  RunnerLastUpdatedWrapper,
  Wrapper,
  NoLogsPlaceholder,
  CheckboxWrapper,
  ClearButton,
  FilterWrapper,
  LogsArea,
  LogsList,
  Log,
} from './styles'

import { setUpMomentJsDurationDefaults } from '../../../utils'
import Only from '../../Only'
import { connect } from 'react-redux'
import { IState as IReduxState } from '../../../store/reducer'
import selectors from '../../../store/selectors'

export enum ConsoleLogTypes {
  Info = 'info',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
}

interface IConsolePropsFromRedux {
  logs: ILogData[]
  runnerLastUpdated: number
  runnerIsAlive: boolean
  engineStatus: ICustomFunctionEngineStatus
}

const mapStateToProps = (state: IReduxState): IConsolePropsFromRedux => ({
  logs: state.customFunctions.logs,
  runnerLastUpdated: state.customFunctions.runner.lastUpdated,
  runnerIsAlive: state.customFunctions.runner.isAlive,
  engineStatus: state.customFunctions.engineStatus,
})

interface IConsole extends IConsolePropsFromRedux {
  theme: ITheme // from withTheme
  clearLogsCallback: () => void
}

interface IState {
  shouldScrollToBottom: boolean
  filterQuery: string
}

class ConsoleWithoutTheme extends React.Component<IConsole, IState> {
  state = { shouldScrollToBottom: true, filterQuery: '' }

  constructor(props: IConsole) {
    super(props)

    setUpMomentJsDurationDefaults(moment)
  }

  componentDidMount() {
    this.scrollToBottom()
  }

  componentDidUpdate() {
    this.scrollToBottom()
  }

  setShouldScrollToBottom = (ev: React.FormEvent<HTMLElement>, checked: boolean) =>
    this.setState({ shouldScrollToBottom: checked })

  updateFilterQuery = () =>
    this.setState({
      filterQuery: (this.refs.filterTextInput as any).value.toLowerCase(),
    })

  scrollToBottom() {
    if (this.state.shouldScrollToBottom) {
      const lastLogRef = this.refs.lastLog as any
      lastLogRef.scrollIntoView()
    }
  }

  render() {
    const {
      theme,
      logs,
      runnerIsAlive,
      runnerLastUpdated,
      engineStatus,
      clearLogsCallback,
    } = this.props

    const runnerLastUpdatedText = runnerIsAlive
      ? moment(new Date(runnerLastUpdated)).fromNow()
      : ''

    return (
      <Wrapper>
        <MessageBar messageBarType={MessageBarType.info}>
          {engineStatus.nativeRuntime
            ? 'Using the native javascript execution engine'
            : 'Using the web execution engine'}
        </MessageBar>
        <Only when={runnerIsAlive}>
          <RunnerLastUpdatedWrapper>
            Runner last updated {runnerLastUpdatedText}
          </RunnerLastUpdatedWrapper>
        </Only>
        {logs.length > 0 ? (
          <>
            <FilterWrapper>
              <ClearButton onClick={clearLogsCallback}>
                <Icon
                  style={{
                    position: 'absolute',
                    top: '0px',
                    bottom: '0px',
                    left: '0px',
                    right: '0px',
                    width: '2rem',
                    height: '2rem',
                    lineHeight: '2rem',
                  }}
                  iconName="Clear"
                />
              </ClearButton>
              <input
                className="ms-font-m"
                type="text"
                placeholder="Filter"
                onChange={this.updateFilterQuery}
                ref="filterTextInput"
                style={{
                  width: '100%',
                  height: '3.2rem',
                  padding: '0.6rem',
                  boxSizing: 'border-box',
                }}
              />
            </FilterWrapper>
            <LogsArea>
              <LogsList>
                {logs
                  .filter(log =>
                    log.message.toLowerCase().includes(this.state.filterQuery),
                  )
                  .map((log, i) => {
                    const { backgroundColor, color, icon } = {
                      [ConsoleLogTypes.Log]: {
                        backgroundColor: theme.white,
                        color: theme.black,
                        icon: null,
                      },
                      [ConsoleLogTypes.Info]: {
                        backgroundColor: '#cce6ff',
                        color: theme.black,
                        icon: { name: 'Info', color: '#002db3' },
                      },
                      [ConsoleLogTypes.Warn]: {
                        backgroundColor: '#fff4ce',
                        color: theme.black,
                        icon: { name: 'Warning', color: 'gold' },
                      },
                      [ConsoleLogTypes.Error]: {
                        backgroundColor: '#fde7e9',
                        color: theme.black,
                        icon: { name: 'Error', color: 'red' },
                      },
                    }[log.severity]
                    return (
                      <Log
                        key={`${log.severity}-${i}`}
                        style={{ backgroundColor, color }}
                      >
                        {icon && (
                          <Icon
                            className="ms-font-m"
                            iconName={icon.name}
                            style={{
                              fontSize: '1.6rem',
                              color: icon.color,
                              marginRight: '0.5rem',
                            }}
                          />
                        )}
                        {log.message}
                      </Log>
                    )
                  })}
              </LogsList>
              <div ref="lastLog" />
            </LogsArea>
            <CheckboxWrapper>
              <Checkbox
                label="Auto-scroll"
                defaultChecked={true}
                onChange={this.setShouldScrollToBottom}
              />
            </CheckboxWrapper>
          </>
        ) : (
          <NoLogsPlaceholder>
            engineStatus.nativeRuntime ? (
            <>
              Currently, the native javascript execution engine does not support console
              logging from within Script Lab. Sorry about that!
            </>
            ) : (
            <>
              There are no logs to display. Use{' '}
              <pre
                style={{
                  fontFamily: 'Consolas, monaco, monospace',
                  fontWeight: 'bold',
                  display: 'inline',
                }}
              >
                console.log()
              </pre>{' '}
              inside your functions to display logs here.
            </>
            )
          </NoLogsPlaceholder>
        )}
      </Wrapper>
    )
  }
}

export const Console = withTheme(ConsoleWithoutTheme)

export default connect(mapStateToProps)(Console)
