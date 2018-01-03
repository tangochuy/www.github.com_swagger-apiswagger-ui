import React from "react"
import ImmutablePureComponent from "react-immutable-pure-component"
import ImPropTypes from "react-immutable-proptypes"
import PropTypes from "prop-types"

export default class Model extends ImmutablePureComponent {
  static propTypes = {
    schema: ImPropTypes.orderedMap.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    name: PropTypes.string,
    isRef: PropTypes.bool,
    required: PropTypes.bool,
    expandDepth: PropTypes.number,
    depth: PropTypes.number,
    specPath: ImPropTypes.list.isRequired,
  }

  getModelName =( ref )=> {
    if ( ref.indexOf("#/definitions/") !== -1 ) {
      return ref.replace(/^.*#\/definitions\//, "")
    }

    if ( ref.indexOf("#/components/schemas/") !== -1 ) {
      return ref.replace("#/components/schemas/", "")
    }
  }

  getRefSchema =( model )=> {
    let { specSelectors } = this.props

    return specSelectors.findDefinition(model)
  }

  render () {
    let { getComponent, getConfigs, specSelectors, schema, required, name, isRef, specPath } = this.props
    const ObjectModel = getComponent("ObjectModel")
    const ArrayModel = getComponent("ArrayModel")
    const PrimitiveModel = getComponent("PrimitiveModel")
    let type = "object"
    let $$ref = schema && schema.get("$$ref")

    // If we weren't passed a `name` but have a ref, grab the name from the ref
    if ( !name && $$ref ) {
      name = this.getModelName( $$ref )
    }

    // If we weren't passed a `schema` but have a ref, grab the schema from the ref
    if ( !schema && $$ref ) {
      schema = this.getRefSchema( name )
    }

    const deprecated = specSelectors.isOAS3() && schema.get("deprecated")
    isRef = isRef !== undefined ? isRef : !!$$ref
    type = schema && schema.get("type") || type

    switch(type) {
      case "object":
        return <ObjectModel
          className="object" { ...this.props }
          deprecated={deprecated}
          getConfigs={ getConfigs }
          isRef={ isRef }
          name={ name }
          schema={ schema }
          specPath={specPath} />
      case "array":
        return <ArrayModel
          className="array" { ...this.props }
          deprecated={deprecated}
          getConfigs={ getConfigs }
          name={ name }
          required={ required }
          schema={ schema } />
      case "string":
      case "number":
      case "integer":
      case "boolean":
      default:
        return <PrimitiveModel
          { ...this.props }
          deprecated={deprecated}
          getComponent={ getComponent }
          getConfigs={ getConfigs }
          name={ name }
          required={ required }
          schema={ schema }/>
    }
  }
}
