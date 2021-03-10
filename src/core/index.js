import deepExtend from "deep-extend"

import System from "./system"
import ApisPreset from "./presets/apis"
import AllPlugins from "./plugins/all"
import { parseSearch } from "./utils"
import win from "./window"

if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  win.Perf = require("react-dom/lib/ReactPerf")
}

// eslint-disable-next-line no-undef
const { GIT_DIRTY, GIT_COMMIT, PACKAGE_VERSION, HOSTNAME, BUILD_TIME } = buildInfo

export default function SwaggerUI(opts) {

  win.versions = win.versions || {}
  win.versions.swaggerUi = {
    version: PACKAGE_VERSION,
    gitRevision: GIT_COMMIT,
    gitDirty: GIT_DIRTY,
    buildTimestamp: BUILD_TIME,
    machine: HOSTNAME
  }

  const defaults = {
    // Some general settings, that we floated to the top
    dom_id: null, // eslint-disable-line camelcase
    domNode: null,
    spec: {},
    url: "",
    urls: null,
    layout: "BaseLayout",
    docExpansion: "list",
    maxDisplayedTags: null,
    filter: null,
    validatorUrl: "https://validator.swagger.io/validator",
    oauth2RedirectUrl: `${window.location.protocol}//${window.location.host}/oauth2-redirect.html`,
    persistAuthorization: false,
    configs: {},
    custom: {},
    displayOperationId: false,
    displayRequestDuration: false,
    deepLinking: false,
    tryItOutEnabled: false,
    requestInterceptor: (a => a),
    responseInterceptor: (a => a),
    showMutatedRequest: true,
    defaultModelRendering: "example",
    defaultModelExpandDepth: 1,
    defaultModelsExpandDepth: 1,
    showExtensions: false,
    showCommonExtensions: false,
    withCredentials: undefined,
    requestSnippetsEnabled: false,
    supportedSubmitMethods: [
      "get",
      "put",
      "post",
      "delete",
      "options",
      "head",
      "patch",
      "trace"
    ],

    // Initial set of plugins ( TODO rename this, or refactor - we don't need presets _and_ plugins. Its just there for performance.
    // Instead, we can compile the first plugin ( it can be a collection of plugins ), then batch the rest.
    presets: [
      ApisPreset
    ],

    // Plugins; ( loaded after presets )
    plugins: [
    ],

    // Initial state
    initialState: { },

    // Inline Plugin
    fn: { },
    components: { },

    syntaxHighlight: {
      activated: true,
      theme: "agate"
    },

    // Features - features that can be enabled on runtime or by configuration
    features: {
      presets: {
        tryItOutEnabled: {
          info: {
            title: "Try It Out Enabled",
            description: "Enables Try It Out by default for all operations."
          },
          enabled: false,
        },
        persistAuthorization: {
          info: {
            title: "Persist Authorization",
            description: "Persists authorization data that would be lost on browser close or on refresh."
          },
          enabled: false,
        },
        filter: {
          info: {
            title: "Tag Filter",
            description: "Enables a search bar to filter operations by tag name."
          },
          enabled: false,
        },
        requestSnippets: {
          info: {
            title: "Request Snippets",
            description: "With Request Snippets the Curl request generator is replaced, instead you are now optioned multiple target languages(cURL for bash, powershell, cmd and in addition Node.JS)"
          },
          enabled: false,
          state: {
            generators: {
              "curl_bash": {
                title: "cURL (bash)",
                syntax: "bash"
              },
              "curl_powershell": {
                title: "cURL (PowerShell)",
                syntax: "powershell"
              },
              "curl_cmd": {
                title: "cURL (CMD)",
                syntax: "bash"
              },
              "node_native": {
                title: "Node.js (Native)",
                syntax: "javascript"
              },
            },
            defaultExpanded: true,
            languagesMask: null, // e.g. only show curl bash = ["curl_bash"]
          }
        },
      },
      staticPresets: [], // e.g. exclude filter from user changeable settings: ["filter"]
      enabled: true,
    }
  }

  let queryConfig = parseSearch()

  const domNode = opts.domNode
  delete opts.domNode

  const constructorConfig = deepExtend({}, defaults, opts, queryConfig)

  const isEnabled = (key) => constructorConfig[key] === true || constructorConfig[key] === "true"

  const features = deepExtend({}, constructorConfig.features, {
    presets: {
      tryItOutEnabled: {
        enabled: isEnabled("tryItOutEnabled")
      },
      persistAuthorization: {
        enabled: isEnabled("persistAuthorizationOutEnabled")
      },
      filter: {
        enabled: !(constructorConfig.filter === null || constructorConfig.filter === false || constructorConfig.filter === "false")
      },
      requestSnippets: {
        enabled: isEnabled("requestSnippetsEnabled")
      }
    }
  })
  const getFeaturesStates = () => {
    const dict = {}
    if(!features || !features.presets) {
      return dict
    }
    for (const key in features.presets) {
      if(!features.presets.hasOwnProperty(key)) {
        continue
      }
      if(!features.presets[key].state) {
        continue
      }
      dict[key] = features.presets[key].state
    }
    return dict
  }
  SwaggerUI.features = features
  const storeConfigs = {
    system: {
      configs: constructorConfig.configs
    },
    plugins: constructorConfig.presets,
    state: deepExtend({
      layout: {
        layout: constructorConfig.layout,
        filter: constructorConfig.filter
      },
      spec: {
        spec: "",
        url: constructorConfig.url
      },
      features,
    }, getFeaturesStates(), constructorConfig.initialState)
  }

  if(constructorConfig.initialState) {
    // if the user sets a key as `undefined`, that signals to us that we
    // should delete the key entirely.
    // known usage: Swagger-Editor validate plugin tests
    for (var key in constructorConfig.initialState) {
      if(
        Object.prototype.hasOwnProperty.call(constructorConfig.initialState, key)
        && constructorConfig.initialState[key] === undefined
      ) {
        delete storeConfigs.state[key]
      }
    }
  }

  let inlinePlugin = ()=> {
    return {
      fn: constructorConfig.fn,
      components: constructorConfig.components,
      state: constructorConfig.state,
    }
  }

  var store = new System(storeConfigs)
  store.register([constructorConfig.plugins, inlinePlugin])

  var system = store.getSystem()

  const downloadSpec = (fetchedConfig) => {
    let localConfig = system.specSelectors.getLocalConfig ? system.specSelectors.getLocalConfig() : {}
    let mergedConfig = deepExtend({}, localConfig, constructorConfig, fetchedConfig || {}, queryConfig)

    // deep extend mangles domNode, we need to set it manually
    if(domNode) {
      mergedConfig.domNode = domNode
    }

    store.setConfigs(mergedConfig)
    system.configsActions.loaded()

    if (fetchedConfig !== null) {
      if (!queryConfig.url && typeof mergedConfig.spec === "object" && Object.keys(mergedConfig.spec).length) {
        system.specActions.updateUrl("")
        system.specActions.updateLoadingStatus("success")
        system.specActions.updateSpec(JSON.stringify(mergedConfig.spec))
      } else if (system.specActions.download && mergedConfig.url && !mergedConfig.urls) {
        system.specActions.updateUrl(mergedConfig.url)
        system.specActions.download(mergedConfig.url)
      }
    }

    if(mergedConfig.domNode) {
      system.render(mergedConfig.domNode, "App")
    } else if(mergedConfig.dom_id) {
      let domNode = document.querySelector(mergedConfig.dom_id)
      system.render(domNode, "App")
    } else if(mergedConfig.dom_id === null || mergedConfig.domNode === null) {
      // do nothing
      // this is useful for testing that does not need to do any rendering
    } else {
      console.error("Skipped rendering: no `dom_id` or `domNode` was specified")
    }

    return system
  }

  const configUrl = queryConfig.config || constructorConfig.configUrl

  if (configUrl && system.specActions && system.specActions.getConfigByUrl) {
    system.specActions.getConfigByUrl({
      url: configUrl,
      loadRemoteConfig: true,
      requestInterceptor: constructorConfig.requestInterceptor,
      responseInterceptor: constructorConfig.responseInterceptor,
    }, downloadSpec)
  } else {
    return downloadSpec()
  }

  return system
}

// Add presets
SwaggerUI.presets = {
  apis: ApisPreset,
}

// All Plugins
SwaggerUI.plugins = AllPlugins
