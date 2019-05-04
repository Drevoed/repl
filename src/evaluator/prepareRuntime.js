//@flow

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as EffectorReact from 'effector-react'

import {realmInvoke, realmInterval, realmTimeout} from '../domain'
import {consoleMap} from '../logs'

export function prepareRuntime(effector, version) {
  const EvalRealm = effector.createDomain('EvalRealm')
  const api = {}
  assignEffectorRealm(api, EvalRealm, effector)
  assignEffectorReactRealm(api, EvalRealm, EffectorReact)
  assignLibrary(api, effector)
  assignLibrary(api, EffectorReact)
  return {
    React,
    ReactDOM,
    console: consoleMap(),
    setInterval,
    setTimeout,
    __VERSION__: version,
    effector,
    ...api,
  }
}

function setInterval(fn, timeout) {
  const id = global.setInterval(fn, timeout)
  realmInterval(id)
  return id
}

function setTimeout(fn, timeout) {
  const id = global.setTimeout(fn, timeout)
  realmTimeout(id)
  return id
}

function assignLibrary(target, effector) {
  for (const method in effector) {
    if (method in target) continue
    target[method] = effector[method]
  }
  return target
}

function assignEffectorRealm(target, EvalRealm, effector) {
  return apiMap(target, {
    createEvent: effector.createEvent,
    createEffect: effector.createEffect,
    createStore: effector.createStore,
    createStoreObject: effector.createStoreObject,
    createDomain: effector.createDomain,
    createApi: effector.createApi,
    restoreEvent: effector.restoreEvent,
    restoreEffect: effector.restoreEffect,
    restore: effector.restore,
    combine: effector.combine,
    sample: effector.sample,
    //createEvent: EvalRealm.event,
    //createStore: EvalRealm.store,
    //createEffect: EvalRealm.effect,
    //createDomain: EvalRealm.domain,
  })
}

function assignEffectorReactRealm(target, EvalRealm, effector) {
  return apiMap(target, {
    createComponent: effector.createComponent,
  })
}

function apiMap(target, obj) {
  for (const key in obj) {
    target[key] = apiFabric.bind(obj[key], key)
  }
  return target
}

function apiFabric(key, ...args) {
  const instance = this(...args)
  realmInvoke({method: key, instance})
  return instance
}
