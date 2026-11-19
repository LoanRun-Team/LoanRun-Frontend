import { createRuntime } from './createRuntime.js'

const runtime=createRuntime({env:import.meta.env||{},storage:globalThis.localStorage})
export const apiMode=runtime.mode
export const isHybrid=apiMode==='hybrid'
// Existing design previews are available wherever some Mock UI is enabled.
export const isMock=apiMode!=='real'
export const services=runtime.services
export const mockServices=runtime.mockServices
export const liveServices=runtime.liveServices
