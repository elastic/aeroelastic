/**
 * `require()` bindings (now just <script>s, to reduce build time while prototyping)
 */

const {render, h} = ultradom

const shallowEqual = (a, b) => {
  if(a === b) return true
  if(a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) {
    if(a[i] !== b[i]) return false
  }
  return true
}

const reduce = (fun, previousValue) => (...inputs) => {
  // last-value memoizing version of this single line function:
  // const reduce = (fun, previousValue) => (...inputs) => state => previousValue = fun(previousValue, ...inputs.map(input => input(state)))
  let argumentValues = []
  let value = previousValue
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return value
    }
    return value = fun(value, ...argumentValues)
  }
}

const map = fun => (...inputs) => {
  // last-value memoizing version of this single line function:
  // const map = fun => (...inputs) => state => fun(...inputs.map(input => input(state)))
  let argumentValues = []
  let value
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return value
    }
    return value = fun(...argumentValues)
  }
}

const each = fun => (...inputs) => {
  // last-value memoizing version of this single line function:
  //const each = fun => (...inputs) => state => {fun(...inputs.map(input => input(state)))}
  let argumentValues = []
  return state => {
    if(shallowEqual(argumentValues, argumentValues = inputs.map(input => input(state)))) {
      return
    }
    fun(...argumentValues)
  }
}

const consoleLog = map(value => {
  console.log(value)
  return value
})

/**
 * Mock config
 */

const metaCursorRadius = 15
const metaCursorZ = 1000
const dragLineZ = metaCursorZ - 1 // just beneath the metaCursor
const toolbarZ = dragLineZ - 1 // toolbar just beneath the cursor scenegraph
const freeDragZ = toolbarZ - 1 // just beneath the cursor + toolbar scenegraph
const toolbarY = -50
const toolbarHeight = 32
const toolbarPad = 8
const paddedToolbarHeight = toolbarHeight + toolbarPad
const dragLineColor = 'rgba(255,0,255,0.5)'
const cornerHotspotSize = 6
const edgeHotspotSize = 12
const devColor = 'magenta'
const pad = 10
const gridPitch = 1
const snapEngageDistance = 18
const snapReleaseDistance = 2 * snapEngageDistance // hysteresis: make it harder to break the bond
const enforceAlignment = true // whether snap lines enforce all elements to anchor left/center/right etc. or only preexisting ones


/**
 * Mock assets
 */

const horizontalCenterIcon = 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIEdlbmVyYXRvcjogSWNvTW9vbi5pbyAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiDQogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSINCiAgIGlkPSJzdmcyIg0KICAgZGF0YS10YWdzPSJyZW1vdmUtY2lyY2xlLCBjYW5jZWwsIGNsb3NlLCByZW1vdmUsIGRlbGV0ZSINCiAgIGhlaWdodD0iMTIwMCINCiAgIHZpZXdCb3g9IjAgMCAxMjAwIDEyMDAiDQogICB3aWR0aD0iMTIwMCINCiAgIHZlcnNpb249IjEuMSINCiAgIGRhdGEtZHU9Iu+BnCINCiAgIGlua3NjYXBlOnZlcnNpb249IjAuNDguNCByOTkzOSINCiAgIHNvZGlwb2RpOmRvY25hbWU9ImFsaWduLWNlbnRlci5zdmciPg0KICA8ZGVmcw0KICAgICBpZD0iZGVmczMwNzciIC8+DQogIDxzb2RpcG9kaTpuYW1lZHZpZXcNCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIg0KICAgICBib3JkZXJjb2xvcj0iIzY2NjY2NiINCiAgICAgYm9yZGVyb3BhY2l0eT0iMSINCiAgICAgb2JqZWN0dG9sZXJhbmNlPSIxMCINCiAgICAgZ3JpZHRvbGVyYW5jZT0iMTAiDQogICAgIGd1aWRldG9sZXJhbmNlPSIxMCINCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAiDQogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiDQogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTUzNSINCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iODc2Ig0KICAgICBpZD0ibmFtZWR2aWV3MzA3NSINCiAgICAgc2hvd2dyaWQ9ImZhbHNlIg0KICAgICBpbmtzY2FwZTp6b29tPSIwLjI2MzM5Mjg2Ig0KICAgICBpbmtzY2FwZTpjeD0iLTY3Ljc5NjYwNiINCiAgICAgaW5rc2NhcGU6Y3k9IjU5OS44NjQ0MSINCiAgICAgaW5rc2NhcGU6d2luZG93LXg9IjY1Ig0KICAgICBpbmtzY2FwZTp3aW5kb3cteT0iMjQiDQogICAgIGlua3NjYXBlOndpbmRvdy1tYXhpbWl6ZWQ9IjEiDQogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9InN2ZzIiIC8+DQogIDxtZXRhZGF0YQ0KICAgICBpZD0ibWV0YWRhdGE2MiI+DQogICAgPHJkZjpSREY+DQogICAgICA8Y2M6V29yaw0KICAgICAgICAgcmRmOmFib3V0PSIiPg0KICAgICAgICA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4NCiAgICAgICAgPGRjOnR5cGUNCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4NCiAgICAgICAgPGRjOnRpdGxlIC8+DQogICAgICA8L2NjOldvcms+DQogICAgPC9yZGY6UkRGPg0KICA8L21ldGFkYXRhPg0KICA8cGF0aA0KICAgICBzdHlsZT0iZm9udC1zaXplOjEzNTMuOTAxOTc3NTRweDtmb250LXN0eWxlOml0YWxpYztsZXR0ZXItc3BhY2luZzowO3dvcmQtc3BhY2luZzowO2ZvbnQtZmFtaWx5OlNlcmlmIg0KICAgICBpZD0icGF0aDMzNDMiDQogICAgIGQ9Im0gMjkwLjYyNSw5OS4yMDIwMzkgMCwxNzguMDA2MTIxIDYxOC43NSwwIDAsLTE3OC4wMDYxMjEgLTYxOC43NSwwIHogbSAtMTY0LjA2MjUsMjc0LjUyOTk0MSAwLDE3OC4wMDYxIDk0Ni44NzUsMCAwLC0xNzguMDA2MSAtOTQ2Ljg3NSwwIHogbSAxMDcuODEyNSwyNzQuNTI5OTIgMCwxNzguMDA2MTEgNzMxLjI1LDAgMCwtMTc4LjAwNjExIC03MzEuMjUsMCB6IE0gMCw5MjIuNzkxODIgMCwxMTAwLjc5OCBsIDEyMDAsMCAwLC0xNzguMDA2MTggLTEyMDAsMCB6Ig0KICAgICBpbmtzY2FwZTpjb25uZWN0b3ItY3VydmF0dXJlPSIwIiAvPg0KPC9zdmc+DQo=")'
const horizontalLeftIcon = 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIEdlbmVyYXRvcjogSWNvTW9vbi5pbyAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiDQogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSINCiAgIGlkPSJzdmcyIg0KICAgZGF0YS10YWdzPSJyZW1vdmUtY2lyY2xlLCBjYW5jZWwsIGNsb3NlLCByZW1vdmUsIGRlbGV0ZSINCiAgIGhlaWdodD0iMTIwMCINCiAgIHZpZXdCb3g9IjAgMCAxMjAwIDEyMDAiDQogICB3aWR0aD0iMTIwMCINCiAgIHZlcnNpb249IjEuMSINCiAgIGRhdGEtZHU9Iu+BnCINCiAgIGlua3NjYXBlOnZlcnNpb249IjAuNDguNCByOTkzOSINCiAgIHNvZGlwb2RpOmRvY25hbWU9ImFsaWduLWxlZnQuc3ZnIj4NCiAgPGRlZnMNCiAgICAgaWQ9ImRlZnMzMTQ1IiAvPg0KICA8c29kaXBvZGk6bmFtZWR2aWV3DQogICAgIHBhZ2Vjb2xvcj0iI2ZmZmZmZiINCiAgICAgYm9yZGVyY29sb3I9IiM2NjY2NjYiDQogICAgIGJvcmRlcm9wYWNpdHk9IjEiDQogICAgIG9iamVjdHRvbGVyYW5jZT0iMTAiDQogICAgIGdyaWR0b2xlcmFuY2U9IjEwIg0KICAgICBndWlkZXRvbGVyYW5jZT0iMTAiDQogICAgIGlua3NjYXBlOnBhZ2VvcGFjaXR5PSIwIg0KICAgICBpbmtzY2FwZTpwYWdlc2hhZG93PSIyIg0KICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjE1MzUiDQogICAgIGlua3NjYXBlOndpbmRvdy1oZWlnaHQ9Ijg0OCINCiAgICAgaWQ9Im5hbWVkdmlldzMxNDMiDQogICAgIHNob3dncmlkPSJmYWxzZSINCiAgICAgaW5rc2NhcGU6em9vbT0iMC4yNjMzOTI4NiINCiAgICAgaW5rc2NhcGU6Y3g9Ii02Ny43OTY2MDYiDQogICAgIGlua3NjYXBlOmN5PSI0NDgiDQogICAgIGlua3NjYXBlOndpbmRvdy14PSI2NSINCiAgICAgaW5rc2NhcGU6d2luZG93LXk9IjI0Ig0KICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIg0KICAgICBpbmtzY2FwZTpjdXJyZW50LWxheWVyPSJzdmcyIiAvPg0KICA8bWV0YWRhdGENCiAgICAgaWQ9Im1ldGFkYXRhNjIiPg0KICAgIDxyZGY6UkRGPg0KICAgICAgPGNjOldvcmsNCiAgICAgICAgIHJkZjphYm91dD0iIj4NCiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+DQogICAgICAgIDxkYzp0eXBlDQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+DQogICAgICAgIDxkYzp0aXRsZSAvPg0KICAgICAgPC9jYzpXb3JrPg0KICAgIDwvcmRmOlJERj4NCiAgPC9tZXRhZGF0YT4NCiAgPHBhdGgNCiAgICAgc3R5bGU9ImZvbnQtc2l6ZToxMzUzLjkwMTk3NzU0cHg7Zm9udC1zdHlsZTppdGFsaWM7bGV0dGVyLXNwYWNpbmc6MDt3b3JkLXNwYWNpbmc6MDtmb250LWZhbWlseTpTZXJpZiINCiAgICAgaWQ9InBhdGgzNDQzIg0KICAgICBkPSJtIDYxOC43NSw5OS4yMDIwMzkgMCwxNzguMDA2MTIxIC02MTguNzUsMCAwLC0xNzguMDA2MTIxIDYxOC43NSwwIHogbSAzMjguMTI1LDI3NC41Mjk5NDEgMCwxNzguMDA2MSAtOTQ2Ljg3NSwwIDAsLTE3OC4wMDYxIDk0Ni44NzUsMCB6IE0gNzMxLjI1LDY0OC4yNjE5IGwgMCwxNzguMDA2MTEgLTczMS4yNSwwIDAsLTE3OC4wMDYxMSA3MzEuMjUsMCB6IG0gNDY4Ljc1LDI3NC41Mjk5MiAwLDE3OC4wMDYxOCAtMTIwMCwwIDAsLTE3OC4wMDYxOCAxMjAwLDAgeiINCiAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIgLz4NCjwvc3ZnPg0K")'
const horizontalRightIcon = 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+DQo8IS0tIEdlbmVyYXRvcjogSWNvTW9vbi5pbyAtLT4NCg0KPHN2Zw0KICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIg0KICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyINCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyINCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciDQogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiDQogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSINCiAgIGlkPSJzdmcyIg0KICAgZGF0YS10YWdzPSJyZW1vdmUtY2lyY2xlLCBjYW5jZWwsIGNsb3NlLCByZW1vdmUsIGRlbGV0ZSINCiAgIGhlaWdodD0iMTIwMCINCiAgIHZpZXdCb3g9IjAgMCAxMjAwIDEyMDAiDQogICB3aWR0aD0iMTIwMCINCiAgIHZlcnNpb249IjEuMSINCiAgIGRhdGEtZHU9Iu+BnCINCiAgIGlua3NjYXBlOnZlcnNpb249IjAuNDguNCByOTkzOSINCiAgIHNvZGlwb2RpOmRvY25hbWU9ImFsaWduLXJpZ2h0LnN2ZyI+DQogIDxkZWZzDQogICAgIGlkPSJkZWZzMzE3OSIgLz4NCiAgPHNvZGlwb2RpOm5hbWVkdmlldw0KICAgICBwYWdlY29sb3I9IiNmZmZmZmYiDQogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2Ig0KICAgICBib3JkZXJvcGFjaXR5PSIxIg0KICAgICBvYmplY3R0b2xlcmFuY2U9IjEwIg0KICAgICBncmlkdG9sZXJhbmNlPSIxMCINCiAgICAgZ3VpZGV0b2xlcmFuY2U9IjEwIg0KICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMCINCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiINCiAgICAgaW5rc2NhcGU6d2luZG93LXdpZHRoPSIxNTM1Ig0KICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI4NDgiDQogICAgIGlkPSJuYW1lZHZpZXczMTc3Ig0KICAgICBzaG93Z3JpZD0iZmFsc2UiDQogICAgIGlua3NjYXBlOnpvb209IjAuMjYzMzkyODYiDQogICAgIGlua3NjYXBlOmN4PSItNjcuNzk2NjA2Ig0KICAgICBpbmtzY2FwZTpjeT0iNDQ4Ig0KICAgICBpbmtzY2FwZTp3aW5kb3cteD0iNjUiDQogICAgIGlua3NjYXBlOndpbmRvdy15PSIyNCINCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSINCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ic3ZnMiIgLz4NCiAgPG1ldGFkYXRhDQogICAgIGlkPSJtZXRhZGF0YTYyIj4NCiAgICA8cmRmOlJERj4NCiAgICAgIDxjYzpXb3JrDQogICAgICAgICByZGY6YWJvdXQ9IiI+DQogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0Pg0KICAgICAgICA8ZGM6dHlwZQ0KICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPg0KICAgICAgICA8ZGM6dGl0bGUgLz4NCiAgICAgIDwvY2M6V29yaz4NCiAgICA8L3JkZjpSREY+DQogIDwvbWV0YWRhdGE+DQogIDxwYXRoDQogICAgIGlua3NjYXBlOmNvbm5lY3Rvci1jdXJ2YXR1cmU9IjAiDQogICAgIGQ9Im0gNTgxLjI1LDk5LjIwMjAzOSAwLDE3OC4wMDYxMjEgNjE4Ljc1LDAgMCwtMTc4LjAwNjEyMSAtNjE4Ljc1LDAgeiBtIC0zMjguMTI1LDI3NC41Mjk5NDEgMCwxNzguMDA2MSA5NDYuODc1LDAgMCwtMTc4LjAwNjEgLTk0Ni44NzUsMCB6IG0gMjE1LjYyNSwyNzQuNTI5OTIgMCwxNzguMDA2MTEgNzMxLjI1LDAgMCwtMTc4LjAwNjExIC03MzEuMjUsMCB6IE0gMCw5MjIuNzkxODIgMCwxMTAwLjc5OCBsIDEyMDAsMCAwLC0xNzguMDA2MTggLTEyMDAsMCB6Ig0KICAgICBpZD0icGF0aDM0OTEiIC8+DQo8L3N2Zz4NCg==")'
const cancelIcon = 'url("data:image/svg+xml;base64,PHN2ZyB2aWV3UG9ydD0iMCAwIDEyIDEyIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZlcnNpb249IjEuMSINCiAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4NCiAgICA8bGluZSB4MT0iMSIgeTE9IjExIiANCiAgICAgICAgICB4Mj0iMTEiIHkyPSIxIiANCiAgICAgICAgICBzdHJva2U9ImJsYWNrIiANCiAgICAgICAgICBzdHJva2Utd2lkdGg9IjIiLz4NCiAgICA8bGluZSB4MT0iMSIgeTE9IjEiIA0KICAgICAgICAgIHgyPSIxMSIgeTI9IjExIiANCiAgICAgICAgICBzdHJva2U9ImJsYWNrIiANCiAgICAgICAgICBzdHJva2Utd2lkdGg9IjIiLz4NCjwvc3ZnPg==")'
const pattern1 = 'url("data:image/png;base64,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")'
const pattern2 = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAZCAYAAADE6YVjAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAklJREFUeNqEVtlqVEEQ7a7bk0UFF4y+KBiXV8Fn/9rv8MEvSAgoKEIiuMTMnem2KpwKZyo1Y8PhzvRSe53uOsZ4VUoZwKRYK2rZHL4uYa4n+xutV59Y0+EVFgb+V9o8SJAL31fch3E2/iiuyKDrb8MGFsqCefi+FYx7rnhIClzGpeKz4qefqRqu17CsBDdHsF6g4EDxBt85KOBwnSrO7b9QTHsiVCiUHfteKhaKZYiA75thzAvFPZMvSVLZi0oKzZgjxV0IGQTP0SCD7cwztnaQpZxc9s72PYICDhF7w+GeYdChUD4kJJo9WyNEeyQkFkYJnvs45HgP+h2TWZOeqVv66ZbiBq09KeM4eqj/8R8FLmctlAvZocDL9yqEIttbEF437FKSUGwLj+EbNV/dETZBDi9cyUgoY5Bn3GR26DsKoAePprDXvP5i8y2pqonqXkJp2toZ5h5TWLjX9sBhJyjjyWjleAspZgRZyQDjrSdWorS+grdfucFbsGQbSfawNkHYD8ho2D9Tt0skMwn134NHzAqubEFzy5D0iWU16ug5dOwiNKiEyuuBlmpo5JtoNMTRFt+C0Owe+KT4TYoip3FIe1BUIw9a4p/q973iHdxuiPUHuqB6YAZJSFISg2463pj1GGU34/sAc3PCVyUpFgmKN66LlvAPu+yYyAsuCH949F3hEpTiCbjfGukO5s5wxdbkOpAgbApFsuF1w4vjo+IvEv8LiV8SfdTkxRIfGJJcXtdnveMH3XgdVSXJWyuWaEneYreu8H8CDACRPfht+odEKwAAAABJRU5ErkJggg==")'
const pattern3 = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC")'


/**
 * Mock scenegraph
 */

const root = document.body

const initialShapes = [
  {key: 'line1', type: 'line', x: 200, y: 150, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line2', type: 'line', x: 200, y: 650, width: 1400, height: 0, z: 5, rotation: 0, color: 'grey'},
  {key: 'line3', type: 'line', x: 80,  y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'line4', type: 'line', x: 700, y: 100, width: 0, height: 900, z: 5, rotation: 0, color: 'grey'},
  {key: 'rect1', type: 'rectangle', x: 300, y: 200, rotation: 0, width: 250, height: 180, z: 5, backgroundColor: '#b3e2cd', backgroundImage: pattern1},
  {key: 'rect2', type: 'rectangle', x: 600, y: 350, rotation: 0, width: 300, height: 220, z: 6, backgroundColor: '#fdcdac', backgroundImage: pattern2},
  {key: 'rect3', type: 'rectangle', x: 800, y: 250, rotation: 0, width: 200, height: 150, z: 7, backgroundColor: '#cbd5e8'},
  {key: 'rect4', type: 'rectangle', x: 100, y: 250, rotation: 0, width: 250, height: 150, z: 8, backgroundColor: '#f4cae4'},
  {key: 'rect5', type: 'rectangle', x: 900, y: 100, rotation: 0, width: 325, height: 200, z: 9, backgroundColor: '#e6f5c9', backgroundImage: pattern3},
]

const state = {
  shapeAdditions: initialShapes,
  primaryActions: null
}



/**
 * PoC action dispatch
 */

const dispatch = (actionType, payload) => {
  const s = {
    shapeAdditions: initialShapes,
    primaryActions: {actionType, payload}
  }
  renderScene(s)
}

const dispatchAsync = (actionType, payload) => setTimeout(() => {
  const s = {
    shapeAdditions: initialShapes,
    primaryActions: {actionType, payload}
  }
  renderScene(s)
})


/**
 * Input cells
 */

const shapeAdditions = state => state.shapeAdditions
const primaryActions = state => state.primaryActions


/**
 * Pure functions: fragment makers (PoC: React DOM fragments)
 */

// renders a shape including its (not yet factored out) control points, so it's not quite DRY compliant atm :-)
const renderShapeFrags = (shapes, hoveredShape, dragStartAt, selectedShapeKey) => shapes.map(shape => {
  const dragged = shape.key === (dragStartAt && dragStartAt.dragStartShape && dragStartAt.dragStartShape.key)
  const selected = shape.key === selectedShapeKey

  const alignLeft = event => dispatch('align', {event: 'alignLeft', shapeKey: shape.key})
  const alignCenter = event => dispatch('align', {event: 'alignCenter', shapeKey: shape.key})
  const alignRight = event => dispatch('align', {event: 'alignRight', shapeKey: shape.key})
  const alignRemove = event => dispatch('align', {event: 'alignRemove', shapeKey: shape.key})

  return h('div', {
    class: dragged ? 'draggable' : null,
    style: {
      transform: `translate3d(${shape.x}px, ${shape.y}px, ${shape.z}px) rotateZ(${shape.rotation}deg)`,
    }
  }, [
    h('div', {
      class: shape.type,
      style: {
        width: shape.width + 'px',
        height: shape.height + 'px',
        backgroundColor: shape.backgroundColor,
        backgroundImage: shape.backgroundImage,
        outline: dragged ? `1px solid ${devColor}` : (shape.type === 'line' ? '1px solid rgba(0,0,0,0.2)' : null),
        opacity: shape.key === (hoveredShape && hoveredShape.key) ? 0.8 : 0.5
      }
    }),
    h('div', {
      class: 'rotateHotspot circle',
      style: { width: (cornerHotspotSize * 3) + 'px', height: (cornerHotspotSize * 3) + 'px', transform: `translate(${shape.width / 2 + 2 * cornerHotspotSize}px, ${- 4 * cornerHotspotSize}px)` }
    }),
    h('div', {
      class: 'hotspot corner rectangle topLeft',
      style: { width: cornerHotspotSize + 'px', height: cornerHotspotSize + 'px', transform: `translate(0, 0)` }
    }),
    h('div', {
      class: 'hotspot corner rectangle topRight',
      style: { width: cornerHotspotSize + 'px', height: cornerHotspotSize + 'px', transform: `translate(${shape.width - cornerHotspotSize}px, 0)` }
    }),
    h('div', {
      class: 'hotspot corner rectangle bottomLeft',
      style: { width: cornerHotspotSize + 'px', height: cornerHotspotSize + 'px', transform: `translate(0, ${shape.height - cornerHotspotSize}px)` }
    }),
    h('div', {
      class: 'hotspot corner rectangle bottomRight',
      style: { width: cornerHotspotSize + 'px', height: cornerHotspotSize + 'px', transform: `translate(${shape.width - cornerHotspotSize}px, ${shape.height - cornerHotspotSize}px)` }
    }),
    h('div', {
      class: `hotspot rectangle side top ${shape.yConstraintAnchor === 'top' ? 'snapped' : ''}`,
      style: { width: edgeHotspotSize + 'px', height: '0', transform: `translate(${shape.width / 2 - edgeHotspotSize / 2}px, 0)` }
    }),
    h('div', {
      class: `hotspot rectangle side right ${shape.xConstraintAnchor === 'right' ? 'snapped' : ''}`,
      style: { width: '0', height: edgeHotspotSize + 'px', transform: `translate(${shape.width}px, ${shape.height / 2 - edgeHotspotSize / 2}px)` }
    }),
    h('div', {
      class: `hotspot rectangle side bottom ${shape.yConstraintAnchor === 'bottom' ? 'snapped' : ''}`,
      style: { width: edgeHotspotSize + 'px', height: '0', transform: `translate(${shape.width / 2 - edgeHotspotSize / 2}px, ${shape.height}px)` }
    }),
    h('div', {
      class: `hotspot rectangle side left ${shape.xConstraintAnchor === 'left' ? 'snapped' : ''}`,
      style: { width: '0', height: edgeHotspotSize + 'px', transform: `translate(0, ${shape.height / 2 - edgeHotspotSize / 2}px)` }
    }),
    h('div', {
      class: `hotspot rectangle center vertical ${shape.xConstraintAnchor === 'center' ? 'snapped' : ''}`,
      style: { width: '0', height: edgeHotspotSize + 'px', transform: `translate3d(${shape.width / 2}px, ${shape.height / 2 - edgeHotspotSize / 2}px, 0.01px)` }
    }),
    h('div', {
      class: `hotspot rectangle center horizontal ${shape.yConstraintAnchor === 'middle' ? 'snapped' : ''}`,
      style: { width: edgeHotspotSize + 'px', height: '0', transform: `translate3d(${shape.width / 2 - edgeHotspotSize / 2}px, ${shape.height / 2}px, ${shape.xConstraintAnchor === 'center' ? 0 : 0.02}px)` }
    }),
    ...(selected ? [
      h('div', {
        class: 'hotspot rectangle center',
        onclick: alignRight,
        style: { opacity: 0.27, outline: 'none', width: toolbarHeight + 'px', height: toolbarHeight + 'px', transform: `translate3d(${shape.width + 2 * cornerHotspotSize + 0 * paddedToolbarHeight}px, ${toolbarY}px, ${toolbarZ}px)`, backgroundImage: horizontalRightIcon, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }
      }),
      h('div', {
        class: 'hotspot rectangle center',
        onclick: alignCenter,
        style: { opacity: 0.27, outline: 'none', width: toolbarHeight + 'px', height: toolbarHeight + 'px', transform: `translate3d(${shape.width + 2 * cornerHotspotSize + 1 * paddedToolbarHeight}px, ${toolbarY}px, ${toolbarZ}px)`, backgroundImage: horizontalCenterIcon, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }
      }),
      h('div', {
        class: 'hotspot rectangle center',
        onclick: alignLeft,
        style: { opacity: 0.27, outline: 'none', width: toolbarHeight + 'px', height: toolbarHeight + 'px', transform: `translate3d(${shape.width + 2 * cornerHotspotSize + 2 * paddedToolbarHeight}px, ${toolbarY}px, ${toolbarZ}px)`, backgroundImage: horizontalLeftIcon, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }
      }),
      h('div', {
        class: 'hotspot rectangle center',
        onclick: alignRemove,
        style: { opacity: 0.27, outline: 'none', width: toolbarHeight + 'px', height: toolbarHeight + 'px', transform: `translate3d(${shape.width + 2 * cornerHotspotSize + 3 * paddedToolbarHeight}px, ${toolbarY}px, ${toolbarZ}px)`, backgroundImage: cancelIcon, backgroundSize: `${toolbarHeight}px ${toolbarHeight}px`, backgroundRepeat: 'no-repeat' }
      })
    ] : [])
  ])
})

// magenta debug cursor
const renderMetaCursorFrag = (x, y, shapeDragInProcess, metaCursorThickness, metaCursorColor) => h('div', {
  class: 'circle metaCursor',
  style: {
    width: (metaCursorRadius * 2) + 'px',
    height: (metaCursorRadius * 2) + 'px',
    transform: `translate3d(${x - metaCursorRadius}px, ${y - metaCursorRadius}px, ${metaCursorZ}px)`,
    border: `${metaCursorThickness}px solid ${metaCursorColor}`,
    boxShadow: `0 0 0.5px 0 ${metaCursorColor} inset, 0 0 2px 0 white`,
  }
})

// magenta debug drag disks and drag line
const renderDragLineFrag = (dragLineLength, x, y, angle) => h('div', {
  style: {
    transform: `translate3d(${x}px, ${y}px, ${dragLineZ}px) rotateZ(${angle}deg)`,
  }
}, [
  h('div', {
    class: 'line',
    style: {
      width: Math.max(0, dragLineLength - metaCursorRadius) + 'px',
      height: '0',
      border: `1px solid ${dragLineColor}`,
      boxShadow: `0 0 1px 0 white inset, 0 0 1px 0 white`,
    }
  }),
  h('div', {
    class: 'circle metaCursor',
    style: {
      width: (dragLineLength ? metaCursorRadius : 0) + 'px',
      height: (dragLineLength ? metaCursorRadius : 0) + 'px',
      transform: `translate3d(${-metaCursorRadius / 2}px, ${-metaCursorRadius / 2}px, ${metaCursorZ}px)`,
      backgroundColor: devColor,
      boxShadow: `0 0 0.5px 0 ${devColor} inset, 0 0 2px 0 white`,
    }
  })
])

// the substrate is responsible for the PoC event capture, and doubles as the parent DIV of everything else
const renderSubstrateFrag = (shapeFrags, freeShapeFrags, metaCursorFrag, dragLineFrag) => h('div', {
    id: 'root',
    onmousemove: event => dispatch('cursorPosition', {x: event.clientX, y: event.clientY}),
    onmouseup: event => dispatch('mouseEvent', {event: 'mouseUp', x: event.clientX, y: event.clientY}),
    onmousedown: event => dispatch('mouseEvent', {event: 'mouseDown', x: event.clientX, y: event.clientY}),
    onclick: event => dispatch('mouseEvent', {event: 'mouseClick', x: event.clientX, y: event.clientY}),
  },
  shapeFrags.concat(freeShapeFrags).concat([metaCursorFrag, dragLineFrag])
)

/**
 * Pure calculations
 */

const vectorLength = (x, y) =>  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))

// map x0, y0, x1, y1 to deltas, length and angle
const positionsToLineAttribsViewer = (x0, y0, x1, y1) => {
  const deltaX = x1 - x0
  const deltaY = y1 - y0
  const length = vectorLength(deltaX, deltaY)
  const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
  return {length, angle, deltaX, deltaY}
}

// set of shapes under a specific point
const shapesAtPoint = (shapes, x, y) => shapes.filter(shape => {
  return shape.x - pad <= x && x <= shape.x + shape.width + pad && shape.y - pad <= y && y < shape.y + shape.height + pad
})

// pick top shape out of possibly several shapes (presumably under the same point)
const topShape = shapes => shapes.reduce((prev, next) => {
  return prev.z > next.z ? prev : next
}, {z: -Infinity})

// returns the shape - closest to the reader in the Z-stack - that the reader hovers over with the mouse
const hoveringAt = (shapes, x, y) => {
  const hoveredShapes = shapesAtPoint(shapes, x, y)
  return topShape(hoveredShapes)
}

const snapToGrid = x => gridPitch * Math.round(x / gridPitch)
const snapToGridUp = x => gridPitch * Math.ceil(x / gridPitch)
const isHorizontal = line => line.height === 0
const isVertical = line => line.width === 0
const isHorizontalDirection = direction => direction === 'horizontal'
const isLine = shape => shape.type === 'line'
const allLines = shapes => shapes.filter(isLine)

const anchorOrigin = (shape, anchor) => shape[({top: 'unconstrainedY', middle: 'unconstrainedY', bottom: 'unconstrainedY', left: 'unconstrainedX', center: 'unconstrainedX', right: 'unconstrainedX'})[anchor]]
const anchorOffset = (shape, anchor) => ({top: 0, middle: shape.height / 2, bottom: shape.height, left: 0, center: shape.width / 2, right: shape.width})[anchor]
const anchorValue = (shape, anchor) => anchorOrigin(shape, anchor) + anchorOffset(shape, anchor)

// lower bound of the (actual, eg. snapped) extent for a specific dimension
const low = (shape, direction) => direction === 'horizontal' ? shape.y : shape.x

// lower bound of the unconstrained extent for a specific dimension
const unconstrainedLow = (shape, direction) => direction === 'horizontal' ? shape.unconstrainedY : shape.unconstrainedX

// size of the shape across a specific dimension
const shapeExtent = (shape, direction) => direction === 'horizontal' ? shape.height : shape.width

// upper bound of the (actual, eg. snapped) extent for a specific dimension
const high = (shape, direction) => low(shape, direction) + shapeExtent(shape, direction)

// half-size of a shape for a specific dimension
const shapeExtentMid = (shape, direction) => shapeExtent(shape, direction) / 2

// midpoint of a shape (in terms of its unconstrained location) for a specific dimension
const unconstrainedMidPoint = (shape, direction) => unconstrainedLow(shape, direction) + shapeExtentMid(shape, direction) // currently the center/middle points attach, not yet the corners

// is the point within the extent?
const withinBounds = (low, high, point) => low <= point && point <= high

// clamp the value to the range determined by the interval bounds [low ... high]
const clamp = (low, high, value) => Math.max(low, Math.min(high, value))

// common values for subsequent calculations
const sectionOvershootDescriptor = (direction, free, fixed) => {
  const freePoint = unconstrainedMidPoint(free, direction)
  const setLo = low(fixed, direction)
  const setHi = high(fixed, direction)
  const loHiConstrained = clamp(setLo, setHi, freePoint)
  // calculate which vertex (section end) is breached by freePoint; NaN if not breached
  const nearerSectionVertex = loHiConstrained === freePoint ? NaN : loHiConstrained
  return {freePoint, setLo, setHi, nearerSectionVertex}
}

// returns zero if the free point is within the section (projected to the specified dimension), or otherwise the overshoot relative to the closer section endpoint
const sectionOvershoot = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  // negative if undershoot; positive if overshoot; zero if within section
  return withinBounds(setLo, setHi, freePoint) ? 0 : freePoint - nearerSectionVertex
}

// returns the free point if it's within the section (projected to the specified dimension), or otherwise the closer section endpoint
const sectionConstrained = (direction, free, fixed) => {
  const {freePoint, setLo, setHi, nearerSectionVertex} = sectionOvershootDescriptor(direction, free, fixed)
  return withinBounds(setLo, setHi, freePoint) ? freePoint : nearerSectionVertex
}

// returns the snap line and the attracted anchor of draggedShape for the closest snap line, provided it's close enough for snapping
const snappingGuideLine = (lines, shape, direction) => {
  const horizontalDirection = isHorizontalDirection(direction)
  const possibleSnapPoints = horizontalDirection ? ['left', 'center', 'right'] : ['top', 'middle', 'bottom']
  const preexistingConstraint = horizontalDirection ? shape.xConstraint : shape.yConstraint
  // let's find the snap line / anchor combo with the shortest snapDistance
  return possibleSnapPoints.reduce((prev, anchor) => {
    const anchorPoint = anchorValue(shape, anchor)
    return lines
      .filter(line => {
        return !line.alignment || (!horizontalDirection || alignmentToHorizontalConstraint(line) === anchor) && (horizontalDirection || alignmentToVerticalConstraint(line) === anchor)
      })
      .reduce((prev, line) => {
        const perpendicularDistance = Math.abs(anchorPoint - (horizontalDirection ? line.x : line.y))
        const parallelDistance = sectionOvershoot(direction, shape, line)
        // ^ parallel distance from section edge is also important: pulling a shape off a guideline tangentially must remove the snapping
        const distance = Math.sqrt(Math.pow(parallelDistance, 2) + Math.pow(perpendicularDistance, 2)) // we could alternatively take the max of these two
        // distanceThreshold depends on whether we're engaging the snap or prying it apart - mainstream tools often have such a snap hysteresis
        const distanceThreshold = preexistingConstraint === line.key ? snapReleaseDistance : snapEngageDistance
        const closerLineFound = distance < prev.snapDistance && distance <= distanceThreshold
        return closerLineFound ? {snapLine: line, snapAnchor: anchor, snapDistance: distance} : prev
      }, prev)
  }, {snapLine: null, snapAnchor: null, snapDistance: Infinity})
}

const cursorPositionAction = action => action && action.actionType === 'cursorPosition' ? action.payload : null
const mouseEventAction = action => action && action.actionType === 'mouseEvent' ? action.payload : null
const shapeEventAction = action => action && action.actionType === 'shapeEvent' ? action.payload : null
const alignEventAction = action => action && action.actionType === 'align' ? action.payload : null

// a key based lookup of snap guide lines
const constraintLookup = shapes => {
  const constraints = {}
  shapes.filter(isLine).forEach(shape => constraints[shape.key] = shape)
  return constraints
}

// returns the currently dragged shape, or a falsey value otherwise
const draggingShape = (previousDraggedShape, shapes, hoveredShape, down) => {
  const dragInProgress = down && shapes.reduce((prev, next) => prev || next.beingDragged, false)
  return dragInProgress && (previousDraggedShape && shapes.find(shape => shape.key === previousDraggedShape.key) || hoveredShape)
}

// true if the two lines are parallel
const parallel = (line1, line2) => isHorizontal(line1) === isHorizontal(line2)

// returns those snap guidelines that may affect the draggedShape
const snapGuideLines = (shapes, draggedShape) => {
  // The guidelines may come from explicit guidelines (as in the mock of this PoC) or generated automatically in the future, so that dragging a
  // shape dynamically traces other shapes, flashing temporary alignment lines, example snap guides here: https://i.imgur.com/QKrK6.png
  const allGuideLines = allLines(shapes)
  return isLine(draggedShape)
    ? allGuideLines.filter(line => !parallel(line, draggedShape))
    : allGuideLines
}

// quick (to write) function for finding a shape by key, may be okay for up to ~100 shapes
const findShapeByKey = (shapes, key) => shapes.find(shape => shape.key === key)

// shape updates may include newly added shapes, deleted or modified shapes
const updateShapes = (preexistingShapes, shapeUpdates) => {
  // Shell function - this is now a simple OR ie. in the PoC it initializes with the given mock states and no more update happens.
  // A real function must handle additions, removals and updates, merging the new info into the current shape state.
  return preexistingShapes || shapeUpdates
}

const alignmentToHorizontalConstraint = constraint => enforceAlignment && constraint.alignment && ({alignRight: 'right', alignLeft: 'left', alignCenter: 'center', alignRemove: null})[constraint.alignment]
const alignmentToVerticalConstraint = constraint => enforceAlignment && constraint.alignment && ({alignRight: 'top', alignLeft: 'bottom', alignCenter: 'middle', alignRemove: null})[constraint.alignment]

// The horizontal dimension (x) is mainly constrained by, naturally, the xConstraint (vertical snap line), but if there's no xConstraint is present,
// then it still needs to observe whether a yConstraint (horizontal snap section) end vertex is breached - you can horizontally pull a rectangle off
// a horizontal line, and the snap needs to break/establish in this direction too. In other words, since the constraints are sections, not infinite lines,
// a constraining section applies to both dimensions.
const nextConstraintX = (xConstraint, yConstraint, previousShape) => {
  return xConstraint
    ? xConstraint.x - anchorOffset(previousShape, alignmentToHorizontalConstraint(xConstraint) || previousShape.xConstraintAnchor)
    : (yConstraint && (sectionConstrained('vertical', previousShape, yConstraint) - anchorOffset(previousShape, 'center')))
}

const nextConstraintY = (xConstraint, yConstraint, previousShape) => {
  return yConstraint
    ? yConstraint.y - anchorOffset(previousShape, alignmentToVerticalConstraint(yConstraint) || previousShape.yConstraintAnchor)
    : (xConstraint && (sectionConstrained('horizontal', previousShape, xConstraint) - anchorOffset(previousShape, 'middle')))
}

// this is the per-shape model update at the current PoC level
const nextShape = (previousShape, down, dragInProgress, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints) => {
  const beingDragged = down && previousShape.beingDragged || !dragInProgress && hoveredShape && previousShape.key === hoveredShape.key && down && dragStartCandidate
  const grabStart = !previousShape.beingDragged && beingDragged
  const grabOffsetX = grabStart ? previousShape.x - x0 : (previousShape.grabOffsetX || 0)
  const grabOffsetY = grabStart ? previousShape.y - y0 : (previousShape.grabOffsetY || 0)
  const unconstrainedX = beingDragged ? x1 + grabOffsetX : previousShape.x
  const unconstrainedY = beingDragged ? y1 + grabOffsetY : previousShape.y
  const xConstraintPrevious = constraints[previousShape.xConstraint]
  const yConstraintPrevious = constraints[previousShape.yConstraint]
  const xConstraint = nextConstraintX(xConstraintPrevious, yConstraintPrevious, previousShape)
  const yConstraint = nextConstraintY(xConstraintPrevious, yConstraintPrevious, previousShape)
  const newX = isNaN(xConstraint) ? unconstrainedX : xConstraint
  const newY = isNaN(yConstraint) ? unconstrainedY : yConstraint
  return Object.assign({}, previousShape, {
    x: snapToGrid(newX),
    y: snapToGrid(newY),
    unconstrainedX: unconstrainedX,
    unconstrainedY: unconstrainedY,
    width: snapToGridUp(previousShape.width),
    height: snapToGridUp(previousShape.height),
    beingDragged,
    grabOffsetX,
    grabOffsetY
  })
}

// this is _the_ state representation (at a PoC level...) comprising of transient properties eg. draggedShape, and the collection of shapes themselves
const nextScenegraph = (previous, externalShapeUpdates, cursor, dragStartCandidate, {x0, y0, x1, y1, down}, alignEvent) => {
  const shapes = updateShapes(previous.shapes, externalShapeUpdates)
  if(alignEvent) {
    const {event, shapeKey} = alignEvent
    const alignmentLine = findShapeByKey(shapes, shapeKey)
    alignmentLine.alignment = event !== 'alignRemove' && event
  }
  const hoveredShape = hoveringAt(shapes, cursor.x, cursor.y)
  const draggedShape = draggingShape(previous.draggedShape, shapes, hoveredShape, down)
  if(draggedShape) {
    const constrainedShape = findShapeByKey(shapes, draggedShape.key)
    const lines = snapGuideLines(shapes, draggedShape)
    const {snapLine: verticalSnap, snapAnchor: horizontAnchor} = snappingGuideLine(lines.filter(isVertical), draggedShape, 'horizontal')
    const {snapLine: horizontSnap, snapAnchor: verticalAnchor} = snappingGuideLine(lines.filter(isHorizontal), draggedShape, 'vertical')
    // todo: establish these constraints (or their lack thereof) via nextShape rather than with these direct assignments here:
    constrainedShape.xConstraint = verticalSnap && verticalSnap.key
    constrainedShape.yConstraint = horizontSnap && horizontSnap.key
    constrainedShape.xConstraintAnchor = horizontAnchor
    constrainedShape.yConstraintAnchor = verticalAnchor
  }
  const constraints = constraintLookup(shapes)
  const newState = {
    hoveredShape,
    draggedShape,
    shapes: shapes.map(shape => nextShape(shape, down, draggedShape, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints))
  }
  return newState
}


/**
 * Gestures - filters and finite state machine reducers, mostly
 */

// dispatch the various types of actions
const rawCursorPosition = map(
  cursorPositionAction
)(primaryActions)

const mouseEvent = map(
  mouseEventAction
)(primaryActions)

const shapeEvent = map(
  shapeEventAction
)(primaryActions)

const alignEvent = map(
  d => {return alignEventAction(d)}
)(primaryActions)

const cursorPosition = reduce(
  (previous, position) => position || previous,
  {x: 0, y: 0}
)(rawCursorPosition)

const mouseIsDown = reduce(
  (previous, next) => next && ['mouseUp', 'mouseDown'].indexOf(next.event) >= 0
    ? next.event === 'mouseDown'
    : previous,
  false
)(mouseEvent)

const mouseDowned = reduce(
  (previous, next) => !previous && next,
  false
)

const mouseClickEvent = map(
  event => event && event.event === 'mouseClick'
)(mouseEvent)

const dragGestureStartAt = reduce(
  (previous, down, {x, y}) => down ? (!previous.down ? {down, x0: x, y0: y} : previous) : {down: false},
  {down: false}
)(mouseIsDown, cursorPosition)

const dragGestures = map(
  ({down, x0, y0}, cursor) => ({down, x0, y0, x1: cursor.x, y1: cursor.y})
)(dragGestureStartAt, cursorPosition)

// the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
const dragStartCandidate = map(
  ({down, x0, y0, x1, y1}) => down && x0 === x1 && y0 === y1
)(dragGestures)


/**
 * Scenegraph update based on events, gestures...
 */

const selectedShape = reduce(
  (prev, next) => prev || next && (next.event === 'showToolbar' && next.shapeType === 'line' ? next.shapeKey : prev),
  null
)(shapeEvent)

// this is the core scenegraph update invocation: upon new cursor position etc. emit the new scenegraph
const currentShapes = reduce(
  (previous, externalShapeUpdates, cursor, dragStartCandidate, {x0, y0, x1, y1, down}, alignEvent) => {
    const shapes = updateShapes(previous.shapes, externalShapeUpdates)
    if(alignEvent) {
      const {event, shapeKey} = alignEvent
      const alignmentLine = findShapeByKey(shapes, shapeKey)
      alignmentLine.alignment = event !== 'alignRemove' && event
    }
    const hoveredShape = hoveringAt(shapes, cursor.x, cursor.y)
    const draggedShape = draggingShape(previous.draggedShape, shapes, hoveredShape, down)
    if(draggedShape) {
      const constrainedShape = findShapeByKey(shapes, draggedShape.key)
      const lines = snapGuideLines(shapes, draggedShape)
      const {snapLine: verticalSnap, snapAnchor: horizontAnchor} = snappingGuideLine(lines.filter(isVertical), draggedShape, 'horizontal')
      const {snapLine: horizontSnap, snapAnchor: verticalAnchor} = snappingGuideLine(lines.filter(isHorizontal), draggedShape, 'vertical')
      // todo: establish these constraints (or their lack thereof) via nextShape rather than with these direct assignments here:
      constrainedShape.xConstraint = verticalSnap && verticalSnap.key
      constrainedShape.yConstraint = horizontSnap && horizontSnap.key
      constrainedShape.xConstraintAnchor = horizontAnchor
      constrainedShape.yConstraintAnchor = verticalAnchor
    }
    const constraints = constraintLookup(shapes)
    const newState = {
      hoveredShape,
      draggedShape,
      shapes: shapes.map(shape => nextShape(shape, down, draggedShape, hoveredShape, dragStartCandidate, x0, y0, x1, y1, constraints))
    }
    return newState
  },
  {shapes: null, draggedShape: null}
)(shapeAdditions, cursorPosition, dragStartCandidate, dragGestures, alignEvent)

// the currently dragged shape is considered in-focus; if no dragging is going on, then the hovered shape
const focusedShape = map(
  ({draggedShape, hoveredShape}) => draggedShape || hoveredShape
)(currentShapes)

const dragStartAt = reduce(
  (previous, dragStartCandidate, {down, x0, y0, x1, y1}, focusedShape) => {
    // the cursor must be over the shape at the _start_ of the gesture (x0 === x1 && y0 === y1 good enough) when downing the mouse
    if(down) {
      const newDragStart = dragStartCandidate && !previous.down
      return newDragStart
        ? {down, x: x1, y: y1, dragStartShape: focusedShape}
        : previous
    } else {
      return {down: false}
    }
  },
  {down: false} // fixme check this init value
)(dragStartCandidate, dragGestures, focusedShape)

// free shapes are for showing the unconstrained location of the shape(s) being dragged
const currentFreeShapes = map(
  ({shapes}, {dragStartShape}) =>
    shapes
      .filter(shape => dragStartShape && shape.key === dragStartShape.key)
      .map(shape => Object.assign({}, shape, {x: shape.unconstrainedX, y: shape.unconstrainedY, z: freeDragZ, backgroundColor: 'rgba(0,0,0,0.03)'}))
)(currentShapes, dragStartAt)

// affordance for permanent selection of a shape
const newShapeEvent = map(
  (click, shape, {x, y}) => click && {event: 'showToolbar', x, y, shapeKey: shape && shape.key, shapeType: shape && shape.type}
)(mouseClickEvent, focusedShape, cursorPosition)


/**
 * Update fragments
 */

const metaCursorFrag = map(
  (cursor, mouseDown, dragStartAt) => {
    const thickness = mouseDown ? 8 : 1
    return renderMetaCursorFrag(cursor.x, cursor.y, dragStartAt && dragStartAt.dragStartShape, thickness, 'magenta')
  }
)(cursorPosition, mouseIsDown, dragStartAt)

const shapeFrags = map(
  ({shapes}, hoveredShape, dragStartAt, selectedShapeKey) => renderShapeFrags(shapes, hoveredShape, dragStartAt, selectedShapeKey)
)(currentShapes, focusedShape, dragStartAt, selectedShape)

const freeShapeFrags = map(
  shapes => renderShapeFrags(shapes, null, null, false)
)(currentFreeShapes)

const dragLineFrag = map(
  (cursor, dragStartAt) => {
    const origin = dragStartAt.down ? dragStartAt : cursor
    const lineAttribs = positionsToLineAttribsViewer(origin.x, origin.y, cursor.x, cursor.y)
    return renderDragLineFrag(lineAttribs.length, origin.x, origin.y, lineAttribs.angle)
  }
)(cursorPosition, dragStartAt)

const scenegraph = map(
  renderSubstrateFrag
)(shapeFrags, freeShapeFrags, metaCursorFrag, dragLineFrag)

const renderScene = each(
  (frag, newShapeEvent) => {
    render(frag, root)
    dispatchAsync('shapeEvent', newShapeEvent)
  }
)(scenegraph, newShapeEvent)

renderScene(state)