import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import cx from "classnames"

export default class ModelExample extends React.Component {
  static propTypes = {
    getComponent: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    schema: PropTypes.object.isRequired,
    example: PropTypes.any.isRequired,
    isExecute: PropTypes.bool,
    getConfigs: PropTypes.func.isRequired,
    specPath: ImPropTypes.list.isRequired,
    includeReadOnly: PropTypes.bool,
    includeWriteOnly: PropTypes.bool,
  }

  constructor(props, context) {
    super(props, context)
    let { getConfigs, isExecute } = this.props
    let { defaultModelRendering } = getConfigs()

    let activeTab = defaultModelRendering

    if (defaultModelRendering !== "example" && defaultModelRendering !== "model") {
      activeTab = "example"
    }

    if(isExecute) {
      activeTab = "example"
    }

    this.state = {
      activeTab,
    }
  }

  activeTab = ( e ) => {
    let { target : { dataset : { name } } } = e

    this.setState({
      activeTab: name
    })
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.isExecute &&
      !this.props.isExecute &&
      this.props.example
    ) {
      this.setState({ activeTab: "example" })
    }
  }

  render() {
    let { getComponent, specSelectors, schema, example, isExecute, getConfigs, specPath, includeReadOnly, includeWriteOnly } = this.props
    let { defaultModelExpandDepth } = getConfigs()
    const ModelWrapper = getComponent("ModelWrapper")
    const HighlightCode = getComponent("highlightCode")

    let isOAS3 = specSelectors.isOAS3()

    return (
      <div className="model-example">
        <ul className="tab" role="tablist">
          <li className={cx("tabitem", { "active": this.state.activeTab === "example" })} role="presentation">
            <button
              aria-selected={this.state.activeTab === "example"}
              className="tablinks"
              data-name="example"
              onClick={ this.activeTab }
              role="tab"
            >
              {isExecute ? "Edit Value" : "Example Value"}
            </button>
          </li>
          { schema && (
            <li className={cx("tabitem", { "active": ["model", "schema"].includes(this.state.activeTab) })} role="presentation">
              <button
                aria-selected={["model", "schema"].includes(this.state.activeTab)}
                className={ "tablinks" + ( isExecute ? " inactive" : "" )}
                data-name={isOAS3 ? "schema" : "model" }
                onClick={ this.activeTab }
                role="tab"
              >
                {isOAS3 ? "Schema" : "Model" }
              </button>
            </li>
          )}
        </ul>
        {this.state.activeTab === "example" && (
          <div data-name="examplePanel" role="tabpanel" aria-hidden={this.state.activeTab !== "example"} tabIndex="0">
            {example ? example : (
              <HighlightCode value="(no example available)" getConfigs={ getConfigs } />
            )}
          </div>
        )}

        {["model", "schema"].includes(this.state.activeTab) && (
          <div data-name={isOAS3 ? "schemaPanel" : "modelPanel" } role="tabpanel" aria-hidden={this.state.activeTab === "example"} tabIndex="0">
            <ModelWrapper
              schema={ schema }
              getComponent={ getComponent }
              getConfigs={ getConfigs }
              specSelectors={ specSelectors }
              expandDepth={ defaultModelExpandDepth }
              specPath={specPath}
              includeReadOnly = {includeReadOnly}
              includeWriteOnly = {includeWriteOnly}
            />
          </div>
        )}
      </div>
    )
  }

}
